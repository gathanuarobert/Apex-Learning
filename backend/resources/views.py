# resources/views.py
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse
from decimal import Decimal

from .models import Note, PastPaper, Exam, News
from .serializers import NoteSerializer, PastPaperSerializer, ExamSerializer, NewsSerializer

# Payments integration
from payments.services import process_download_payment
from payments.models import Transaction
from payments.mpesa import send_stk_push


class IsAdminOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser


class BaseResourceViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOnly()]
        return super().get_permissions()

    @action(detail=True, methods=['post'], url_path='pay-and-download')
    def pay_and_download(self, request, pk=None):
        """
        Initiates payment for a resource (wallet or M-Pesa),
        then allows download if successful.
        """
        resource = self.get_object()
        price = getattr(resource, "price", Decimal("0.00"))

        # Case 1: Free resource
        if price <= 0:
            return self._serve_file(resource)

        # Case 2: Wallet payment
        if request.data.get("payment_method") == "wallet":
            payment_result = process_download_payment(user=request.user, resource=resource)
            if not payment_result["success"]:
                return Response({"detail": payment_result["message"]}, status=status.HTTP_402_PAYMENT_REQUIRED)
            return self._serve_file(resource)

        # Case 3: M-Pesa payment
        elif request.data.get("payment_method") == "mpesa":
            phone_number = request.data.get("phone_number")
            if not phone_number:
                return Response({"detail": "Phone number required for M-Pesa payment."},
                                status=status.HTTP_400_BAD_REQUEST)

            stk_response = send_stk_push(phone_number, price)

            if stk_response.get("ResponseCode") == "0":
                # Record pending transaction
                Transaction.objects.create(
                    user=request.user,
                    resource_id=str(resource.id),
                    resource_type=resource.__class__.__name__,
                    transaction_type="download",
                    amount=price,
                    status="pending"
                )
                return Response({
                    "message": "M-Pesa STK push sent. Enter your PIN to complete payment.",
                    "mpesa_response": stk_response
                })
            else:
                return Response({"detail": "M-Pesa payment initiation failed.", "error": stk_response},
                                status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Invalid payment method."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        """
        Allows downloading a file if:
        - Resource is free, OR
        - User has a completed transaction for it
        """
        resource = self.get_object()
        price = getattr(resource, "price", Decimal("0.00"))

        if price <= 0:
            return self._serve_file(resource)

        # Check if user has completed transaction for this resource
        has_paid = Transaction.objects.filter(
            user=request.user,
            resource_id=str(resource.id),
            resource_type=resource.__class__.__name__,
            transaction_type="download",
            status="completed"
        ).exists()

        if not has_paid:
            return Response({"detail": "Payment required before downloading."},
                            status=status.HTTP_402_PAYMENT_REQUIRED)

        return self._serve_file(resource)

    def _serve_file(self, resource):
        """Serve file & record completed transaction if not already recorded."""
        if resource.file:
            Transaction.objects.get_or_create(
               user=self.request.user,
               resource_id=str(resource.id),
               resource_type=resource.__class__.__name__,
               transaction_type="download",
               defaults={
                    "amount": getattr(resource, "price", Decimal("0.00")),
                    "status": "completed"
               }
           )
            return FileResponse(resource.file, as_attachment=True)
        return Response({"detail": "File not found"}, status=status.HTTP_404_NOT_FOUND)



class NoteViewSet(BaseResourceViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer


class PastPaperViewSet(BaseResourceViewSet):
    queryset = PastPaper.objects.all()
    serializer_class = PastPaperSerializer


class ExamViewSet(BaseResourceViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer


class NewsViewSet(BaseResourceViewSet):
    queryset = News.objects.all()
    serializer_class = NewsSerializer

