from django.urls import path
from .views import mpesa_callback
from .views import PaymentInitiateView

# urls.py
urlpatterns = [
    path('payments/initiate/', PaymentInitiateView.as_view(), name='payment-initiate'),
    path('payments/mpesa-callback/', mpesa_callback, name='mpesa-callback'),
]

# This file defines the URL patterns for the payments app, specifically for initiating M-Pesa payments.