from django.urls import path
from .views import (
    WalletDepositInitiateView,
    OneTimePurchaseInitiateView,
    WalletPurchaseAPIView,
    mpesa_callback_view,
    TransactionHistoryView,
    AdminTransactionHistoryView,
)

urlpatterns = [
    path("wallet/deposit/initiate/", WalletDepositInitiateView.as_view(), name="wallet-deposit-initiate"),
    path("purchase/resource/initiate/", OneTimePurchaseInitiateView.as_view(), name="one-time-purchase-initiate"),
    path("wallet/purchase/", WalletPurchaseAPIView.as_view(), name="wallet-purchase"),
    path("mpesa-callback/", mpesa_callback_view, name="mpesa-callback"),
    path("transactions/", TransactionHistoryView.as_view(), name="transaction-history"),
    path("admin/transactions/", AdminTransactionHistoryView.as_view(), name="admin-transactions"),
]
