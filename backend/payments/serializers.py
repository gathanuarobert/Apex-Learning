from rest_framework import serializers
from .models import Payment, Wallet, Transaction
import re


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = [
            "status",
            "transaction_id",
            "provider_response",
            "created_at",
            "updated_at",
            "purpose",
            "resource_id",
            "resource_type",
        ]

    def validate_phone_number(self, value):
        """
        Normalize and validate phone numbers.
        Accepted formats: +2547..., 2547..., 07..., 01...
        Final format: 2547XXXXXXXX
        """
        value = value.strip().replace(" ", "")

        if value.startswith("+254"):
            value = "254" + value[4:]  # convert +2547... → 2547...
        elif value.startswith("254"):
            pass  # already correct
        elif value.startswith("07") or value.startswith("01"):
            value = "254" + value[1:]  # convert 07... or 01... → 2547...
        else:
            raise serializers.ValidationError(
                "Phone number must start with +254, 254, 07, or 01"
            )

        if not re.fullmatch(r"\d{12}", value):
            raise serializers.ValidationError(
                "Phone number must be exactly 12 digits after formatting"
            )

        return value

    def validate_amount(self, value):
        """Ensure payment amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ["id", "transaction_type", "amount", "status", "created_at"]


class WalletSerializer(serializers.ModelSerializer):
    # Show all related transactions for the wallet’s user
    transactions = TransactionSerializer(
        many=True, read_only=True, source="user.transactions"
    )

    class Meta:
        model = Wallet
        fields = ["balance", "transactions"]

    def to_representation(self, instance):
        """
        Customize wallet representation:
        - Sort transactions by newest first
        """
        data = super().to_representation(instance)
        data["transactions"] = sorted(
            data["transactions"], key=lambda x: x["created_at"], reverse=True
        )
        return data
