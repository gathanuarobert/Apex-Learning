# payments/admin.py

from django.contrib import admin
from .models import Payment, Wallet, Transaction, PaymentSettings


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display  = ("user", "amount", "purpose", "status", "transaction_id", "created_at")
    list_filter   = ("purpose", "status", "created_at")
    search_fields = ("user__username", "user__email", "transaction_id")
    ordering      = ("-created_at",)


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display  = ("user", "balance", "created_at", "updated_at")
    search_fields = ("user__username", "user__email")
    ordering      = ("-updated_at",)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display  = ("user", "transaction_type", "amount", "status", "created_at", "payment")
    list_filter   = ("transaction_type", "status", "created_at")
    search_fields = ("user__username", "user__email", "resource_id", "resource_type")
    ordering      = ("-created_at",)


@admin.register(PaymentSettings)
class PaymentSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ("Active Gateway", {
            "fields": ("active_gateway",),
            "description": "⚠️ Only the active gateway is used. Configure its credentials below.",
        }),
        ("Pesapal Configuration", {
            "fields": (
                "pesapal_environment",
                "pesapal_consumer_key",
                "pesapal_consumer_secret",
                "pesapal_ipn_id",
            ),
            "classes": ("collapse",),
        }),
        ("M-Pesa Configuration (Pending client credentials)", {
            "fields": (
                "mpesa_environment",
                "mpesa_consumer_key",
                "mpesa_consumer_secret",
                "mpesa_shortcode",
                "mpesa_passkey",
            ),
            "classes": ("collapse",),
        }),
    )

    def has_add_permission(self, request):
        return not PaymentSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False