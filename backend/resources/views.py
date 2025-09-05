from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse
from decimal import Decimal

from .models import Note, PastPaper, Exam, News
from .serializers import NoteSerializer, PastPaperSerializer, ExamSerializer, NewsSerializer

# Payments integration
from payments.services import process_wallet_purchase, initiate_one_time_purchase
from payments.serializers import PaymentSerializer
from payments.models import Transaction, Payment

# File handling libraries
import io
import datetime
from PyPDF2 import PdfReader, PdfWriter
# from PyPDF2.constants import Permissions
from PIL import Image, ImageDraw, ImageFont
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color
from django.http import FileResponse
from decimal import Decimal


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
            payment_result = process_wallet_purchase(user=request.user, resource=resource)
            if not payment_result["success"]:
                return Response({"detail": payment_result["message"]}, status=status.HTTP_402_PAYMENT_REQUIRED)
            return self._serve_file(resource)

        # Case 3: M-Pesa payment
        elif request.data.get("payment_method") == "mpesa":
            phone_number = request.data.get("phone_number")
            if not phone_number:
                return Response({"detail": "Phone number required for M-Pesa payment."},
                                status=status.HTTP_400_BAD_REQUEST)

            # Create Payment record + send STK push
            payment, stk_response = initiate_one_time_purchase(
                user=request.user,
                resource=resource,
                phone_number=phone_number
            )

            return Response({
                "message": "M-Pesa STK push sent. Enter your PIN to complete payment.",
                "payment": PaymentSerializer(payment).data,
                "mpesa_response": stk_response
            }, status=status.HTTP_201_CREATED)

        return Response({"detail": "Invalid payment method."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        """
        Allows downloading a file if:
        - Resource is free, OR
        - User has completed payment (wallet or M-Pesa)
        """
        resource = self.get_object()
        price = getattr(resource, "price", Decimal("0.00"))

        if price <= 0:
            return self._serve_file(resource)

        # Wallet/M-Pesa payment check (use 'purchase' consistently)
        has_payment = Transaction.objects.filter(
            user=request.user,
            resource_id=str(resource.id),
            resource_type=resource.__class__.__name__,
            transaction_type="purchase",
            status="completed"
        ).exists()

        if not has_payment:
            return Response(
                {"detail": "Payment required before downloading."},
                status=status.HTTP_402_PAYMENT_REQUIRED
            )

        return self._serve_file(resource)

    def _serve_file(self, resource):
        """Serve file securely & record completed transaction if not already recorded."""
        if not resource.file:
            return Response({"detail": "File not found"}, status=status.HTTP_404_NOT_FOUND)

    # Record completed transaction if missing
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

        file_path = resource.file.path
        username = self.request.user.username
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        # PDF Protection
        if file_path.lower().endswith(".pdf"):
            reader = PdfReader(file_path)
            writer = PdfWriter()

            watermark_stream = io.BytesIO()
            c = canvas.Canvas(watermark_stream, pagesize=letter)
            c.setFont("Helvetica-Bold", 30)
            c.setFillColor(Color(1, 0, 0, alpha=0.3))  # semi-transparent red
            c.saveState()
            c.translate(300, 400)  # move center
            c.rotate(45)  # diagonal
            c.drawCentredString(0, 0, f"Downloaded by {username} on {timestamp}")
            c.restoreState()
            c.save()
            watermark_stream.seek(0)

            watermark_pdf = PdfReader(watermark_stream)
            watermark_page = watermark_pdf.pages[0]

        # Apply watermark to each page
            for page in reader.pages:
                page.merge_page(watermark_page)
                writer.add_page(page)

            # Set metadata (optional)
            writer.add_metadata({
                "/Title": resource.title if hasattr(resource, "title") else "Protected File",
                "/Author": username
            })

            # Encrypt PDF - disable copy & print
            writer.encrypt(
                user_password="",
                owner_password="securepass",
                permissions_flag=Permissions.DISALLOW_COPYING | Permissions.DISALLOW_PRINTING
            )

            output_stream = io.BytesIO()
            writer.write(output_stream)
            output_stream.seek(0)
            return FileResponse(output_stream, as_attachment=True, filename=resource.file.name)

        # Image Watermarking
        if file_path.lower().endswith((".jpg", ".jpeg", ".png")):
            img = Image.open(file_path).convert("RGBA")
            txt_layer = Image.new("RGBA", img.size, (255, 255, 255, 0))
            draw = ImageDraw.Draw(txt_layer)

            # Font size based on image width
            font_size = max(20, img.size[0] // 30)
            import os
            import platform
            try:
                if platform.system() == "Windows":
                    font_path = "arial.ttf"  # Windows default
                else:
                    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"  # Linux default

                if not os.path.exists(font_path):
                    raise FileNotFoundError(f"Font not found at {font_path}")

                font = ImageFont.truetype(font_path, font_size)
            except Exception:
                font = ImageFont.load_default()

            # Semi-transparent watermark
            text = f"Downloaded by {username} on {timestamp}"
            draw.text((10, 10), text, fill=(255, 0, 0, 128), font=font)

            watermarked = Image.alpha_composite(img, txt_layer)
            output = io.BytesIO()
            watermarked.convert("RGB").save(output, format="JPEG")
            output.seek(0)
            return FileResponse(output, as_attachment=True, filename=resource.file.name)

        # Default: serve file normally
        return FileResponse(resource.file, as_attachment=True)

class UserLibraryViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='my-downloads')
    def my_downloads(self, request):
        """
        Returns all resources (Notes, Exams, PastPapers, News)
        the user has purchased successfully.
        """
        transactions = Transaction.objects.filter(
            user=request.user,
            transaction_type="purchase",
            status="completed"
        ).order_by("-created_at")

        # Map resource_type string -> model
        model_map = {
            "Note": Note,
            "PastPaper": PastPaper,
            "Exam": Exam,
            "News": News,
        }

        data = []
        for tx in transactions:
            model_class = model_map.get(tx.resource_type)
            resource = None
            if model_class:
                try:
                    resource = model_class.objects.get(id=tx.resource_id)
                except model_class.DoesNotExist:
                    pass

            data.append({
                "transaction_id": tx.id,
                "resource_id": tx.resource_id,
                "resource_type": tx.resource_type,
                "title": getattr(resource, "title", "Resource deleted") if resource else "Resource deleted",
                "amount": tx.amount,
                "purchased_on": tx.created_at,
                "download_url": request.build_absolute_uri(
                    f"/api/{tx.resource_type.lower()}s/{tx.resource_id}/download/"
                ) if resource else None
            })

        return Response(data)

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
