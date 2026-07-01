from decimal import Decimal
from django.db import transaction as db_transaction
from .models import Wallet, Transaction, Payment, PaymentSettings
from .pesapal import submit_order, get_transaction_status
from resources.models import Note, Exam, PastPaper
from decouple import config

SITE_URL = config('SITE_URL')
FRONTEND_URL = config('FRONTEND_URL')


def _assert_gateway_implemented():
    """
    Pesapal is the only gateway with actual routing code right now.
    M-Pesa credentials can be stored safely, but selecting M-Pesa as the
    active gateway before the Daraja integration is built would silently
    misroute or break checkout. This fails loudly instead.
    """
    active = PaymentSettings.load().active_gateway
    if active != 'pesapal':
        raise NotImplementedError(
            f"Active gateway is set to '{active}', but only Pesapal is "
            f"currently wired up in services.py. Build the M-Pesa "
            f"integration (mpesa.py + service routing) before switching "
            f"the active gateway, or set it back to 'pesapal'."
        )


def initiate_wallet_deposit(user, amount):
    _assert_gateway_implemented()
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
    _assert_gateway_implemented()
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