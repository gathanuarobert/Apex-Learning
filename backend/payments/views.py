from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from decimal import Decimal, InvalidOperation
from .services import handle_pesapal_ipn

from .serializers import PaymentSerializer, WalletSerializer, TransactionSerializer, PaymentSettingsSerializer
from .services import (
    initiate_wallet_deposit, initiate_one_time_purchase,
    handle_pesapal_ipn, process_wallet_purchase, get_resource,
    initiate_mpesa_purchase, initiate_mpesa_deposit,
    handle_mpesa_callback, get_mpesa_payment_status,
)
from .models import Payment, Wallet, Transaction, PaymentSettings


class IsAdminOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser


class WalletDepositInitiateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            amount = Decimal(request.data.get("amount"))
        except (TypeError, InvalidOperation):
            return Response({"error": "Invalid amount"}, status=400)

        if amount <= 0:
            return Response({"error": "Amount must be greater than zero"}, status=400)

        payment, redirect_url = initiate_wallet_deposit(request.user, amount)
        return Response({
            "message": "Redirect user to the Pesapal checkout URL to complete payment.",
            "redirect_url": redirect_url,
            "payment_id": str(payment.id),
        }, status=201)


class OneTimePurchaseInitiateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resource_type = request.data.get("resource_type")
        resource_id = request.data.get("resource_id")

        if not resource_type or not resource_id:
            return Response(
                {"error": "resource_type and resource_id are required."}, status=400)

        try:
            resource, amount = get_resource(resource_type, resource_id)
        except ValueError as e:
            return Response({"error": str(e)}, status=400)
        except LookupError as e:
            return Response({"error": str(e)}, status=404)
        except AttributeError as e:
            return Response({"error": str(e)}, status=500)

        payment, redirect_url = initiate_one_time_purchase(request.user, resource)
        return Response({
            "message": f"Redirect user to Pesapal to complete {resource_type} purchase.",
            "redirect_url": redirect_url,
            "payment_id": str(payment.id),
        }, status=201)


class PesapalIPNView(APIView):
    """Pesapal POSTs here when payment status changes."""
    permission_classes = [AllowAny]

    def get(self, request):
        order_tracking_id = request.query_params.get("OrderTrackingId")
        merchant_reference = request.query_params.get("OrderMerchantReference")
        if order_tracking_id and merchant_reference:
            handle_pesapal_ipn(order_tracking_id, merchant_reference)
        return Response({
            "orderNotificationType": "IPNCHANGE",
            "orderTrackingId": order_tracking_id,
            "orderMerchantReference": merchant_reference,
            "status": 200,
        })

    def post(self, request):
        order_tracking_id = request.data.get("OrderTrackingId") or request.query_params.get("OrderTrackingId")
        merchant_reference = request.data.get("OrderMerchantReference") or request.query_params.get("OrderMerchantReference")
        if order_tracking_id and merchant_reference:
            handle_pesapal_ipn(order_tracking_id, merchant_reference)
        return Response({
            "orderNotificationType": "IPNCHANGE",
            "orderTrackingId": order_tracking_id,
            "orderMerchantReference": merchant_reference,
            "status": 200,
        })
    

