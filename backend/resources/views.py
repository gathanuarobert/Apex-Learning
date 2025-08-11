from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse

from .models import Note, PastPaper, Exam, News
from .serializers import NoteSerializer, PastPaperSerializer, ExamSerializer, NewsSerializer
from payments.services import process_download_payment  # <- service in payments app


class IsAdminOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser


class BaseResourceViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    permission_classes = [permissions.IsAuthenticated]  # read access = authenticated only

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOnly()]
        return super().get_permissions()

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        instance = self.get_object()

        # Call payments service to check payment
        payment_result = process_download_payment(user=request.user, resource=instance)

        if not payment_result["success"]:
            return Response(
                {"detail": payment_result["message"]},
                status=status.HTTP_402_PAYMENT_REQUIRED
            )

        if instance.file:
            return FileResponse(instance.file, as_attachment=True)

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
