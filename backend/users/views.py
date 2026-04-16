from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.generics import ListAPIView, DestroyAPIView
from rest_framework.permissions import IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, ParentProfile, StudentProfile
from .serializers import UserSerializer, LoginSerializer, ParentProfileSerializer
from .permissions import IsAuthenticatedOrReadOnly, IsAuthenticatedForDownload
from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests
import logging
import os

logger = logging.getLogger(__name__)


def verify_recaptcha(token):
    """
    Verify the Google reCAPTCHA token with Google's API.
    In DEBUG mode, skip verification.
    """
    if settings.DEBUG:
        return True
    url = "https://www.google.com/recaptcha/api/siteverify"
    data = {
        "secret": settings.RECAPTCHA_SECRET_KEY,
        "response": token,
    }
    try:
        response = requests.post(url, data=data)
        result = response.json()
        return result.get("success", False)
    except Exception:
        return False


# ============================================
# COOKIE HELPERS
# ============================================

def _set_auth_cookies(response, access_token, refresh_token=None):
    """
    Attach JWT tokens as HttpOnly cookies to any Response object.
    Secure flag is on in production (DEBUG=False).
    """
    secure   = not settings.DEBUG
    samesite = getattr(settings, 'JWT_AUTH_COOKIE_SAMESITE', 'Lax')

    access_cookie  = getattr(settings, 'JWT_AUTH_COOKIE',         'apex_access')
    refresh_cookie = getattr(settings, 'JWT_AUTH_REFRESH_COOKIE', 'apex_refresh')

    response.set_cookie(
        key=access_cookie,
        value=str(access_token),
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=60 * 15,        # 15 minutes — matches SIMPLE_JWT ACCESS_TOKEN_LIFETIME
        path='/',
    )

    if refresh_token is not None:
        response.set_cookie(
            key=refresh_cookie,
            value=str(refresh_token),
            httponly=True,
            secure=secure,
            samesite=samesite,
            max_age=60 * 60 * 24 * 7,   # 7 days
            path='/',
        )

    return response


def _clear_auth_cookies(response):
    """Expire both auth cookies."""
    access_cookie  = getattr(settings, 'JWT_AUTH_COOKIE',         'apex_access')
    refresh_cookie = getattr(settings, 'JWT_AUTH_REFRESH_COOKIE', 'apex_refresh')
    response.delete_cookie(access_cookie,  path='/')
    response.delete_cookie(refresh_cookie, path='/')
    return response


