# resources/views.py
import io                                    
import datetime
import mimetypes
import os
import platform
from rest_framework import viewsets, permissions, filters, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse
from decimal import Decimal
from rest_framework.views import APIView


from .models import Note, PastPaper, Exam, News, Subject, Grade, EducationLevel, Topic, NewsCategory, NewsView, NewsPost
from .serializers import (
    NoteSerializer, PastPaperSerializer, ExamSerializer, NewsSerializer,
    SubjectSerializer, GradeSerializer, EducationLevelSerializer, TopicSerializer, NewsCategorySerializer,
    NewsPostSerializer, NewsViewSerializer
)

# Payments integration
from payments.services import process_wallet_purchase, initiate_one_time_purchase
from payments.serializers import PaymentSerializer
from payments.models import Transaction, Payment

# File handling libraries
from PyPDF2 import PdfReader, PdfWriter
# from PyPDF2.constants import Permissions
from PIL import Image, ImageDraw, ImageFont
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color


class IsAdminOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser


# ========== Lookup Model ViewSets (Read-Only for all users) ==========
class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    """List all subjects - no authentication required for reading"""
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.AllowAny]


class GradeViewSet(viewsets.ReadOnlyModelViewSet):
    """List all grades - no authentication required for reading"""
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [permissions.AllowAny]


class EducationLevelViewSet(viewsets.ReadOnlyModelViewSet):
    """List all education levels (curricula) - no authentication required for reading"""
    queryset = EducationLevel.objects.all()
    serializer_class = EducationLevelSerializer
    permission_classes = [permissions.AllowAny]


class TopicViewSet(viewsets.ReadOnlyModelViewSet):
    """List all topics - no authentication required for reading"""
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [permissions.AllowAny]


class NewsCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """List all news categories - no authentication required for reading"""
    queryset = NewsCategory.objects.all()
    serializer_class = NewsCategorySerializer
    permission_classes = [permissions.AllowAny]


# ========== Base Resource ViewSet ==========
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
            resource_id=(resource.id),
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

       
        file_path = resource.file.path
        user = self.request.user
        username = getattr(user, "username", None) or getattr(user, "email", "User")
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        # PDF Protection (commented out encryption part due to Permissions import issue)
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
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = 'application/octet-stream'

        return FileResponse(
            open(file_path, 'rb'),
            as_attachment=True,
            filename=os.path.basename(file_path),
            content_type=content_type,
)


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

        # Path map to fix URL generation
        path_map = {
            "Note": "notes",
            "PastPaper": "past-papers",
            "Exam": "exams",
            "News": "news",
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
                "title": getattr(resource, "title", getattr(resource, "headline", "Resource deleted")) if resource else "Resource deleted",
                "amount": tx.amount,
                "purchased_on": tx.created_at,
                "download_url": request.build_absolute_uri(
                    f"/api/resources/{path_map.get(tx.resource_type, tx.resource_type.lower()+'s')}/{tx.resource_id}/download/"
                ) if resource else None
            })

        return Response(data)


class NoteViewSet(BaseResourceViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    
    @action(detail=False, methods=['get'], url_path='admin/all', permission_classes=[IsAdminOnly])
    def admin_all_resources(self, request):
        """Admin endpoint to get all resources across all types"""
        notes = Note.objects.all()
        exams = Exam.objects.all()
        pastpapers = PastPaper.objects.all()
        news = News.objects.all()

        return Response({
            'notes': NoteSerializer(notes, many=True, context={'request': request}).data,
            'exams': ExamSerializer(exams, many=True, context={'request': request}).data,
            'pastpapers': PastPaperSerializer(pastpapers, many=True, context={'request': request}).data,
            'news': NewsSerializer(news, many=True, context={'request': request}).data,
        })


class PastPaperViewSet(BaseResourceViewSet):
    queryset = PastPaper.objects.all()
    serializer_class = PastPaperSerializer


class ExamViewSet(BaseResourceViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer


class NewsViewSet(BaseResourceViewSet):
    queryset = News.objects.all()
    serializer_class = NewsSerializer


class UnreadNewsListView(generics.ListAPIView):
    """
    Returns published news posts the current user hasn't 
    permanently dismissed.
    """
    serializer_class = NewsPostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        dismissed_ids = NewsView.objects.filter(
            user=user,
            dismissed_permanently=True
        ).values_list('post_id', flat=True)
        return NewsPost.objects.filter(
            is_published=True
        ).exclude(id__in=dismissed_ids)


class MarkNewsViewedView(APIView):
    """
    POST { post_id, dismissed_permanently: true/false }
    Creates or updates a NewsView record for the current user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        post_id = request.data.get('post_id')
        dismissed_permanently = request.data.get('dismissed_permanently', False)

        try:
            post = NewsPost.objects.get(id=post_id, is_published=True)
        except NewsPost.DoesNotExist:
            return Response(
                {'error': 'Post not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        news_view, created = NewsView.objects.get_or_create(
            user=request.user,
            post=post,
            defaults={'dismissed_permanently': dismissed_permanently}
        )
        if not created and dismissed_permanently:
            news_view.dismissed_permanently = True
            news_view.save()

        return Response({'status': 'ok'}, status=status.HTTP_200_OK)


class NewsPostAdminListCreateView(generics.ListCreateAPIView):
    serializer_class = NewsPostSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = NewsPost.objects.all()
    parser_classes = [MultiPartParser, FormParser]


class NewsPostAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NewsPostSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = NewsPost.objects.all()
    parser_classes = [MultiPartParser, FormParser]

class PublishedNewsListView(generics.ListAPIView):
    """Returns all published posts — for the News page feed."""
    serializer_class = NewsPostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return NewsPost.objects.filter(is_published=True)    