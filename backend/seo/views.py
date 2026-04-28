"""
seo/views.py
Serves sitemap.xml and robots.txt for Apex Learning Hub.
Only static pages: Home, About, and Contact.
"""

from django.http import HttpResponse
from django.views import View
from django.utils import timezone


SITE_URL = "https://apexlearning.co.ke"


class SitemapView(View):
    """GET /sitemap.xml"""

    def get(self, request):
        today = timezone.now().date().strftime("%Y-%m-%d")

        pages = [
            {"path": "/",        "changefreq": "weekly",  "priority": "1.0"},
            {"path": "/about",   "changefreq": "monthly", "priority": "0.5"},
        ]

        urls = ""
        for page in pages:
            urls += (
                f"<url>\n"
                f"  <loc>{SITE_URL}{page['path']}</loc>\n"
                f"  <lastmod>{today}</lastmod>\n"
                f"  <changefreq>{page['changefreq']}</changefreq>\n"
                f"  <priority>{page['priority']}</priority>\n"
                f"</url>\n"
            )

        xml = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + urls
            + "</urlset>"
        )

        return HttpResponse(xml, content_type="application/xml")


class RobotsView(View):
    """GET /robots.txt"""

    def get(self, request):
        content = (
            "User-agent: *\n"
            "Allow: /\n"
            "\n"
            f"Sitemap: {SITE_URL}/sitemap.xml\n"
        )
        return HttpResponse(content, content_type="text/plain")