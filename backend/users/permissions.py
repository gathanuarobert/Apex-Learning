from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAuthenticatedOrReadOnly(BasePermission):
    """
    Allow GET/HEAD/OPTIONS to any user (authenticated or guest).
    Require authentication for all write / download / action endpoints.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)


class IsAuthenticatedForDownload(BasePermission):
    """
    Blanket guard for any download or purchase endpoint.
    Returns 401 (not 403) so the frontend knows to show the login prompt
    rather than a generic forbidden page.
    """
    message = "Authentication required to download or purchase resources."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            # Set 401 status on the response so frontend can intercept cleanly
            self.status_code = 401
            return False
        return True