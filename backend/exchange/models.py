import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Provider(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    base_url = models.CharField(max_length=500)
    api_key_env_name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['priority']

    def __str__(self):
        return self.name


class FeeConfig(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    percentage = models.DecimalField(max_digits=5, decimal_places=4)
    fixed_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency_code = models.CharField(max_length=10)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ExchangeProviderResponse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.ForeignKey(Provider, on_delete=models.PROTECT)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    request_url = models.CharField(max_length=1000)
    raw_response_body = models.JSONField()
    http_status_code = models.IntegerField()
    response_time_ms = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.provider.name} response {self.id}"


class Currency(models.Model):
    code = models.CharField(max_length=10, primary_key=True)
    name = models.CharField(max_length=200)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"


class Quote(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PENDING = 'PENDING', 'Pending'
        COMPLETED = 'COMPLETED', 'Completed'
        EXPIRED = 'EXPIRED', 'Expired'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.PROTECT)
    provider = models.ForeignKey(Provider, on_delete=models.PROTECT)
    fee_config = models.ForeignKey(FeeConfig, on_delete=models.PROTECT)
    provider_response = models.ForeignKey(ExchangeProviderResponse, on_delete=models.PROTECT)
    source_currency = models.CharField(max_length=10)
    target_currency = models.CharField(max_length=10)
    exchange_rate = models.DecimalField(max_digits=20, decimal_places=8)
    amount_sent = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    fee_amount = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    amount_received = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    expires_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quote {self.id} ({self.source_currency} → {self.target_currency})"
