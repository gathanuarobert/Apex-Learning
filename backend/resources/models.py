from django.db import models
import uuid
from django.conf import settings

class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Grade(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class EducationLevel(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Topic(models.Model):
    name = models.CharField(max_length=100, unique=True) 
    
    def __str__(self):
        return self.name 


class NewsCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name      


class Note(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    title = models.CharField(max_length=150)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, null=True, blank=True)
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, null=True, blank=True)
    education_level = models.ForeignKey(EducationLevel, on_delete=models.CASCADE, null=True, blank=True)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, null=True, blank=True)
    content = models.TextField()
    file = models.FileField(upload_to='notes_files/', blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # merged from resources-crud
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.subject} - {self.grade})"


class PastPaper(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    title = models.CharField(max_length=150)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, null=True, blank=True)
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, null=True, blank=True)
    education_level = models.ForeignKey(EducationLevel, on_delete=models.CASCADE, null=True, blank=True)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, null=True, blank=True)
    year = models.PositiveIntegerField()
    file = models.FileField(upload_to='pastpapers_files/', blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # merged from resources-crud
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject} - {self.grade} - {self.year}"


class Exam(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    title = models.CharField(max_length=150)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, null=True, blank=True)
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, null=True, blank=True)
    education_level = models.ForeignKey(EducationLevel, on_delete=models.CASCADE, null=True, blank=True)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, null=True, blank=True)
    date = models.DateField()
    description = models.TextField(blank=True, default="")
    file = models.FileField(upload_to='exams_files/', blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # merged from resources-crud
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.subject} - {self.grade})"


class News(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    headline = models.CharField(max_length=150)
    body = models.TextField()
    category = models.ForeignKey(NewsCategory, on_delete=models.CASCADE, null=True, blank=True)
    file = models.FileField(upload_to='news_files/', blank=True, null=True)
    published_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.headline
    
class NewsPost(models.Model):
    title = models.CharField(max_length=255)
    body = models.TextField()
    cover_image = models.ImageField(upload_to='news/covers/', blank=True, null=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class NewsView(models.Model):
    """Tracks which users have viewed/dismissed which news posts."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='news_views'
    )
    post = models.ForeignKey(
        NewsPost,
        on_delete=models.CASCADE,
        related_name='views'
    )
    viewed_at = models.DateTimeField(auto_now_add=True)
    dismissed_permanently = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'post')

    def __str__(self):
        return f"{self.user} - {self.post.title}"    
