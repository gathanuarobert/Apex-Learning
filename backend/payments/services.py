# payments/services.py - FIXED VERSION

from decimal import Decimal
from django.db import transaction as db_transaction
from django.http import JsonResponse
from django.utils import timezone

from .models import Wallet, Transaction, Payment
from resources.models import Note, Exam, PastPaper
from .mpesa import send_stk_push


def initiate_wallet_deposit(user, amount, phone_number):
    """
    Initiate STK push for wallet deposit.
    """
    payment = Payment.objects.create(
        user=user,
        phone_number=phone_number,
        amount=Decimal(amount),
        purpose="deposit",
        status="pending",
    )

    resp = send_stk_push(phone_number, amount)
    if isinstance(resp, dict):
        checkout_id = resp.get("CheckoutRequestID") or resp.get("checkoutRequestID")
        if checkout_id:
            payment.transaction_id = checkout_id
    payment.provider_response = resp
    payment.save()
    return payment, resp


def initiate_one_time_purchase(user, resource, phone_number):
    """
    One-time purchase of a resource (price always fetched fresh from DB).
    """
    amount = Decimal(resource.price)

    payment = Payment.objects.create(
        user=user,
        phone_number=phone_number,
        amount=amount,
        purpose="purchase",
        resource_id=str(resource.id),
        resource_type=resource.__class__.__name__,
        status="pending",
    )

    resp = send_stk_push(phone_number, amount)
    if isinstance(resp, dict):
        checkout_id = resp.get("CheckoutRequestID") or resp.get("checkoutRequestID")
        if checkout_id:
            payment.transaction_id = checkout_id
    payment.provider_response = resp
    payment.save()
    return payment, resp


def process_wallet_purchase(user, resource):
    """
    Deduct price from wallet balance and log transaction.
    FIXED: Handles free resources and prevents duplicate transactions.
    """
    try:
        amount = Decimal(resource.price)
    except AttributeError:
        return {"success": False, "message": "Resource does not have a price."}

    # ✅ FIX 1: Handle free resources (price = 0.00)
    if amount <= 0:
        # Check if already downloaded
        existing = Transaction.objects.filter(
            user=user,
            resource_id=resource.id,
            resource_type=resource.__class__.__name__,
            transaction_type="download",
            status="completed"
        ).exists()
        
        if not existing:
            # Create free download transaction
            Transaction.objects.create(
                user=user,
                transaction_type="download",
                amount=0,
                status="completed",
                resource_id=resource.id,
                resource_type=resource.__class__.__name__,
            )
        
        return {
            "success": True, 
            "message": "Free resource. Download ready.",
            "is_free": True
        }

    # Get or create wallet
    try:
        wallet = Wallet.objects.get(user=user)
    except Wallet.DoesNotExist:
        return {"success": False, "message": "No wallet found. Please deposit funds."}

    # Check balance
    if wallet.balance < amount:
        return {
            "success": False, 
            "message": f"Insufficient balance. You need KSh {amount}, but have KSh {wallet.balance}",
            "required": float(amount),
            "available": float(wallet.balance),
            "shortfall": float(amount - wallet.balance)
        }

    # ✅ FIX 2: Check if already purchased
    existing = Transaction.objects.filter(
        user=user,
        resource_id=resource.id,
        resource_type=resource.__class__.__name__,
        transaction_type="purchase",
        status="completed"
    ).exists()
    
    if existing:
        return {
            "success": True, 
            "message": "Already purchased. You can download now.",
            "already_owned": True
        }

    # ✅ FIX 3: Only call wallet.purchase() - it creates the transaction internally
    # No need to create transaction again!
    with db_transaction.atomic():
        wallet.purchase(amount, resource=resource, resource_type=resource.__class__.__name__)

    # Refresh wallet to get updated balance
    wallet.refresh_from_db()
    
    # Get the transaction that was just created by wallet.purchase()
    tx = Transaction.objects.filter(
        user=user,
        resource_id=resource.id,
        resource_type=resource.__class__.__name__,
        transaction_type="purchase"
    ).latest('created_at')

    return {
        "success": True,
        "message": f"Purchase successful! {resource.__class__.__name__} unlocked.",
        "transaction_id": str(tx.id),
        "new_balance": float(wallet.balance),
        "amount_paid": float(amount)
    }


def handle_mpesa_callback(request):
    """
    Handle Safaricom M-Pesa STK push callback.
    Always return a dict (no JsonResponse here).
    """
    payload = request.data if hasattr(request, "data") else request.POST
    
    try:
        result_code = payload["Body"]["stkCallback"]["ResultCode"]
        result_desc = payload["Body"]["stkCallback"]["ResultDesc"]
        checkout_id = payload["Body"]["stkCallback"]["CheckoutRequestID"]
    except (KeyError, TypeError) as e:
        return {"success": False, "message": f"Invalid callback payload: {str(e)}"}

    try:
        payment = Payment.objects.get(transaction_id=checkout_id)
    except Payment.DoesNotExist:
        return {"success": False, "message": "Payment not found."}

    if result_code != 0:
        payment.status = "failed"
        payment.error_message = result_desc
        payment.save()
        return {"success": False, "message": result_desc}

    with db_transaction.atomic():
        payment.status = "completed"
        payment.save()

        wallet, _ = Wallet.objects.get_or_create(user=payment.user)

        # Only deposit if it's a wallet top-up (not a direct purchase)
        if payment.purpose == "deposit":
            wallet.deposit(payment.amount, payment=payment)
        
        # For direct purchases, create a completed transaction
        elif payment.purpose == "purchase":
            Transaction.objects.create(
                user=payment.user,
                transaction_type="purchase",
                amount=payment.amount,
                status="completed",
                resource_id=payment.resource_id,
                resource_type=payment.resource_type,
                payment=payment
            )

    return {"success": True, "message": "Payment successful"}


def get_resource(resource_type: str, resource_id: str):
    """
    Validate and fetch a resource (Note, Exam, or PastPaper).
    Returns (resource, amount) if valid, otherwise raises ValueError/LookupError.
    
    ✅ FIXED: Now accepts UUID strings (not just integers)
    """
    resource_models = {
        "Note": Note,
        "Exam": Exam,
        "PastPaper": PastPaper,
    }

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