from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    WalletDepositInitiateView, OneTimePurchaseInitiateView,
    WalletPurchaseAPIView, PesapalIPNView, PaymentCallbackView,
    TransactionHistoryView, AdminTransactionHistoryView,
    WalletDetailView, TransactionViewSet, PaymentSettingsView
)

router = DefaultRouter()
router.register(r'admin/transactions-viewset', TransactionViewSet, basename='transaction-viewset')

urlpatterns = [
    path("wallet/deposit/initiate/", WalletDepositInitiateView.as_view(), name="wallet-deposit-initiate"),
    path("purchase/resource/initiate/", OneTimePurchaseInitiateView.as_view(), name="one-time-purchase-initiate"),
    path("wallet/purchase/", WalletPurchaseAPIView.as_view(), name="wallet-purchase"),
    path("wallet/", WalletDetailView.as_view(), name="wallet-detail"),
    path("pesapal-ipn/", PesapalIPNView.as_view(), name="pesapal-ipn"),
    path("payment/callback/", PaymentCallbackView.as_view(), name="payment-callback"),
    path("transactions/", TransactionHistoryView.as_view(), name="transaction-history"),
    path("admin/transactions/", AdminTransactionHistoryView.as_view(), name="admin-transactions"),
    path('settings/',            PaymentSettingsView.as_view()),
] + router.urls