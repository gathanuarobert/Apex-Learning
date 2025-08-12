from django.db import models
from django.conf import settings
import uuid
from decimal import Decimal

class Payment(models.Model):
    """
    Raw M-Pesa / provider payment attempt record.
    Purpose shows whether it's a wallet top-up or a one-time purchase.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    PURPOSE_CHOICES = [
        ('deposit', 'Wallet Deposit'),
        ('purchase', 'One-time Purchase'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    # For one-time purchases: link to resource (resource_id/resource_type)
    resource_id = models.CharField(max_length=255, blank=True, null=True)
    resource_type = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, unique=True, blank=True, null=True)  # CheckoutRequestID etc
    provider_response = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} - {self.purpose} - {self.amount} ({self.status})"


class Wallet(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wallet"
    )
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0.00"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def deposit(self, amount):
        self.balance = self.balance + Decimal(amount)
        self.save()

    def withdraw(self, amount):
        if self.balance >= Decimal(amount):
            self.balance = self.balance - Decimal(amount)
            self.save()
            return True
        return False

    def __str__(self):
        return f"{self.user} - Balance: {self.balance}"


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ("deposit", "Deposit"),
        ("withdrawal", "Withdrawal"),
        ("download", "Download"),
        ("purchase", "Purchase"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions"
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    # optional link to resource for download/purchase transactions
    resource_id = models.CharField(max_length=255, blank=True, null=True)
    resource_type = models.CharField(max_length=100, blank=True, null=True)
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name="transactions")
    created_at = models.DateTimeField(auto_now_add=True)

    def mark_completed(self):
        self.status = "completed"
        self.save()

    def mark_failed(self):
        self.status = "failed"
        self.save()

    def __str__(self):
        return f"{self.user} - {self.transaction_type} - {self.amount} ({self.status})"
