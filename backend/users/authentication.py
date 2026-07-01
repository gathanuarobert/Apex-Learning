from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings


class CookieJWTAuthentication(JWTAuthentication):
    """
    Reads the JWT access token from an HttpOnly cookie
    instead of the Authorization header.

    Registered in settings.py under:
        REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']
            → 'users.authentication.CookieJWTAuthentication'
    """

    def authenticate(self, request):
        cookie_name = getattr(settings, 'JWT_AUTH_COOKIE', 'apex_access')
        raw_token = request.COOKIES.get(cookie_name)

        if raw_token is None:
            return None  # No cookie → anonymous user

        try:
            validated_token = self.get_validated_token(raw_token)
        except TokenError:
            return None  # Expired/invalid token → anonymous, not 401

        try:
            user = self.get_user(validated_token)
        except AuthenticationFailed:
            return None

        return (user, validated_token)