# apex_learning/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # include app URLs
    path("api/payments/", include("payments.urls")),
    path("api/resources/", include("resources.urls")),
    path("api/users/", include("users.urls")),
]
