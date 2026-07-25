from decimal import Decimal
from django.db import transaction as db_transaction
from .models import Wallet, Transaction, Payment, PaymentSettings
from .pesapal import submit_order, get_transaction_status
from resources.models import Note, Exam, PastPaper
from decouple import config

SITE_URL = config('SITE_URL')
FRONTEND_URL = config('FRONTEND_URL')

import logging

logger = logging.getLogger(__name__)

def initiate_wallet_deposit(user, amount):
    payment = Payment.objects.create(
        user=user,
        amount=Decimal(amount),
        purpose="deposit",
        status="pending",
    )

    data = submit_order(
        merchant_reference=payment.id,
        amount=amount,
        description="Wallet Top-Up",
        user=user,
        callback_url=f"{FRONTEND_URL}/payment/complete/?ref={payment.id}",
    )

    payment.pesapal_tracking_id = data["order_tracking_id"]
    payment.provider_response = data
    payment.save()

    return payment, data["redirect_url"]


def initiate_one_time_purchase(user, resource):
    amount = Decimal(resource.price)

    payment = Payment.objects.create(
        user=user,
        amount=amount,
        purpose="purchase",
        resource_id=str(resource.id),
        resource_type=resource.__class__.__name__,
        status="pending",
    )

    data = submit_order(
        merchant_reference=payment.id,
        amount=amount,
        description=f"{resource.__class__.__name__} Purchase",
        user=user,
        callback_url=f"{FRONTEND_URL}/payment/complete/?ref={payment.id}",
    )

    payment.pesapal_tracking_id = data["order_tracking_id"]
    payment.provider_response = data
    payment.save()

    return payment, data["redirect_url"]


def handle_pesapal_ipn(order_tracking_id, merchant_reference):
    try:
        payment = Payment.objects.get(id=merchant_reference)
    except Payment.DoesNotExist:
        return {"success": False, "message": "Payment not found."}

    status_data = get_transaction_status(order_tracking_id)
    payment_status = status_data.get("payment_status_description")

    if payment_status == "Completed" and payment.status != "completed":
        with db_transaction.atomic():
            payment.status = "completed"
            payment.save()
            _fulfill_payment(payment)

    elif payment_status in ["Failed", "Invalid"]:
        payment.status = "failed"
        payment.save()

    return {"success": True}


# ── M-Pesa STK Push ──────────────────────────────────────────────────────

def initiate_mpesa_purchase(user, resource, phone_number):
    """Create a Payment and fire the Daraja STK push for a resource purchase."""
    from .mpesa import stk_push

    amount = Decimal(resource.price)
    payment = Payment.objects.create(
        user=user,
        amount=amount,
        purpose="purchase",
        resource_id=str(resource.id),
        resource_type=resource.__class__.__name__,
        status="pending",
        phone_number=phone_number,
    )

    data = stk_push(
        phone_number=phone_number,
        amount=amount,
        account_reference=str(payment.id)[:12],
        description="Apex Purchase",
        callback_url=f"{SITE_URL}/api/payments/mpesa-callback/",
    )

    payment.mpesa_checkout_request_id = data.get("CheckoutRequestID")
    payment.provider_response = data
    payment.save()
    return payment


def initiate_mpesa_deposit(user, amount, phone_number):
    """Create a Payment and fire the Daraja STK push for a wallet deposit."""
    from .mpesa import stk_push

    amount = Decimal(amount)
    payment = Payment.objects.create(
        user=user,
        amount=amount,
        purpose="deposit",
        status="pending",
        phone_number=phone_number,
    )

    data = stk_push(
        phone_number=phone_number,
        amount=amount,
        account_reference=str(payment.id)[:12],
        description="Apex Deposit",
        callback_url=f"{SITE_URL}/api/payments/mpesa-callback/",
    )

    payment.mpesa_checkout_request_id = data.get("CheckoutRequestID")
    payment.provider_response = data
    payment.save()
    return payment


def handle_mpesa_callback(data):
    """
    Process Safaricom's STK callback payload.
    Safaricom POSTs to /api/payments/mpesa-callback/ after the user pays or cancels.
    """
    try:
        stk_callback = data["Body"]["stkCallback"]
        result_code = stk_callback.get("ResultCode")
        checkout_request_id = stk_callback.get("CheckoutRequestID")

        payment = Payment.objects.get(mpesa_checkout_request_id=checkout_request_id)

        if result_code == 0:
            if payment.status == "completed":
                # Safaricom retried a callback we've already processed
                # (timeout/slow response on our end). Don't re-fulfill —
                # just acknowledge so they stop retrying.
                logger.info(
                    f"Duplicate M-Pesa callback for payment {payment.id} "
                    f"(already completed) — ignoring."
                )
                return {"success": True}

            # Payment succeeded — extract receipt number from callback metadata
            items = {
                item["Name"]: item.get("Value")
                for item in stk_callback.get("CallbackMetadata", {}).get("Item", [])
            }
            with db_transaction.atomic():
                # Re-check status inside the atomic block, locking the row,
                # in case two callbacks arrived concurrently.
                payment = Payment.objects.select_for_update().get(id=payment.id)
                if payment.status == "completed":
                    return {"success": True}
                payment.status = "completed"
                payment.transaction_id = items.get("MpesaReceiptNumber", "")
                payment.save()
                _fulfill_payment(payment)
        else:
            payment.status = "failed"
            payment.error_message = stk_callback.get("ResultDesc", "Payment failed or cancelled.")
            payment.save()

        return {"success": True}
    except Payment.DoesNotExist:
        return {"success": False, "error": "Payment not found"}
    except Exception as e:
        logger.error(f"M-Pesa callback error: {e}")
        return {"success": False, "error": str(e)}


