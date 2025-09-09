from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.generics import ListAPIView, DestroyAPIView
from rest_framework.permissions import IsAdminUser
from .models import User, ParentProfile, StudentProfile
from .serializers import UserSerializer, LoginSerializer, ParentProfileSerializer
from django.conf import settings
import requests


def verify_recaptcha(token):
    """
    Verify the Google reCAPTCHA token with Google's API.
    """
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


# Create your views here.
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
            return Response({
                'message': 'User registered successfully',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # ✅ Check reCAPTCHA
        recaptcha_token = request.data.get("recaptcha")
        if not recaptcha_token or not verify_recaptcha(recaptcha_token):
            return Response(
                {"detail": "Invalid reCAPTCHA. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ✅ Continue with normal login
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AddChildrenToParentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != 'parent':
            return Response({'detail': 'Only parent profiles can add children'}, status=status.HTTP_403_FORBIDDEN)
        try:
            parent_profile = ParentProfile.objects.get(user=user)
        except ParentProfile.DoesNotExist:
            return Response({'detail': 'Parent profile does not exist'}, status=status.HTTP_404_NOT_FOUND)
        
        child_ids = request.data.get('children', [])
        if not isinstance(child_ids, list):
            return Response({'detail': 'Children must be a list of student profile IDs'}, status=status.HTTP_400_BAD_REQUEST)
        
        children = StudentProfile.objects.filter(id__in=child_ids)
        parent_profile.children.set(children)
        parent_profile.save()

        return Response({
            "message": "Children and parent linked successfully",
            "parent_profile": ParentProfileSerializer(parent_profile).data,
        }, status=status.HTTP_200_OK)
