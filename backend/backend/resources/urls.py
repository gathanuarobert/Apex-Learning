from django.conf import settings
from django.conf.urls.static import static

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import NoteViewSet, PastPaperViewSet, ExamViewSet, NewsViewSet

router = DefaultRouter()
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'past-papers', PastPaperViewSet, basename='pastpaper')
router.register(r'exams', ExamViewSet, basename='exam')
router.register(r'news', NewsViewSet, basename='news')

urlpatterns = [
    path('',include(router.urls)),    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
