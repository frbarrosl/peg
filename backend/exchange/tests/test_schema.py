"""
GraphQL integration tests for the exchange app.

Uses Django's test client posting JSON to /graphql/.
External HTTP calls are mocked to avoid hitting the live exchange rate API.
"""
import sys
import os

# Ensure conftest helpers are importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest
from decimal import Decimal
from unittest.mock import patch, MagicMock

from django.contrib.auth import get_user_model

from exchange.models import Currency, Quote
from conftest import gql, get_jwt_token

User = get_user_model()

# ---------------------------------------------------------------------------
# Shared GraphQL strings
# ---------------------------------------------------------------------------

REQUEST_QUOTE = """
mutation($sourceCurrency: String!, $targetCurrency: String!) {
    requestQuote(sourceCurrency: $sourceCurrency, targetCurrency: $targetCurrency) {
        success
        errors
        quote { id status exchangeRate sourceCurrency targetCurrency }
    }
}
"""

CONFIRM_QUOTE = """
mutation($quoteId: ID!, $amountSent: Float!) {
    confirmQuote(quoteId: $quoteId, amountSent: $amountSent) {
        success
        errors
        quoteExpired
        quote { id status amountSent feeAmount amountReceived }
    }
}
"""

UPDATE_DRAFT = """
mutation($quoteId: ID!, $amountSent: Float!) {
    updateDraftQuote(quoteId: $quoteId, amountSent: $amountSent) {
        success
        errors
        quote { id amountSent }
    }
}
"""

MY_TRANSACTIONS = """
query {
    myTransactions {
        id
        status
        sourceCurrency
        targetCurrency
    }
}
"""

CURRENCIES_QUERY = """
query {
    currencies {
        code
        name
    }
}
"""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _mock_create_draft(user, source, target, *, provider, fee_config, provider_response):
    """Return a real Quote object without hitting the external API."""
    from django.utils import timezone
    from datetime import timedelta
    return Quote.objects.create(
        user=user,
        provider=provider,
        fee_config=fee_config,
        provider_response=provider_response,
        source_currency=source,
        target_currency=target,
        exchange_rate=Decimal("0.92"),
        status=Quote.Status.DRAFT,
        expires_at=timezone.now() + timedelta(minutes=5),
    )


# ---------------------------------------------------------------------------
# currencies query
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_currencies_query(client):
    Currency.objects.create(code="USD", name="US Dollar")
    Currency.objects.create(code="EUR", name="Euro")
    result = gql(client, CURRENCIES_QUERY)
    codes = [c["code"] for c in result["data"]["currencies"]]
    assert "USD" in codes
    assert "EUR" in codes


# ---------------------------------------------------------------------------
# requestQuote mutation
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_request_quote_unauthenticated(client):
    result = gql(client, REQUEST_QUOTE, {"sourceCurrency": "USD", "targetCurrency": "EUR"})
    data = result["data"]["requestQuote"]
    assert data["success"] is False
    assert "Authentication required" in data["errors"][0]


@pytest.mark.django_db
def test_request_quote_authenticated(client, user, provider, fee_config, provider_response):
    token = get_jwt_token(client)

    def fake_create(u, src, tgt):
        return _mock_create_draft(u, src, tgt,
                                  provider=provider,
                                  fee_config=fee_config,
                                  provider_response=provider_response)

    with patch("exchange.schema.create_draft_quote", side_effect=fake_create):
        result = gql(
            client,
            REQUEST_QUOTE,
            {"sourceCurrency": "USD", "targetCurrency": "EUR"},
            headers={"HTTP_AUTHORIZATION": f"JWT {token}"},
        )

    data = result["data"]["requestQuote"]
    assert data["success"] is True
    assert data["quote"]["status"] == "DRAFT"
    assert data["quote"]["sourceCurrency"] == "USD"


# ---------------------------------------------------------------------------
# updateDraftQuote mutation
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_update_draft_quote(client, user, draft_quote):
    token = get_jwt_token(client)
    result = gql(
        client,
        UPDATE_DRAFT,
        {"quoteId": str(draft_quote.id), "amountSent": 150.0},
        headers={"HTTP_AUTHORIZATION": f"JWT {token}"},
    )
    data = result["data"]["updateDraftQuote"]
    assert data["success"] is True
    draft_quote.refresh_from_db()
    assert float(draft_quote.amount_sent) == pytest.approx(150.0)


