from rest_framework import serializers
from .models import User, TeacherProfile, StudentProfile, ParentProfile, PublicProfile
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.translation import gettext_lazy as _

class TeacherProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherProfile
        fields = ['subject']

class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ['grade']

class ParentProfileSerializer(serializers.ModelSerializer):
    children = serializers.PrimaryKeyRelatedField(
        queryset=StudentProfile.objects.all(), many=True, required=False)                

    class Meta:
        model = ParentProfile
        fields = ['id', 'user', 'children']
        extra_kwargs = {
            'children': {'required': False}
        }     

class PublicProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicProfile
        fields = ['user']

class UserSerializer(serializers.ModelSerializer):
    teacher_profile = TeacherProfileSerializer(required=False)
    student_profile = StudentProfileSerializer(required=False)
    parent_profile = ParentProfileSerializer(required=False)
    public_profile = PublicProfileSerializer(required=False)
    password = serializers.CharField(write_only=True)

    # ✅ Add superuser/staff flags
    is_superuser = serializers.BooleanField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields =  [
            'id', 'email', 'name', 'role', 'password',
            'teacher_profile', 'student_profile', 'parent_profile', 'public_profile',
            'is_superuser', 'is_staff'  # ✅ added
        ]
        
    def create(self, validated_data):
        role = validated_data.get('role')
        profile_data = {}

        if role == 'teacher':
            profile_data = validated_data.pop('teacher_profile', {})
        elif role == 'student':
            profile_data = validated_data.pop('student_profile', {})
        elif role == 'parent':
            profile_data = validated_data.pop('parent_profile', {})
        elif role == 'public':
            profile_data = validated_data.pop('public_profile', {})    

        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        if role == 'teacher':
            TeacherProfile.objects.create(user=user, **profile_data)
        elif role == 'student':
            StudentProfile.objects.create(user=user, **profile_data)
        elif role == 'parent':
            profile = ParentProfile.objects.create(user=user)
            if 'children' in profile_data:
                profile.children.set(profile_data['children'])
        elif role == 'public':
            PublicProfile.objects.create(user=user, **profile_data)        

        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)        
    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)
    user = UserSerializer(read_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError(_('Invalid email or password'))
        
        if not user.is_active:
            raise serializers.ValidationError(_('User account is disabled'))
        
        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data  # ✅ now includes is_superuser & is_staff
        }
