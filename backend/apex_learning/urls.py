# apex_learning/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from users.views import CookieTokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("seo.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/resources/", include("resources.urls")),
    path("api/users/", include("users.urls")),
    path("api/users/token/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)