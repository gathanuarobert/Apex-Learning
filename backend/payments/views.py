from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import PaymentSerializer
from .services import initiate_wallet_deposit, initiate_one_time_purchase, handle_mpesa_callback, process_wallet_purchase
from .models import Payment
import json
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view, permission_classes

class WalletDepositInitiateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
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
        # frontend should POST: resource_id, resource_type (optional), amount, phone_number
        resource_id = request.data.get('resource_id')
        resource_type = request.data.get('resource_type')  # optional
        amount = request.data.get('amount')
        phone_number = request.data.get('phone_number')
        # You can also accept resource identifier and look up resource in Resources app if you'd like.

        if not resource_id or not amount or not phone_number:
            return Response({'error': 'resource_id, amount and phone_number are required'}, status=status.HTTP_400_BAD_REQUEST)

        # For full validation you might import the resource model and check that resource exists and price matches.
        # For now we assume frontend sends correct price.
        # Create intermediary "resource" placeholder to save its id/type on Payment:
        class R: pass
        resource = R()
        resource.id = resource_id
        resource.__class__.__name__ = request.data.get('resource_type', 'Resource')

        payment, resp = initiate_one_time_purchase(request.user, resource, amount, phone_number)
        return Response({
            'message': 'STK push initiated for one-time purchase',
            'payment': PaymentSerializer(payment).data,
            'provider_response': resp
        }, status=status.HTTP_201_CREATED)


@csrf_exempt
def mpesa_callback(request):
    """
    Keep this endpoint as the MPESA callback URL.
    It expects the JSON body as sent by Safaricom and will route the result to handle_mpesa_callback.
    """
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception as e:
        return Response({'error': 'invalid payload'}, status=status.HTTP_400_BAD_REQUEST)

    payment, tx = handle_mpesa_callback(payload)
    # always return 200 to provider to acknowledge receipt
    return Response({'message': 'callback processed'}, status=status.HTTP_200_OK)


class WalletPurchaseAPIView(APIView):
    """
    Endpoint to buy a resource immediately using wallet balance.
    Frontend calls this when user opts to pay from wallet for a resource.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resource_id = request.data.get('resource_id')
        resource_type = request.data.get('resource_type')  # optional
        amount = request.data.get('amount')

        # If you want to ensure the resource exists and the price matches, import resources app models and check.
        # For now we process directly.
        class R: pass
        resource = R()
        resource.id = resource_id
        resource.__class__.__name__ = request.data.get('resource_type', 'Resource')

        result = process_wallet_purchase(request.user, resource, amount)
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        return Response(result, status=status.HTTP_402_PAYMENT_REQUIRED)