class ActiveGatewayView(APIView):
    """Lightweight endpoint — tells the frontend which gateway is currently live."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import PaymentSettings
        cfg = PaymentSettings.load()
        return Response({"active_gateway": cfg.active_gateway})


class MpesaStkPushView(APIView):
    """Initiate an M-Pesa STK push for a resource purchase or wallet deposit."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        phone = request.data.get("phone_number", "").strip()
        purpose = request.data.get("purpose", "purchase")

        if not phone:
            return Response({"error": "phone_number is required."}, status=400)

        try:
            if purpose == "purchase":
                resource_type = request.data.get("resource_type")
                resource_id = request.data.get("resource_id")
                if not resource_type or not resource_id:
                    return Response({"error": "resource_type and resource_id required."}, status=400)
                resource, _ = get_resource(resource_type, resource_id)
                payment = initiate_mpesa_purchase(request.user, resource, phone)

            elif purpose == "deposit":
                try:
                    amount = Decimal(request.data.get("amount"))
                except (TypeError, InvalidOperation):
                    return Response({"error": "Invalid amount."}, status=400)
                if amount <= 0:
                    return Response({"error": "Amount must be greater than zero."}, status=400)
                payment = initiate_mpesa_deposit(request.user, amount, phone)

            else:
                return Response({"error": "Invalid purpose."}, status=400)

        except (ValueError, LookupError, AttributeError) as e:
            return Response({"error": str(e)}, status=400)
        except Exception as e:
            logger.error(f"M-Pesa STK push error: {e}")
            return Response({"error": "Could not initiate M-Pesa payment. Check credentials."}, status=500)

        return Response({
            "payment_id": str(payment.id),
            "message": "STK push sent. Waiting for user confirmation.",
        }, status=201)


class MpesaCallbackView(APIView):
    """Safaricom POSTs here after the user pays or cancels the STK prompt."""
    permission_classes = [AllowAny]

    def post(self, request):
        handle_mpesa_callback(request.data)
        # Safaricom expects this exact response shape
        return Response({"ResultCode": 0, "ResultDesc": "Accepted"})


class MpesaPaymentStatusView(APIView):
    """Frontend polls this every 3 seconds to check if payment completed."""
    permission_classes = [IsAuthenticated]

    def get(self, request, payment_id):
        result = get_mpesa_payment_status(str(payment_id))
        if not result["found"]:
            return Response({"error": "Payment not found."}, status=404)
        return Response(result)    


class PaymentCallbackView(APIView):
    """Browser lands here after user pays on Pesapal checkout page."""
    permission_classes = [AllowAny]

    def get(self, request):
        payment_id = request.query_params.get("ref")
        order_tracking_id = request.query_params.get("OrderTrackingId")
        try:
            payment = Payment.objects.get(id=payment_id)

            # Try to fulfill payment using tracking ID from callback
            if order_tracking_id and payment.status != "completed":
                handle_pesapal_ipn(order_tracking_id, str(payment.id))
                payment.refresh_from_db()

            return Response({
                "status": payment.status,
                "purpose": payment.purpose,
                "amount": payment.amount,
            })
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found."}, status=404)


class WalletPurchaseAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resource_type = request.data.get("resource_type")
        resource_id = request.data.get("resource_id")

        if not resource_type or not resource_id:
            return Response(
                {"error": "resource_type and resource_id are required."}, status=400)

        try:
            resource, amount = get_resource(resource_type, resource_id)
        except (ValueError, LookupError, AttributeError) as e:
            return Response({"error": str(e)}, status=400)

        result = process_wallet_purchase(request.user, resource)
        return Response(result,
                        status=200 if result["success"] else 402)


class WalletDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        return Response({"balance": wallet.balance, "user": request.user.email})


class TransactionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions = Transaction.objects.filter(
            user=request.user).order_by("-created_at")
        return Response(TransactionSerializer(transactions, many=True).data)


class AdminTransactionHistoryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        transactions = Transaction.objects.all().order_by("-created_at")
        return Response(TransactionSerializer(transactions, many=True).data)


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Transaction.objects.all().order_by('-created_at')
    serializer_class = TransactionSerializer
    permission_classes = [IsAdminOnly]


class PaymentSettingsView(APIView):
    """
    GET  /api/payments/settings/  — returns current config (secrets masked)
    PUT  /api/payments/settings/  — full update
    PATCH /api/payments/settings/ — partial update (change one field at a time)
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        settings_obj = PaymentSettings.load()
        return Response(PaymentSettingsSerializer(settings_obj).data)

    def put(self, request):
        settings_obj = PaymentSettings.load()
        serializer = PaymentSettingsSerializer(settings_obj, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Payment settings updated."})

    def patch(self, request):
        settings_obj = PaymentSettings.load()
        serializer = PaymentSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Payment settings updated."})