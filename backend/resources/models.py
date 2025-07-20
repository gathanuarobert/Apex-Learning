from django.db import models

# Create your models here.
class ResourceCategory(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True, default="", help_text='Optional description for categories')

    def __str__(self):
        return self.name   