"""
Unit tests for exchange/services.py.

All HTTP calls to the external rate API are mocked — no network required.
"""
import pytest
from decimal import Decimal
from datetime import timedelta
from unittest.mock import MagicMock, patch

from django.utils import timezone

from exchange.models import ExchangeProviderResponse, Quote
from exchange.services import (
    QUOTE_EXPIRY_MINUTES,
    confirm_quote,
    create_draft_quote,
    fetch_exchange_rate,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

MOCK_RATE = Decimal("0.92")


def _mock_response(rate=MOCK_RATE, status_code=200, result="success"):
    """Build a mock requests.Response-like object."""
    mock = MagicMock()
    mock.status_code = status_code
    mock.json.return_value = {"result": result, "conversion_rate": float(rate)}
    return mock


# ---------------------------------------------------------------------------
# fetch_exchange_rate
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_fetch_exchange_rate_missing_api_key(provider, user):
    with patch.dict("os.environ", {}, clear=True):
        # Ensure the key is absent
        import os
        os.environ.pop(provider.api_key_env_name, None)
        with pytest.raises(Exception, match="API key not configured"):
            fetch_exchange_rate(provider, "USD", "EUR", user)


@pytest.mark.django_db
def test_fetch_exchange_rate_api_error(provider, user):
    with patch("exchange.services.requests.get") as mock_get:
        mock_get.return_value = _mock_response(status_code=422, result="error")
        with pytest.raises(Exception):
            fetch_exchange_rate(provider, "USD", "EUR", user)


@pytest.mark.django_db
def test_fetch_exchange_rate_logs_response(provider, user):
    with patch("exchange.services.requests.get") as mock_get, \
         patch.dict("os.environ", {provider.api_key_env_name: "fake-key"}):
        mock_get.return_value = _mock_response()
        rate, log = fetch_exchange_rate(provider, "USD", "EUR", user)
        assert isinstance(log, ExchangeProviderResponse)
        assert log.provider == provider
        assert log.http_status_code == 200
        assert rate == MOCK_RATE


# ---------------------------------------------------------------------------
# create_draft_quote
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_create_draft_quote_success(user, provider, fee_config):
    with patch("exchange.services.requests.get") as mock_get, \
         patch.dict("os.environ", {provider.api_key_env_name: "fake-key"}):
        mock_get.return_value = _mock_response()
        before = timezone.now()
        quote = create_draft_quote(user, "USD", "EUR")

    assert quote.status == Quote.Status.DRAFT
    assert quote.exchange_rate == MOCK_RATE
    assert quote.source_currency == "USD"
    assert quote.target_currency == "EUR"
    assert quote.user == user
    # expires_at should be ~5 minutes from creation
    assert quote.expires_at is not None
    delta = quote.expires_at - before
    assert timedelta(minutes=QUOTE_EXPIRY_MINUTES - 1) < delta < timedelta(minutes=QUOTE_EXPIRY_MINUTES + 1)


@pytest.mark.django_db
def test_create_draft_quote_no_provider(db, user, fee_config):
    # No provider in DB → should raise
    with pytest.raises(Exception, match="No active exchange provider"):
        create_draft_quote(user, "USD", "EUR")


@pytest.mark.django_db
def test_create_draft_quote_no_fee_config(user, provider):
    # Provider exists but no fee config
    with patch("exchange.services.requests.get") as mock_get, \
         patch.dict("os.environ", {provider.api_key_env_name: "fake-key"}):
        mock_get.return_value = _mock_response()
        with pytest.raises(Exception, match="No active fee configuration"):
            create_draft_quote(user, "USD", "EUR")


# ---------------------------------------------------------------------------
# confirm_quote
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_confirm_quote_success(draft_quote):
    amount_sent = Decimal("100.00")
    updated, expired = confirm_quote(draft_quote, amount_sent)

    assert expired is False
    assert updated.status == Quote.Status.PENDING
    assert updated.amount_sent == amount_sent

    fee_config = draft_quote.fee_config
    expected_fee = (amount_sent * fee_config.percentage / 100) + fee_config.fixed_amount
    expected_received = (amount_sent - expected_fee) * draft_quote.exchange_rate

    assert updated.fee_amount == expected_fee
    assert updated.amount_received == expected_received


@pytest.mark.django_db
def test_confirm_quote_fee_calculation(draft_quote):
    # fee = (100 * 1.5/100) + 2.00 = 1.50 + 2.00 = 3.50
    # received = (100 - 3.50) * 0.92 = 96.50 * 0.92 = 88.78
    updated, _ = confirm_quote(draft_quote, Decimal("100.00"))
    assert updated.fee_amount == Decimal("3.50")
    assert updated.amount_received == Decimal("88.7800")


@pytest.mark.django_db
def test_confirm_quote_expired(expired_draft_quote):
    quote, expired = confirm_quote(expired_draft_quote, Decimal("100.00"))

    assert expired is True
    assert quote is None
    expired_draft_quote.refresh_from_db()
    assert expired_draft_quote.status == Quote.Status.EXPIRED
