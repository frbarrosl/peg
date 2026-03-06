import json
from decimal import Decimal
from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from exchange.models import ExchangeProviderResponse, FeeConfig, Provider, Quote

User = get_user_model()

GQL_URL = "/graphql/"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username="testuser", email="test@example.com", password="testpass123"
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(
        username="otheruser", email="other@example.com", password="testpass123"
    )


@pytest.fixture
def provider(db):
    return Provider.objects.create(
        name="Test Provider",
        base_url="https://v6.exchangerate-api.com/v6",
        api_key_env_name="EXCHANGERATE_API_KEY",
        is_active=True,
        priority=1,
    )


@pytest.fixture
def fee_config(db):
    return FeeConfig.objects.create(
        name="Standard Fee",
        percentage=Decimal("1.5000"),
        fixed_amount=Decimal("2.00"),
        currency_code="USD",
        is_active=True,
    )


@pytest.fixture
def provider_response(db, provider, user):
    return ExchangeProviderResponse.objects.create(
        provider=provider,
        user=user,
        request_url="https://v6.exchangerate-api.com/v6/test/pair/USD/EUR/1",
        raw_response_body={"result": "success", "conversion_rate": 0.92},
        http_status_code=200,
        response_time_ms=120,
    )


@pytest.fixture
def draft_quote(db, user, provider, fee_config, provider_response):
    return Quote.objects.create(
        user=user,
        provider=provider,
        fee_config=fee_config,
        provider_response=provider_response,
        source_currency="USD",
        target_currency="EUR",
        exchange_rate=Decimal("0.92"),
        status=Quote.Status.DRAFT,
        expires_at=timezone.now() + timedelta(minutes=5),
    )


@pytest.fixture
def expired_draft_quote(db, user, provider, fee_config, provider_response):
    return Quote.objects.create(
        user=user,
        provider=provider,
        fee_config=fee_config,
        provider_response=provider_response,
        source_currency="USD",
        target_currency="EUR",
        exchange_rate=Decimal("0.92"),
        status=Quote.Status.DRAFT,
        expires_at=timezone.now() - timedelta(minutes=1),
    )


@pytest.fixture
def client():
    return Client()


# ---------------------------------------------------------------------------
# Helpers (importable by test modules)
# ---------------------------------------------------------------------------


def gql(client, query, variables=None, headers=None):
    """POST a GraphQL query/mutation to /graphql/ and return parsed JSON."""
    body = {"query": query}
    if variables:
        body["variables"] = variables
    kwargs = {"data": json.dumps(body), "content_type": "application/json"}
    if headers:
        kwargs.update(headers)
    response = client.post(GQL_URL, **kwargs)
    return response.json()


def get_jwt_token(client, username="testuser", password="testpass123"):
    """Return a JWT token for the given credentials via tokenAuth mutation."""
    result = gql(
        client,
        """
        mutation($username: String!, $password: String!) {
            tokenAuth(username: $username, password: $password) {
                token
            }
        }
        """,
        {"username": username, "password": password},
    )
    return result["data"]["tokenAuth"]["token"]
