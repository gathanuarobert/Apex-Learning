from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    WalletDepositInitiateView, OneTimePurchaseInitiateView,
    WalletPurchaseAPIView, PesapalIPNView, PaymentCallbackView,
    TransactionHistoryView, AdminTransactionHistoryView,
    WalletDetailView, TransactionViewSet, PaymentSettingsView,
    ActiveGatewayView,
    MpesaStkPushView, MpesaCallbackView, MpesaPaymentStatusView,
)

router = DefaultRouter()
router.register(r'admin/transactions-viewset', TransactionViewSet, basename='transaction-viewset')

urlpatterns = [
    # Wallet
    path("wallet/deposit/initiate/",    WalletDepositInitiateView.as_view()),
    path("wallet/purchase/",            WalletPurchaseAPIView.as_view()),
    path("wallet/",                     WalletDetailView.as_view()),
    # One-time purchase (Pesapal)
    path("purchase/resource/initiate/", OneTimePurchaseInitiateView.as_view()),
    # Pesapal IPN + callback
    path("pesapal-ipn/",                PesapalIPNView.as_view()),
    path("payment/callback/",           PaymentCallbackView.as_view()),
    # Transactions
    path("transactions/",               TransactionHistoryView.as_view()),
    path("admin/transactions/",         AdminTransactionHistoryView.as_view()),
    # Payment settings (admin)
    path("settings/",                   PaymentSettingsView.as_view()),
    # Active gateway (authenticated users)
    path("active-gateway/",             ActiveGatewayView.as_view()),
    # M-Pesa STK Push
    path("mpesa/stk-push/",             MpesaStkPushView.as_view()),
    path("mpesa/callback/",             MpesaCallbackView.as_view()),
    path("mpesa/status/<uuid:payment_id>/", MpesaPaymentStatusView.as_view()),
] + router.urls