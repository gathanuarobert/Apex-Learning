from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Payment
from .mpesa import send_stk_push
from .serializers import PaymentSerializer
from django.utils.timezone import now
import stripe
from django.conf import settings
import re
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.views.decorators.http import require_POST

stripe.api_key = settings.STRIPE_SECRET_KEY

class PaymentInitiateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        method = request.data.get('method')
        amount = request.data.get('amount')
        raw_phone = request.data.get('phone_number')

        if not method or not amount:
            return Response({'error': 'Method and amount are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if method == 'mpesa':
                if not raw_phone:
                    return Response({'error': 'Phone number is required for M-Pesa.'}, status=status.HTTP_400_BAD_REQUEST)

                # Normalize phone number to +254 format
                phone_number = raw_phone.strip()

                if phone_number.startswith('07') or phone_number.startswith('01'):
                    phone_number = '+254' + phone_number[1:]
                elif phone_number.startswith('254'):
                    phone_number = '+' + phone_number
                elif phone_number.startswith('+254'):
                    pass  # already in correct format
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
                        method='mpesa',
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

            elif method == 'stripe':
                intent = stripe.PaymentIntent.create(
                    amount=int(float(amount) * 100),  # convert to cents
                    currency='usd',
                    metadata={'user_id': str(request.user.id)},
                )
                payment = Payment.objects.create(
                    user=request.user,
                    method='stripe',
                    amount=amount,
                    status='pending',
                    transaction_id=intent.id,
                    provider_response=intent
                )
                return Response({
                    'message': 'Stripe payment initiated.',
                    'payment': PaymentSerializer(payment).data,
                    'client_secret': intent.client_secret
                }, status=status.HTTP_201_CREATED)

            else:
                return Response({'error': 'Unsupported payment method.'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ✅ M-Pesa Callback View
@csrf_exempt
def mpesa_callback(request):
    import json
    from .models import Payment

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


# ✅ Stripe Webhook View
@csrf_exempt
@require_POST
def stripe_webhook(request):
    import json
    from .models import Payment

    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        return JsonResponse({'error': 'Invalid payload'}, status=400)
    except stripe.error.SignatureVerificationError as e:
        return JsonResponse({'error': 'Invalid signature'}, status=400)

    # Handle successful payment intent
    if event['type'] == 'payment_intent.succeeded':
        intent = event['data']['object']
        transaction_id = intent['id']
        payment = Payment.objects.filter(transaction_id=transaction_id).first()
        if payment:
            payment.status = 'completed'
            payment.provider_response = intent
            payment.save()

    return JsonResponse({'message': 'Webhook received'}, status=200)
