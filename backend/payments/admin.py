from django.contrib import admin
from .models import Payment, Wallet, Transaction


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("user", "amount", "purpose", "status", "transaction_id", "created_at")
    list_filter = ("purpose", "status", "created_at")
    search_fields = ("user__username", "user__email", "transaction_id")
    ordering = ("-created_at",)


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("user", "balance", "created_at", "updated_at")
    search_fields = ("user__username", "user__email")
    ordering = ("-updated_at",)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("user", "transaction_type", "amount", "status", "created_at", "payment")
    list_filter = ("transaction_type", "status", "created_at")
    search_fields = ("user__username", "user__email", "resource_id", "resource_type")
    ordering = ("-created_at",)
