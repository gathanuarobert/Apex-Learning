from rest_framework import viewsets, permissions
from django.http import FileResponse
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Note, PastPaper, Exam, News
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import NoteSerializer, PastPaperSerializer, ExamSerializer, NewsSerializer

class IsTeacherOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
           request.user.role == 'teacher' or request.user.is_superuser
        )

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def download(self, request, pk=None):
        note = self.get_object()
        if note.file:
            return FileResponse(note.file, as_attachment=True)
        return Response({"detail": "File not found"}, status=404)

class PastPaperViewSet(viewsets.ModelViewSet):
    queryset = PastPaper.objects.all()
    serializer_class = PastPaperSerializer
    parser_classes = [MultiPartParser,FormParser]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        past_paper = self.get_object()
        if past_paper.file:
            return FileResponse(past_paper.file, as_attachment=True)
        return Response({"detail": "File not found"}, status=404)        

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]  
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        exam = self.get_object()
        if exam.file:
            return FileResponse(exam.file, as_attachment=True)
        return Response({"detail": "File not found"}, status=404)          

class NewsViewSet(viewsets.ModelViewSet):
    queryset = News.objects.all()
    serializer_class = NewsSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]            
