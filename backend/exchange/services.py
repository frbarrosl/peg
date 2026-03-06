import os
import time
import requests
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from .models import Provider, FeeConfig, ExchangeProviderResponse, Quote

QUOTE_EXPIRY_MINUTES = 5


def get_active_provider():
    return Provider.objects.filter(is_active=True).order_by('priority').first()


def get_active_fee():
    return FeeConfig.objects.filter(is_active=True).order_by('-created_at').first()


def fetch_exchange_rate(provider, source_currency, target_currency, user):
    api_key = os.environ.get(provider.api_key_env_name)
    if not api_key:
        raise Exception(f"API key not configured for provider '{provider.name}'.")

    url = f"{provider.base_url}/{api_key}/pair/{source_currency}/{target_currency}/1"

    start = time.time()
    try:
        response = requests.get(url, timeout=10)
    except requests.RequestException as e:
        raise Exception(f"Failed to reach exchange rate provider: {e}")
    elapsed_ms = int((time.time() - start) * 1000)

    try:
        body = response.json()
    except Exception:
        body = {}

    log = ExchangeProviderResponse.objects.create(
        provider=provider,
        user=user,
        request_url=url,
        raw_response_body=body,
        http_status_code=response.status_code,
        response_time_ms=elapsed_ms,
    )

    if response.status_code != 200 or body.get('result') != 'success':
        raise Exception(body.get('error-type', 'Exchange rate provider returned an error.'))

    return Decimal(str(body['conversion_rate'])), log


def create_draft_quote(user, source_currency, target_currency):
    provider = get_active_provider()
    if not provider:
        raise Exception("No active exchange provider configured.")

    fee_config = get_active_fee()
    if not fee_config:
        raise Exception("No active fee configuration found.")

    exchange_rate, provider_log = fetch_exchange_rate(provider, source_currency, target_currency, user)

    quote = Quote.objects.create(
        user=user,
        provider=provider,
        fee_config=fee_config,
        provider_response=provider_log,
        source_currency=source_currency,
        target_currency=target_currency,
        exchange_rate=exchange_rate,
        status=Quote.Status.DRAFT,
        expires_at=timezone.now() + timedelta(minutes=QUOTE_EXPIRY_MINUTES),
    )
    return quote


def confirm_quote(quote, amount_sent):
    # Check expiry
    if quote.expires_at and quote.expires_at < timezone.now():
        quote.status = Quote.Status.EXPIRED
        quote.save(update_fields=['status'])
        return None, True  # (quote, expired)

    fee_config = quote.fee_config
    amount_sent = Decimal(str(amount_sent))
    fee_amount = (amount_sent * fee_config.percentage / 100) + fee_config.fixed_amount
    amount_received = (amount_sent - fee_amount) * quote.exchange_rate

    quote.amount_sent = amount_sent
    quote.fee_amount = fee_amount
    quote.amount_received = amount_received
    quote.status = Quote.Status.PENDING
    quote.save()
    return quote, False  # (quote, expired)
