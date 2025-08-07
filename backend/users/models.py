from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    pass  # or add role, phone, etc. if needed temporarily
