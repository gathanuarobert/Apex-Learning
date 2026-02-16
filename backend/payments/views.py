from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import PaymentSerializer, WalletSerializer, TransactionSerializer
from .services import initiate_wallet_deposit, initiate_one_time_purchase, handle_mpesa_callback, process_wallet_purchase
from .models import Payment, Wallet, Transaction
from .services import get_resource
import json
from decimal import Decimal, InvalidOperation
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser



class WalletDepositInitiateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            amount = Decimal(request.data.get("amount"))
        except (TypeError, InvalidOperation):
            return Response({"error": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)

        phone_number = request.data.get('phone_number')
        if not amount or not phone_number:
            return Response({'error': 'amount and phone_number are required'}, status=status.HTTP_400_BAD_REQUEST)

        payment, resp = initiate_wallet_deposit(request.user, amount, phone_number)
        return Response({
            'message': 'STK push initiated for wallet deposit',
            'payment': PaymentSerializer(payment).data,
            'provider_response': resp
        }, status=status.HTTP_201_CREATED)




class OneTimePurchaseInitiateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resource_type = request.data.get("resource_type")
        resource_id = request.data.get("resource_id")
        phone_number = request.data.get("phone_number")

        if not resource_type or not resource_id or not phone_number:
            return Response(
                {"error": "resource_type, resource_id, and phone_number are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            resource, amount = get_resource(resource_type, resource_id)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except LookupError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        payment, resp = initiate_one_time_purchase(request.user, resource, phone_number)

        return Response({
            "message": f"STK push initiated for one-time {resource_type} purchase",
            "payment": PaymentSerializer(payment).data,
            "provider_response": resp
        }, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def mpesa_callback_view(request):
    result = handle_mpesa_callback(request)
    return Response(result)


class WalletPurchaseAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resource_type = request.data.get("resource_type")
        resource_id = request.data.get("resource_id")

        if not resource_type or not resource_id:
            return Response(
                {"error": "Both resource_type and resource_id are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            resource, amount = get_resource(resource_type, resource_id)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except LookupError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        result = process_wallet_purchase(request.user, resource)

        if result["success"]:
            return Response(result, status=status.HTTP_200_OK)
        return Response(result, status=status.HTTP_402_PAYMENT_REQUIRED)



class WalletDetailView(APIView):
    """
    Return wallet balance and transaction history for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        serializer = WalletSerializer(wallet)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TransactionHistoryView(APIView):
    """
    Return a list of all user transactions (separate endpoint from wallet if needed).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user).order_by("-created_at")
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class AdminTransactionHistoryView(APIView):
    """
    Admin-only endpoint to see ALL transactions from all users
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        transactions = Transaction.objects.all().order_by("-created_at")
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)