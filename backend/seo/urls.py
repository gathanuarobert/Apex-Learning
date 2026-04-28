"""
seo/urls.py
Wire into your main urls.py with:
    path("", include("seo.urls")),
"""

from django.urls import path
from .views import SitemapView, RobotsView

urlpatterns = [
    path("sitemap.xml", SitemapView.as_view(), name="sitemap"),
    path("robots.txt", RobotsView.as_view(), name="robots"),
]