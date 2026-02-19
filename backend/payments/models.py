from django.db import models, transaction
from django.conf import settings
import uuid
from decimal import Decimal

User = settings.AUTH_USER_MODEL


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
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    # For one-time purchases: link to resource (resource_id/resource_type)
    resource_id = models.CharField(max_length=255, blank=True, null=True)
    resource_type = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    provider_response = models.JSONField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} - {self.purpose} - {self.amount} ({self.status})"


class Wallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="wallet")
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def deposit(self, amount: Decimal, payment=None):
        """
        Deposit money into the wallet and log a transaction.
        Usually triggered after a successful M-Pesa/Card top-up.
        """
        with transaction.atomic():
            self.balance += amount
            self.save()

            Transaction.objects.create(
                user=self.user,
                transaction_type="deposit",
                amount=amount,
                status="completed",
                payment=payment,  # optional link back to Payment
            )

    def purchase(self, amount: Decimal, resource=None, resource_type=None):
        """
        Deduct money from the wallet when making a purchase.
        """
        if self.balance < amount:
            raise ValueError("Insufficient wallet balance")

        with transaction.atomic():
            self.balance -= amount
            self.save()

            Transaction.objects.create(
                user=self.user,
                transaction_type="purchase",
                amount=amount,
                status="completed",
                resource_id=getattr(resource, "id", None),
                resource_type=resource_type,
            )

    def __str__(self):
        return f"{self.user} - Balance: {self.balance}"


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ("deposit", "Deposit"),
        ("purchase", "Purchase"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, default="pending")
    payment = models.ForeignKey("Payment", on_delete=models.SET_NULL, null=True, blank=True)
    resource_id = models.UUIDField(null=True, blank=True)
    resource_type = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.transaction_type} - {self.amount}"
