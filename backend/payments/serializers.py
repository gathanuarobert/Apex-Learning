from rest_framework import serializers
from .models import Payment
import re

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['status', 'transaction_id', 'provider_response', 'created_at', 'updated_at']

    def validate_phone_number(self, value):
        value = value.strip().replace(" ", "")
        if value.startswith("+254"):
            value = value[1:]
        elif value.startswith("254"):
            pass
        elif value.startswith("07") or value.startswith("01"):
            value = "254" + value[1:]
        else:
            raise serializers.ValidationError("Phone number must start with +254, 254, 07, or 01")

        if not re.fullmatch(r"\d{12}", value):
            raise serializers.ValidationError("Phone number must be 12 digits after formatting")

        return value

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value