def get_mpesa_payment_status(payment_id):
    """
    Called by the frontend polling endpoint.
    If payment is still pending, queries Daraja directly for a live status update.
    """
    try:
        payment = Payment.objects.get(id=payment_id)
    except Payment.DoesNotExist:
        return {"found": False}

    if payment.status == "pending" and payment.mpesa_checkout_request_id:
        try:
            from .mpesa import query_stk_status
            result = query_stk_status(payment.mpesa_checkout_request_id)
            result_code = result.get("ResultCode")

            if result_code is not None:
                result_code = int(result_code)
                if result_code == 0:
                    with db_transaction.atomic():
                        payment.status = "completed"
                        payment.save()
                        _fulfill_payment(payment)
                elif result_code not in [1]:   # 1 = still processing, don't mark failed yet
                    payment.status = "failed"
                    payment.error_message = result.get("ResultDesc", "Payment failed.")
                    payment.save()
        except Exception as e:
            logger.warning(f"STK status query failed: {e}")

    return {
        "found": True,
        "status": payment.status,
        "purpose": payment.purpose,
        "amount": float(payment.amount),
        "error": payment.error_message or "",
    }


def _fulfill_payment(payment):
    if payment.purpose == "deposit":
        wallet, _ = Wallet.objects.get_or_create(user=payment.user)
        wallet.deposit(payment.amount, payment=payment)

    elif payment.purpose == "purchase":
        Transaction.objects.get_or_create(
            user=payment.user,
            resource_id=payment.resource_id,
            resource_type=payment.resource_type,
            transaction_type="purchase",
            status="completed",
            defaults={"amount": payment.amount, "payment": payment},
        )


def process_wallet_purchase(user, resource):
    try:
        amount = Decimal(resource.price)
    except AttributeError:
        return {"success": False, "message": "Resource does not have a price."}

    if amount <= 0:
        Transaction.objects.get_or_create(
            user=user,
            resource_id=resource.id,
            resource_type=resource.__class__.__name__,
            transaction_type="purchase",   # ✅ correct
            status="completed",
            defaults={"amount": Decimal("0.00")}
        )
        return {"success": True, "message": "Free resource. Download ready.", "is_free": True}

    try:
        wallet = Wallet.objects.get(user=user)
    except Wallet.DoesNotExist:
        return {"success": False, "message": "No wallet found. Please deposit funds."}

    if wallet.balance < amount:
        return {
            "success": False,
            "message": f"Insufficient balance. Need KSh {amount}, have KSh {wallet.balance}",
            "required": float(amount),
            "available": float(wallet.balance),
            "shortfall": float(amount - wallet.balance),
        }

    existing = Transaction.objects.filter(
        user=user, resource_id=resource.id,
        resource_type=resource.__class__.__name__,
        transaction_type="purchase", status="completed"
    ).exists()
    if existing:
        return {"success": True, "message": "Already purchased.", "already_owned": True}

    with db_transaction.atomic():
        wallet.purchase(amount, resource=resource,
                        resource_type=resource.__class__.__name__)

    wallet.refresh_from_db()
    tx = Transaction.objects.filter(
        user=user, resource_id=resource.id,
        resource_type=resource.__class__.__name__,
        transaction_type="purchase"
    ).latest('created_at')

    return {
        "success": True,
        "message": f"{resource.__class__.__name__} unlocked.",
        "transaction_id": str(tx.id),
        "new_balance": float(wallet.balance),
        "amount_paid": float(amount),
    }


def get_resource(resource_type: str, resource_id: str):
    resource_models = {"Note": Note, "Exam": Exam, "PastPaper": PastPaper}
    model = resource_models.get(resource_type)
    if not model:
        raise ValueError("Invalid resource type. Must be Note, Exam, or PastPaper.")
    try:
        resource = model.objects.get(id=resource_id)
    except model.DoesNotExist:
        raise LookupError(f"{resource_type} with ID {resource_id} not found.")
    except ValueError:
        raise ValueError(f"Invalid resource ID format: {resource_id}")
    if not hasattr(resource, "price"):
        raise AttributeError(f"{resource_type} does not have a price field.")
    return resource, Decimal(resource.price)