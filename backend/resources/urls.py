# resources/urls.py
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    NoteViewSet, PastPaperViewSet, ExamViewSet, NewsViewSet, UserLibraryViewSet,
    SubjectViewSet, GradeViewSet, EducationLevelViewSet, TopicViewSet, NewsCategoryViewSet,
    UnreadNewsListView,
    MarkNewsViewedView,
    NewsPostAdminListCreateView,
    NewsPostAdminDetailView,
)

router = DefaultRouter()
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'past-papers', PastPaperViewSet, basename='pastpaper')
router.register(r'exams', ExamViewSet, basename='exam')
router.register(r'news', NewsViewSet, basename='news')
router.register(r'library', UserLibraryViewSet, basename='library')

# Lookup tables (read-only)
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'grades', GradeViewSet, basename='grade')
router.register(r'education-levels', EducationLevelViewSet, basename='educationlevel')
router.register(r'topics', TopicViewSet, basename='topic')
router.register(r'news-categories', NewsCategoryViewSet, basename='newscategory')

urlpatterns = [
    

    # News notification endpoints
    path('news/unread/', UnreadNewsListView.as_view(), name='news-unread'),
    path('news/mark-viewed/', MarkNewsViewedView.as_view(), name='news-mark-viewed'),

    # Admin news management
    path('admin/news/', NewsPostAdminListCreateView.as_view(), name='admin-news-list'),
    path('admin/news/<int:pk>/', NewsPostAdminDetailView.as_view(), name='admin-news-detail'),
    path('', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)