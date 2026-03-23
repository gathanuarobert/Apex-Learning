import requests
import logging
from decouple import config

logger = logging.getLogger(__name__)

PESAPAL_BASE_URL = config('PESAPAL_BASE_URL')
PESAPAL_CONSUMER_KEY = config('PESAPAL_CONSUMER_KEY')
PESAPAL_CONSUMER_SECRET = config('PESAPAL_CONSUMER_SECRET')
PESAPAL_IPN_ID = config('PESAPAL_IPN_ID', default='')
SITE_URL = config('SITE_URL')


def get_token():
    url = f"{PESAPAL_BASE_URL}/api/Auth/RequestToken"
    res = requests.post(url, json={
        "consumer_key": PESAPAL_CONSUMER_KEY,
        "consumer_secret": PESAPAL_CONSUMER_SECRET,
    }, timeout=30)
    res.raise_for_status()
    return res.json()["token"]


def register_ipn():
    """
    Run once in Django shell to get your IPN ID:
        from payments.pesapal import register_ipn
        print(register_ipn())
    Save the returned ipn_id to your .env as PESAPAL_IPN_ID
    """
    token = get_token()
    url = f"{PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    res = requests.post(url, json={
        "url": f"{SITE_URL}/api/payments/pesapal-ipn/",
        "ipn_notification_type": "POST",
    }, headers=headers, timeout=30)
    res.raise_for_status()
    return res.json()


def submit_order(merchant_reference, amount, description, user, callback_url):
    token = get_token()
    url = f"{PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    res = requests.post(url, json={
        "id": str(merchant_reference),
        "currency": "KES",
        "amount": float(amount),
        "description": description,
        "callback_url": callback_url,
        "notification_id": PESAPAL_IPN_ID,
        "billing_address": {
            "first_name": getattr(user, 'first_name', None) or getattr(user, 'email', 'Customer').split('@')[0],
            "last_name": getattr(user, 'last_name', '') or '',
            "email_address": getattr(user, 'email', ''),
            "phone_number": getattr(user, 'phone_number', '') or '',
}
    }, headers=headers, timeout=30)
    res.raise_for_status()
    return res.json()  # contains redirect_url and order_tracking_id


def get_transaction_status(order_tracking_id):
    token = get_token()
    url = f"{PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus"
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(url, headers=headers,
                       params={"orderTrackingId": order_tracking_id}, timeout=30)
    res.raise_for_status()
    return res.json()