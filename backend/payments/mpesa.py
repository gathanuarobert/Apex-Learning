import base64
import requests
from datetime import datetime
import os
import logging
import re

logger = logging.getLogger(__name__)

# Environment variables
MPESA_ENV = os.getenv('MPESA_ENV', 'sandbox')
CONSUMER_KEY = os.getenv('MPESA_CONSUMER_KEY')
CONSUMER_SECRET = os.getenv('MPESA_CONSUMER_SECRET')
SHORTCODE = os.getenv('MPESA_SHORTCODE')
PASSKEY = os.getenv('MPESA_PASSKEY')
CALLBACK_URL = os.getenv('MPESA_CALLBACK_URL')

# Fail fast if critical env vars are missing
if not all([CONSUMER_KEY, CONSUMER_SECRET, SHORTCODE, PASSKEY, CALLBACK_URL]):
    raise EnvironmentError("Missing one or more required M-Pesa environment variables.")

# Base URL
BASE_URL = "https://sandbox.safaricom.co.ke" if MPESA_ENV == 'sandbox' else "https://api.safaricom.co.ke"


def get_access_token():
    try:
        url = f"{BASE_URL}/oauth/v1/generate?grant_type=client_credentials"
        res = requests.get(url, auth=(CONSUMER_KEY, CONSUMER_SECRET))
        res.raise_for_status()
        return res.json().get('access_token')
    except requests.RequestException as e:
        logger.error("Failed to get M-Pesa access token: %s", e)
        raise


def generate_password():
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    data_to_encode = SHORTCODE + PASSKEY + timestamp
    password = base64.b64encode(data_to_encode.encode()).decode()
    return password, timestamp


def sanitize_phone(phone):
    phone = str(phone).strip().replace(" ", "")

    if phone.startswith("+254"):
        phone = phone[1:]
    elif phone.startswith("254"):
        pass  # already fine
    elif phone.startswith("07") or phone.startswith("01"):
        phone = "254" + phone[1:]
    else:
        raise ValueError("Phone number must start with +254, 254, 07, or 01")

    if not re.fullmatch(r"\d{12}", phone):
        raise ValueError("Phone number must be 12 digits after formatting")

    return phone


def send_stk_push(phone_number, amount):
    try:
        access_token = get_access_token()
        password, timestamp = generate_password()

        phone_number = sanitize_phone(phone_number)

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        payload = {
            "BusinessShortCode": SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(float(amount)),
            "PartyA": phone_number,
            "PartyB": SHORTCODE,
            "PhoneNumber": phone_number,
            "CallBackURL": CALLBACK_URL,
            "AccountReference": "Order Payment",
            "TransactionDesc": "Payment for your order"
        }

        url = f"{BASE_URL}/mpesa/stkpush/v1/processrequest"
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()

        # Mask phone for logs
        masked_phone = phone_number[:5] + '****' + phone_number[-2:]
        logger.info("STK Push request sent to %s for KES %s", masked_phone, amount)

        return response.json()

    except ValueError as ve:
        logger.error("Validation error: %s", ve)
        return {
            "ResponseCode": "1",
            "CustomerMessage": "Invalid phone number format",
            "error": str(ve)
        }

    except Exception as e:
        logger.error("STK Push failed: %s", e)
        return {
            "ResponseCode": "1",
            "CustomerMessage": "Something went wrong while processing your payment.",
            "error": str(e)
        }
