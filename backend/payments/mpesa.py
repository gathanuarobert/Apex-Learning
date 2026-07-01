import requests
import base64
import logging
from datetime import datetime
from decouple import config

logger = logging.getLogger(__name__)

SITE_URL = config('SITE_URL')


def _cfg():
    from .models import PaymentSettings
    return PaymentSettings.load()


def _base_url():
    env = _cfg().mpesa_environment
    return (
        "https://api.safaricom.co.ke"
        if env == "live"
        else "https://sandbox.safaricom.co.ke"
    )


def _normalize_phone(phone):
    """Convert 07XX, 7XX, or +2547XX → 2547XX"""
    phone = str(phone).strip().replace("+", "").replace(" ", "").replace("-", "")
    if phone.startswith("0"):
        return "254" + phone[1:]
    if phone.startswith("7") or phone.startswith("1"):
        return "254" + phone
    return phone


def _timestamp():
    return datetime.now().strftime("%Y%m%d%H%M%S")


def _password(shortcode, passkey, timestamp):
    return base64.b64encode(f"{shortcode}{passkey}{timestamp}".encode()).decode()


def get_token():
    cfg = _cfg()
    credentials = base64.b64encode(
        f"{cfg.mpesa_consumer_key}:{cfg.mpesa_consumer_secret}".encode()
    ).decode()
    res = requests.get(
        f"{_base_url()}/oauth/v1/generate?grant_type=client_credentials",
        headers={"Authorization": f"Basic {credentials}"},
        timeout=30,
    )
    res.raise_for_status()
    return res.json()["access_token"]


def stk_push(phone_number, amount, account_reference, description, callback_url):
    """Fire an STK push to the user's phone. Returns full Daraja response."""
    cfg = _cfg()
    token = get_token()
    ts = _timestamp()
    pw = _password(cfg.mpesa_shortcode, cfg.mpesa_passkey, ts)
    phone = _normalize_phone(phone_number)

    res = requests.post(
        f"{_base_url()}/mpesa/stkpush/v1/processrequest",
        json={
            "BusinessShortCode": cfg.mpesa_shortcode,
            "Password": pw,
            "Timestamp": ts,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(float(amount)),   # Daraja requires integer
            "PartyA": phone,
            "PartyB": cfg.mpesa_shortcode,
            "PhoneNumber": phone,
            "CallBackURL": callback_url,
            "AccountReference": str(account_reference)[:12],
            "TransactionDesc": str(description)[:13],
        },
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        timeout=30,
    )
    res.raise_for_status()
    return res.json()


def query_stk_status(checkout_request_id):
    """
    Query live status of an STK push.
    ResultCode 0 = success, 1032 = user cancelled, 1037 = timeout, others = failed.
    """
    cfg = _cfg()
    token = get_token()
    ts = _timestamp()
    pw = _password(cfg.mpesa_shortcode, cfg.mpesa_passkey, ts)

    res = requests.post(
        f"{_base_url()}/mpesa/stkpushquery/v1/query",
        json={
            "BusinessShortCode": cfg.mpesa_shortcode,
            "Password": pw,
            "Timestamp": ts,
            "CheckoutRequestID": checkout_request_id,
        },
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        timeout=30,
    )
    res.raise_for_status()
    return res.json()