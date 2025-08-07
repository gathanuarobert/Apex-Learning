from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Payment
from .mpesa import send_stk_push
from .serializers import PaymentSerializer
import re
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse

class PaymentInitiateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        raw_phone = request.data.get('phone_number')

        if not amount:
            return Response({'error': 'Amount is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not raw_phone:
            return Response({'error': 'Phone number is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Normalize phone number to +254 format
            phone_number = raw_phone.strip()

            if phone_number.startswith('07') or phone_number.startswith('01'):
                phone_number = '+254' + phone_number[1:]
            elif phone_number.startswith('254'):
                phone_number = '+' + phone_number
            elif phone_number.startswith('+254'):
                pass  # already correct
            else:
                return Response({'error': 'Invalid phone number format.'}, status=status.HTTP_400_BAD_REQUEST)

            # Final validation
            if not re.fullmatch(r'\+254(7|1)\d{8}', phone_number):
                return Response({'error': 'Invalid phone number format. Use 07XXXXXXXX, 01XXXXXXXX, or +2547/1XXXXXXXX.'}, status=status.HTTP_400_BAD_REQUEST)

            # Send STK Push
            stk_response = send_stk_push(phone_number, amount)

            if stk_response.get('ResponseCode') == '0':
                payment = Payment.objects.create(
                    user=request.user,
                    phone_number=phone_number,
                    amount=amount,
                    status='pending',
                    transaction_id=stk_response.get('CheckoutRequestID'),
                    provider_response=stk_response
                )
                return Response({
                    'message': 'STK push initiated successfully.',
                    'payment': PaymentSerializer(payment).data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({'error': 'Mpesa payment initiation failed.', 'details': stk_response}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# ✅ M-Pesa Callback View
@csrf_exempt
def mpesa_callback(request):
    import json
    try:
        data = json.loads(request.body.decode('utf-8'))
        checkout_request_id = data['Body']['stkCallback']['CheckoutRequestID']
        result_code = data['Body']['stkCallback']['ResultCode']
        result_desc = data['Body']['stkCallback']['ResultDesc']

        payment = Payment.objects.filter(transaction_id=checkout_request_id).first()
        if payment:
            payment.status = 'completed' if result_code == 0 else 'failed'
            payment.provider_response = data
            payment.save()

        return JsonResponse({"message": "Callback received"}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
