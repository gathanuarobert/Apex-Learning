# payments/pesapal.py

import requests
import logging
from decouple import config

logger = logging.getLogger(__name__)

SITE_URL = config('SITE_URL')


def _cfg():
    """Lazy-load PaymentSettings to avoid AppRegistryNotReady at import time."""
    from .models import PaymentSettings
    return PaymentSettings.load()


def _base_url():
    cfg = _cfg()
    env = cfg.pesapal_environment
    return (
        "https://pay.pesapal.com/v3"
        if env == "live"
        else "https://cybqa.pesapal.com/pesapalv3"
    )


def get_token():
    cfg = _cfg()
    url = f"{_base_url()}/api/Auth/RequestToken"
    res = requests.post(url, json={
        "consumer_key": cfg.pesapal_consumer_key,
        "consumer_secret": cfg.pesapal_consumer_secret,
    }, timeout=30)
    res.raise_for_status()
    return res.json()["token"]


def register_ipn():
    """
    Run once in Django shell to get your IPN ID:
        from payments.pesapal import register_ipn
        print(register_ipn())
    Copy the returned ipn_id into Payment Settings in the admin panel.
    """
    token = get_token()
    url = f"{_base_url()}/api/URLSetup/RegisterIPN"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    res = requests.post(url, json={
        "url": f"{SITE_URL}/api/payments/pesapal-ipn/",
        "ipn_notification_type": "POST",
    }, headers=headers, timeout=30)
    res.raise_for_status()
    return res.json()


def submit_order(merchant_reference, amount, description, user, callback_url):
    cfg = _cfg()
    token = get_token()
    url = f"{_base_url()}/api/Transactions/SubmitOrderRequest"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    res = requests.post(url, json={
        "id": str(merchant_reference),
        "currency": "KES",
        "amount": float(amount),
        "description": description,
        "callback_url": callback_url,
        "notification_id": cfg.pesapal_ipn_id,
        "billing_address": {
            "first_name": getattr(user, 'first_name', None) or getattr(user, 'email', 'Customer').split('@')[0],
            "last_name":  getattr(user, 'last_name', '') or '',
            "email_address": getattr(user, 'email', ''),
            "phone_number": getattr(user, 'phone_number', '') or '',
        }
    }, headers=headers, timeout=30)
    res.raise_for_status()
    return res.json()


def get_transaction_status(order_tracking_id):
    token = get_token()
    url = f"{_base_url()}/api/Transactions/GetTransactionStatus"
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(url, headers=headers,
                       params={"orderTrackingId": order_tracking_id}, timeout=30)
    res.raise_for_status()
    return res.json()