# ============================================
# AUTH VIEWS
# ============================================
class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        credential = request.data.get("credential")
        if not credential:
            return Response({"detail": "No credential provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                os.environ.get("VITE_GOOGLE_CLIENT_ID")
            )
            email = idinfo.get("email")
            name  = idinfo.get("name", "")

            user, created = User.objects.get_or_create(
                email=email,
                defaults={"name": name, "role": "public"}
            )

            refresh  = RefreshToken.for_user(user)
            response = Response({"user": UserSerializer(user).data}, status=status.HTTP_200_OK)
            _set_auth_cookies(response, refresh.access_token, str(refresh))
            return response

        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CookieTokenRefreshView(APIView):
    """
    Reads the refresh token from the HttpOnly cookie and returns
    a new access token as a cookie (not in the response body).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_cookie = getattr(settings, 'JWT_AUTH_REFRESH_COOKIE', 'apex_refresh')
        refresh_token  = request.COOKIES.get(refresh_cookie)

        if not refresh_token:
            return Response(
                {'error': 'No refresh token provided'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            refresh    = RefreshToken(refresh_token)
            new_access = refresh.access_token

            rotate = getattr(settings, 'SIMPLE_JWT', {}).get('ROTATE_REFRESH_TOKENS', False)

            response = Response({'detail': 'Token refreshed'}, status=status.HTTP_200_OK)
            _set_auth_cookies(
                response,
                access_token=new_access,
                refresh_token=str(refresh) if rotate else None,
            )
            return response

        except Exception as e:
            logger.warning(f"[TokenRefresh] Failed: {e}")
            response = Response(
                {'error': 'Invalid or expired refresh token'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            _clear_auth_cookies(response)
            return response


class UserListView(ListAPIView):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class UserDeleteView(DestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class RegistrationUserView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        recaptcha_token = request.data.get("recaptcha")
        if not recaptcha_token or not verify_recaptcha(recaptcha_token):
            return Response(
                {"detail": "Invalid reCAPTCHA. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # ✅ Issue tokens and set cookies so the user is logged in immediately
            refresh = RefreshToken.for_user(user)
            response = Response({
                'message': 'User registered successfully',
                'user': UserSerializer(user).data,
            }, status=status.HTTP_201_CREATED)
            _set_auth_cookies(response, refresh.access_token, str(refresh))
            return response

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Check reCAPTCHA
        recaptcha_token = request.data.get("recaptcha")
        if not recaptcha_token or not verify_recaptcha(recaptcha_token):
            return Response(
                {"detail": "Invalid reCAPTCHA. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # ✅ LoginSerializer.validate() already calls authenticate() and builds
        # the refresh token internally. We re-authenticate here to get the actual
        # User model instance so we can issue fresh cookies via RefreshToken.for_user().
        # This avoids relying on the serialized dict which is not a model instance.
        email    = request.data.get('email')
        password = request.data.get('password')
        user     = authenticate(request, email=email, password=password)

        if user is None:
            return Response(
                {'detail': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)

        response = Response({
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)

        _set_auth_cookies(response, refresh.access_token, str(refresh))
        return response


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_cookie = getattr(settings, 'JWT_AUTH_REFRESH_COOKIE', 'apex_refresh')
        refresh_token  = request.COOKIES.get(refresh_cookie)

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception as e:
                logger.warning(f"[Logout] Could not blacklist token: {e}")

        response = Response(
            {'message': 'Logged out successfully'},
            status=status.HTTP_205_RESET_CONTENT
        )
        _clear_auth_cookies(response)
        return response


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
    

class UpdateUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        user = request.user
        # Only allow name and email to be updated
        allowed_fields = {'name', 'email'}
        data = {k: v for k, v in request.data.items() if k in allowed_fields}

        if 'email' in data and User.objects.exclude(pk=user.pk).filter(email=data['email']).exists():
            return Response(
                {'error': 'Email already in use by another account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        for field, value in data.items():
            setattr(user, field, value)
        user.save()

        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not current_password or not new_password or not confirm_password:
            return Response(
                {'error': 'All fields are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {'error': 'New passwords do not match.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        # Re-issue tokens since password changed
        refresh = RefreshToken.for_user(user)
        response = Response(
            {'message': 'Password changed successfully.'},
            status=status.HTTP_200_OK
        )
        _set_auth_cookies(response, refresh.access_token, str(refresh))
        return response


class AddChildrenToParentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != 'parent':
            return Response(
                {'detail': 'Only parent profiles can add children'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            parent_profile = ParentProfile.objects.get(user=user)
        except ParentProfile.DoesNotExist:
            return Response(
                {'detail': 'Parent profile does not exist'},
                status=status.HTTP_404_NOT_FOUND
            )

        child_ids = request.data.get('children', [])
        if not isinstance(child_ids, list):
            return Response(
                {'detail': 'Children must be a list of student profile IDs'},
                status=status.HTTP_400_BAD_REQUEST
            )

        children = StudentProfile.objects.filter(id__in=child_ids)
        parent_profile.children.set(children)
        parent_profile.save()

        return Response({
            "message": "Children and parent linked successfully",
            "parent_profile": ParentProfileSerializer(parent_profile).data,
        }, status=status.HTTP_200_OK)
    

class GuestStatusView(APIView):
    """
    Lightweight endpoint the frontend polls on boot to resolve auth state.
    Returns the current user or an explicit guest flag — no DB write needed.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if request.user and request.user.is_authenticated:
            return Response({
                "is_guest": False,
                "user": UserSerializer(request.user).data,
            })
        return Response({"is_guest": True, "user": None})


class DownloadResourceView(APIView):
    """
    Example protected download endpoint.
    Swap out the stub body for your real file-serving / S3 redirect logic.
    """
    permission_classes = [IsAuthenticatedForDownload]

    def get(self, request, resource_id):
        # TODO: fetch resource, generate signed URL or stream file
        return Response(
            {"detail": f"Download link for resource {resource_id}"},
            status=status.HTTP_200_OK,
        )    