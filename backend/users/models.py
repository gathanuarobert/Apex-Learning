from django.contrib.auth.models import AbstractBaseUser, UserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class CustomUserManager(UserManager):
    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('Email field must be set')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user
    
    def create_user(self,email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)
    
    def create_superuser(self, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self._create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('parent', 'Parent'),
        ('public', 'General Public'),
    )
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=30, blank=True, default='')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def get_full_name(self):
        return self.name

    def get_short_name(self):
        return self.name or self.email.split('@')[0]    
    
class TeacherProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile', null=True, blank=True)
    subject = models.CharField(max_length=100, blank=True, default='')

    def __str__(self):
        return f'Teacher Profile of {self.user.get_full_name()}' if self.user else 'Teacher Profile'

    def save(self, *args, **kwargs):
        if self.user.role != 'teacher':
            raise ValueError("Assigned user is not a teacher")
        super().save(*args, **kwargs)


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile', null=True, blank=True)
    grade = models.CharField(max_length=10, blank=True, default='') 

    def __str__(self):
        return f'Student Profile of {self.user.get_full_name()}' if self.user else 'Student Profile'
    
    def save(self, *args, **kwargs):
        if self.user.role != 'student':
            raise ValueError("Assigned user is not a student")
        super().save(*args, **kwargs)

class ParentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='parent_profile', null=True, blank=True)
    children = models.ManyToManyField(StudentProfile, blank=True, related_name='parents')

    def __str__(self):
        return f'Parent Profile of {self.user.get_full_name()}' if self.user else 'Parent Profile'

    def save(self, *args, **kwargs):
        if self.user.role != 'parent':
            raise ValueError("Assigned user is not a parent")
        super().save(*args, **kwargs)

class PublicProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='public_profile', null=True, blank=True)

    def __str__(self):
        return f'Public Profile of {self.user.get_full_name()}' if self.user else 'Public Profile'

    def save(self, *args, **kwargs):
        if self.user.role != 'public':
            raise ValueError("Assigned user is not a public user")
        super().save(*args, **kwargs)        

