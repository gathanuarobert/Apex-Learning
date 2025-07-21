from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import User, ParentProfile, StudentProfile
from .serializers import UserSerializer, LoginSerializer, ParentProfileSerializer

# Create your views here.
class RegistrationUserView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
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
