from decimal import Decimal
from .models import Wallet, Transaction, Payment
from django.db import transaction as db_transaction
from .mpesa import send_stk_push  # uses your mpesa.py
from django.utils import timezone

def initiate_wallet_deposit(user, amount, phone_number):
    """
    Initiate STK push for wallet deposit.
    Creates a Payment with purpose='deposit' (status pending).
    Returns the provider response (so frontend can use it).
    """
    # Create Payment record with pending status first
    payment = Payment.objects.create(
        user=user,
        phone_number=phone_number,
        amount=Decimal(amount),
        purpose='deposit',
        status='pending',
    )

    # trigger STK push
    resp = send_stk_push(phone_number, amount)

    # attach provider response + CheckoutRequestID if present
    payment.provider_response = resp
    checkout_id = None
    # Many mpesa responses include "CheckoutRequestID" (sandbox response)
    if isinstance(resp, dict):
        checkout_id = resp.get('CheckoutRequestID') or resp.get('checkoutRequestID')
        # Also some responses present ResponseCode and CustomerMessage
    if checkout_id:
        payment.transaction_id = checkout_id
    payment.provider_response = resp
    payment.save()
    return payment, resp


def initiate_one_time_purchase(user, resource, phone_number):
    """
    Initiate STK push for a one-time purchase of `resource`.
    Always fetch price from DB to prevent tampering.
    """
    # Get the latest price from the DB
    amount = Decimal(resource.__class__.objects.values_list("price", flat=True).get(pk=resource.id))

    payment = Payment.objects.create(
        user=user,
        phone_number=phone_number,
        amount=amount,
        purpose='purchase',
        resource_id=str(resource.id),
        resource_type=resource.__class__.__name__,
        status='pending'
    )

    resp = send_stk_push(phone_number, amount)
    if isinstance(resp, dict):
        checkout_id = resp.get('CheckoutRequestID') or resp.get('checkoutRequestID')
        if checkout_id:
            payment.transaction_id = checkout_id
    payment.provider_response = resp
    payment.save()
    return payment, resp


def process_wallet_purchase(user, resource):
    """
    Buy a resource immediately using wallet balance.
    Always fetch price from DB to prevent tampering.
    """
    # Get the latest price from the DB
    amount = Decimal(resource.__class__.objects.values_list("price", flat=True).get(pk=resource.id))

    try:
        wallet = Wallet.objects.get(user=user)
    except Wallet.DoesNotExist:
        return {"success": False, "message": "No wallet found. Please deposit funds."}

    if wallet.balance < amount:
        return {"success": False, "message": "Insufficient balance."}

    with db_transaction.atomic():
        wallet.withdraw(amount)
        tx = Transaction.objects.create(
            user=user,
            transaction_type='download',
            amount=amount,
            status='completed',
            resource_id=str(resource.id),
            resource_type=resource.__class__.__name__,
        )

    return {"success": True, "message": "Payment successful", "transaction_id": str(tx.id)}


def handle_mpesa_callback(callback_data):
    """
    Called by the mpesa callback view to process provider callback payload.
    Expects the raw parsed JSON (already decoded).
    Updates Payment object based on CheckoutRequestID and result code.
    If deposit --> credit wallet + create Transaction.
    If purchase --> create Transaction marking purchase completed.
    Returns tuple (payment, transaction or None)
    """

    # defensive: try to extract checkout id and result
    try:
        body = callback_data.get('Body', {})
        stk = body.get('stkCallback', {})
        checkout_id = stk.get('CheckoutRequestID')
        result_code = stk.get('ResultCode')
        result_desc = stk.get('ResultDesc')
    except Exception:
        return None, None

    payment = Payment.objects.filter(transaction_id=checkout_id).first()
    if not payment:
        return None, None

    # store full provider response
    payment.provider_response = callback_data
    payment.updated_at = timezone.now()

    if isinstance(result_code, int):
        success = (result_code == 0)
    else:
        # sometimes result_code arrives as string
        try:
            success = int(result_code) == 0
        except Exception:
            success = False

    if success:
        payment.status = 'completed'
        payment.save()

        if payment.purpose == 'deposit':
            # credit wallet & create Transaction
            wallet, _ = Wallet.objects.get_or_create(user=payment.user)
            wallet.deposit(payment.amount)
            tx = Transaction.objects.create(
                user=payment.user,
                transaction_type='deposit',
                amount=payment.amount,
                status='completed',
                payment=payment
            )
            return payment, tx

        elif payment.purpose == 'purchase':
            # create transaction entry for the one-time purchase so Resources can allow download
            tx = Transaction.objects.create(
                user=payment.user,
                transaction_type='purchase',
                amount=payment.amount,
                status='completed',
                resource_id=payment.resource_id,
                resource_type=payment.resource_type,
                payment=payment
            )
            return payment, tx
    else:
        payment.status = 'failed'
        payment.save()
        # optionally record failed transaction
        tx = Transaction.objects.create(
            user=payment.user,
            transaction_type='purchase' if payment.purpose == 'purchase' else 'deposit',
            amount=payment.amount,
            status='failed',
            payment=payment
        )
        return payment, tx