@pytest.mark.django_db
def test_update_draft_quote_wrong_user(client, other_user, draft_quote):
    # other_user tries to update a quote owned by user
    token = get_jwt_token(client, username="otheruser")
    result = gql(
        client,
        UPDATE_DRAFT,
        {"quoteId": str(draft_quote.id), "amountSent": 150.0},
        headers={"HTTP_AUTHORIZATION": f"JWT {token}"},
    )
    data = result["data"]["updateDraftQuote"]
    assert data["success"] is False
    assert "not found" in data["errors"][0].lower()


# ---------------------------------------------------------------------------
# confirmQuote mutation
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_confirm_quote_success(client, user, draft_quote):
    token = get_jwt_token(client)
    result = gql(
        client,
        CONFIRM_QUOTE,
        {"quoteId": str(draft_quote.id), "amountSent": 100.0},
        headers={"HTTP_AUTHORIZATION": f"JWT {token}"},
    )
    data = result["data"]["confirmQuote"]
    assert data["success"] is True
    assert data["quoteExpired"] is False
    assert data["quote"]["status"] == "PENDING"
    assert float(data["quote"]["amountSent"]) == pytest.approx(100.0)
    # fee = (100 * 1.5/100) + 2 = 3.50
    assert float(data["quote"]["feeAmount"]) == pytest.approx(3.50)


@pytest.mark.django_db
def test_confirm_quote_expired(client, user, expired_draft_quote, provider, fee_config, provider_response):
    token = get_jwt_token(client)

    def fake_create(u, src, tgt):
        return _mock_create_draft(u, src, tgt,
                                  provider=provider,
                                  fee_config=fee_config,
                                  provider_response=provider_response)

    with patch("exchange.schema.create_draft_quote", side_effect=fake_create):
        result = gql(
            client,
            CONFIRM_QUOTE,
            {"quoteId": str(expired_draft_quote.id), "amountSent": 100.0},
            headers={"HTTP_AUTHORIZATION": f"JWT {token}"},
        )

    data = result["data"]["confirmQuote"]
    assert data["success"] is False
    assert data["quoteExpired"] is True
    assert data["quote"]["status"] == "DRAFT"

    expired_draft_quote.refresh_from_db()
    assert expired_draft_quote.status == Quote.Status.EXPIRED


@pytest.mark.django_db
def test_confirm_quote_wrong_user(client, other_user, draft_quote):
    token = get_jwt_token(client, username="otheruser")
    result = gql(
        client,
        CONFIRM_QUOTE,
        {"quoteId": str(draft_quote.id), "amountSent": 100.0},
        headers={"HTTP_AUTHORIZATION": f"JWT {token}"},
    )
    data = result["data"]["confirmQuote"]
    assert data["success"] is False
    assert "not found" in data["errors"][0].lower()


# ---------------------------------------------------------------------------
# myTransactions query
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_my_transactions_unauthenticated(client):
    result = gql(client, MY_TRANSACTIONS)
    assert result["data"]["myTransactions"] == []


@pytest.mark.django_db
def test_my_transactions_shows_pending_and_completed(client, user, provider, fee_config, provider_response):
    from django.utils import timezone
    from datetime import timedelta

    def make_quote(status):
        return Quote.objects.create(
            user=user,
            provider=provider,
            fee_config=fee_config,
            provider_response=provider_response,
            source_currency="USD",
            target_currency="EUR",
            exchange_rate=Decimal("0.92"),
            status=status,
            expires_at=timezone.now() + timedelta(minutes=5),
        )

    pending = make_quote(Quote.Status.PENDING)
    completed = make_quote(Quote.Status.COMPLETED)
    draft = make_quote(Quote.Status.DRAFT)
    expired = make_quote(Quote.Status.EXPIRED)

    token = get_jwt_token(client)
    result = gql(client, MY_TRANSACTIONS, headers={"HTTP_AUTHORIZATION": f"JWT {token}"})
    ids = [tx["id"] for tx in result["data"]["myTransactions"]]

    assert str(pending.id) in ids
    assert str(completed.id) in ids
    assert str(draft.id) not in ids
    assert str(expired.id) not in ids
