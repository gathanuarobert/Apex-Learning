from django.urls import path
from .views import (
    WalletDepositInitiateView,
    OneTimePurchaseInitiateView,
    WalletPurchaseAPIView,
    mpesa_callback_view,
    TransactionHistoryView,
    AdminTransactionHistoryView,
    WalletDetailView,  # Add this import
)

urlpatterns = [
    path("wallet/deposit/initiate/", WalletDepositInitiateView.as_view(), name="wallet-deposit-initiate"),
    path("purchase/resource/initiate/", OneTimePurchaseInitiateView.as_view(), name="one-time-purchase-initiate"),
    path("wallet/purchase/", WalletPurchaseAPIView.as_view(), name="wallet-purchase"),  # Changed this line
    path("wallet/", WalletDetailView.as_view(), name="wallet-detail"),  # Changed this line
    path("mpesa-callback/", mpesa_callback_view, name="mpesa-callback"),
    path("transactions/", TransactionHistoryView.as_view(), name="transaction-history"),
    path("admin/transactions/", AdminTransactionHistoryView.as_view(), name="admin-transactions"),
]