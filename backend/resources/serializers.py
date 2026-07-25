# resources/serializers.py
from rest_framework import serializers
from .models import Note, PastPaper, Exam, News, Subject, Grade, EducationLevel, Topic, NewsCategory, NewsPost, NewsView
import os


# ========== Reusable File Validator ==========
ALLOWED_EXTENSIONS = [
    '.pdf', '.doc', '.docx', '.ppt', '.pptx',
    '.jpg', '.jpeg', '.png',
    '.xlsx', '.xls', '.csv',
]
MAX_FILE_SIZE_MB = 50

def validate_file(file):
    if file:
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"Unsupported file type '{ext}'. "
                f"Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        if file.size > MAX_FILE_SIZE_MB * 1024 * 1024:
            raise serializers.ValidationError(
                f"File too large. Maximum size is {MAX_FILE_SIZE_MB}MB. "
                f"Your file is {round(file.size / (1024*1024), 1)}MB."
            )
    return file


class BaseFileSerializer(serializers.ModelSerializer):
    """
    Used for list views. 'file' is write_only (admins can still upload
    through it) so the raw file path/URL is never rendered in output —
    it must never be used to serve paid content directly.
    """
    def validate_file(self, value):
        return validate_file(value)


class BaseFileDetailSerializer(BaseFileSerializer):
    """
    Used for retrieve/download views. Exposes file_url, but ONLY when the
    requesting user is entitled to it: admin, resource is free (price <= 0),
    or the user has a completed purchase. Everyone else gets null and must
    go through the gated /download/ action (which watermarks + checks payment
    server-side). This is the fix for the direct-download payment bypass.
    """
    file_url = serializers.SerializerMethodField()

    def get_file_url(self, obj):
        request = self.context.get('request')
        if not request or not obj.file or not hasattr(obj.file, 'url'):
            return None

        user = request.user
        is_admin = bool(user and user.is_authenticated and (user.is_staff or user.is_superuser))
        price = getattr(obj, 'price', None)
        is_free = price is None or price <= 0
        is_purchased = getattr(obj, 'is_purchased', False)

        if not (is_admin or is_free or is_purchased):
            return None

        return request.build_absolute_uri(obj.file.url)


# ========== Lookup Model Serializers ==========
class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name']


class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ['id', 'name']


class EducationLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationLevel
        fields = ['id', 'name']


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ['id', 'name']


class NewsCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsCategory
        fields = ['id', 'name']


# ========== Note Serializers ==========
class NoteSerializer(BaseFileSerializer):
    subject      = serializers.CharField(source='subject.name',         read_only=True, allow_null=True)
    grade        = serializers.CharField(source='grade.name',           read_only=True, allow_null=True)
    curriculum   = serializers.CharField(source='education_level.name', read_only=True, allow_null=True)
    topic        = serializers.CharField(source='topic.name',           read_only=True, allow_null=True)
    is_purchased = serializers.BooleanField(read_only=True, default=False)

    subject_id         = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(),        source='subject',         write_only=True, allow_null=True, required=False)
    grade_id           = serializers.PrimaryKeyRelatedField(queryset=Grade.objects.all(),           source='grade',           write_only=True, allow_null=True, required=False)
    education_level_id = serializers.PrimaryKeyRelatedField(queryset=EducationLevel.objects.all(), source='education_level', write_only=True, allow_null=True, required=False)
    topic_id           = serializers.PrimaryKeyRelatedField(queryset=Topic.objects.all(),           source='topic',           write_only=True, allow_null=True, required=False)

    class Meta:
        model = Note
        fields = [
            'id', 'title',
            'subject', 'grade', 'curriculum', 'topic',
            'subject_id', 'grade_id', 'education_level_id', 'topic_id',
            'content', 'description', 'price', 'file', 'created_at', 'updated_at',
            'is_purchased',
        ]
        extra_kwargs = {'file': {'write_only': True}}


class NoteDetailSerializer(BaseFileDetailSerializer):
    subject      = serializers.CharField(source='subject.name',         read_only=True, allow_null=True)
    grade        = serializers.CharField(source='grade.name',           read_only=True, allow_null=True)
    curriculum   = serializers.CharField(source='education_level.name', read_only=True, allow_null=True)
    topic        = serializers.CharField(source='topic.name',           read_only=True, allow_null=True)
    is_purchased = serializers.BooleanField(read_only=True, default=False)

    subject_id         = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(),        source='subject',         write_only=True, allow_null=True, required=False)
    grade_id           = serializers.PrimaryKeyRelatedField(queryset=Grade.objects.all(),           source='grade',           write_only=True, allow_null=True, required=False)
    education_level_id = serializers.PrimaryKeyRelatedField(queryset=EducationLevel.objects.all(), source='education_level', write_only=True, allow_null=True, required=False)
    topic_id           = serializers.PrimaryKeyRelatedField(queryset=Topic.objects.all(),           source='topic',           write_only=True, allow_null=True, required=False)

    class Meta:
        model = Note
        fields = [
            'id', 'title',
            'subject', 'grade', 'curriculum', 'topic',
            'subject_id', 'grade_id', 'education_level_id', 'topic_id',
            'content', 'description', 'price', 'file', 'file_url', 'created_at', 'updated_at',
            'is_purchased',
        ]
        extra_kwargs = {'file': {'write_only': True}}


# ========== PastPaper Serializers ==========
class PastPaperSerializer(BaseFileSerializer):
    subject      = serializers.CharField(source='subject.name',         read_only=True, allow_null=True)
    grade        = serializers.CharField(source='grade.name',           read_only=True, allow_null=True)
    curriculum   = serializers.CharField(source='education_level.name', read_only=True, allow_null=True)
    topic        = serializers.CharField(source='topic.name',           read_only=True, allow_null=True)
    is_purchased = serializers.BooleanField(read_only=True, default=False)

    subject_id         = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(),        source='subject',         write_only=True, allow_null=True, required=False)
    grade_id           = serializers.PrimaryKeyRelatedField(queryset=Grade.objects.all(),           source='grade',           write_only=True, allow_null=True, required=False)
    education_level_id = serializers.PrimaryKeyRelatedField(queryset=EducationLevel.objects.all(), source='education_level', write_only=True, allow_null=True, required=False)
    topic_id           = serializers.PrimaryKeyRelatedField(queryset=Topic.objects.all(),           source='topic',           write_only=True, allow_null=True, required=False)

    class Meta:
        model = PastPaper
        fields = [
            'id', 'title',
            'subject', 'grade', 'curriculum', 'topic',
            'subject_id', 'grade_id', 'education_level_id', 'topic_id',
            'year', 'description', 'price', 'file', 'created_at',
            'is_purchased',
        ]
        extra_kwargs = {'file': {'write_only': True}}


class PastPaperDetailSerializer(BaseFileDetailSerializer):
    subject      = serializers.CharField(source='subject.name',         read_only=True, allow_null=True)
    grade        = serializers.CharField(source='grade.name',           read_only=True, allow_null=True)
    curriculum   = serializers.CharField(source='education_level.name', read_only=True, allow_null=True)
    topic        = serializers.CharField(source='topic.name',           read_only=True, allow_null=True)
    is_purchased = serializers.BooleanField(read_only=True, default=False)

    subject_id         = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(),        source='subject',         write_only=True, allow_null=True, required=False)
    grade_id           = serializers.PrimaryKeyRelatedField(queryset=Grade.objects.all(),           source='grade',           write_only=True, allow_null=True, required=False)
    education_level_id = serializers.PrimaryKeyRelatedField(queryset=EducationLevel.objects.all(), source='education_level', write_only=True, allow_null=True, required=False)
    topic_id           = serializers.PrimaryKeyRelatedField(queryset=Topic.objects.all(),           source='topic',           write_only=True, allow_null=True, required=False)

    class Meta:
        model = PastPaper
        fields = [
            'id', 'title',
            'subject', 'grade', 'curriculum', 'topic',
            'subject_id', 'grade_id', 'education_level_id', 'topic_id',
            'year', 'description', 'price', 'file', 'file_url', 'created_at',
            'is_purchased',
        ]
        extra_kwargs = {'file': {'write_only': True}}


# ========== Exam Serializers ==========
class ExamSerializer(BaseFileSerializer):
    subject      = serializers.CharField(source='subject.name',         read_only=True, allow_null=True)
    grade        = serializers.CharField(source='grade.name',           read_only=True, allow_null=True)
    curriculum   = serializers.CharField(source='education_level.name', read_only=True, allow_null=True)
    topic        = serializers.CharField(source='topic.name',           read_only=True, allow_null=True)
    is_purchased = serializers.BooleanField(read_only=True, default=False)

    subject_id         = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(),        source='subject',         write_only=True, allow_null=True, required=False)
    grade_id           = serializers.PrimaryKeyRelatedField(queryset=Grade.objects.all(),           source='grade',           write_only=True, allow_null=True, required=False)
    education_level_id = serializers.PrimaryKeyRelatedField(queryset=EducationLevel.objects.all(), source='education_level', write_only=True, allow_null=True, required=False)
    topic_id           = serializers.PrimaryKeyRelatedField(queryset=Topic.objects.all(),           source='topic',           write_only=True, allow_null=True, required=False)

    class Meta:
        model = Exam
        fields = [
            'id', 'title',
            'subject', 'grade', 'curriculum', 'topic',
            'subject_id', 'grade_id', 'education_level_id', 'topic_id',
            'date', 'description', 'price', 'file', 'created_at',
            'is_purchased',
        ]
        extra_kwargs = {'file': {'write_only': True}}


class ExamDetailSerializer(BaseFileDetailSerializer):
    subject      = serializers.CharField(source='subject.name',         read_only=True, allow_null=True)
    grade        = serializers.CharField(source='grade.name',           read_only=True, allow_null=True)
    curriculum   = serializers.CharField(source='education_level.name', read_only=True, allow_null=True)
    topic        = serializers.CharField(source='topic.name',           read_only=True, allow_null=True)
    is_purchased = serializers.BooleanField(read_only=True, default=False)

    subject_id         = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(),        source='subject',         write_only=True, allow_null=True, required=False)
    grade_id           = serializers.PrimaryKeyRelatedField(queryset=Grade.objects.all(),           source='grade',           write_only=True, allow_null=True, required=False)
    education_level_id = serializers.PrimaryKeyRelatedField(queryset=EducationLevel.objects.all(), source='education_level', write_only=True, allow_null=True, required=False)
    topic_id           = serializers.PrimaryKeyRelatedField(queryset=Topic.objects.all(),           source='topic',           write_only=True, allow_null=True, required=False)

    class Meta:
        model = Exam
        fields = [
            'id', 'title',
            'subject', 'grade', 'curriculum', 'topic',
            'subject_id', 'grade_id', 'education_level_id', 'topic_id',
            'date', 'description', 'price', 'file', 'file_url', 'created_at',
            'is_purchased',
        ]
        extra_kwargs = {'file': {'write_only': True}}


# ========== News Serializers ==========
class NewsSerializer(BaseFileSerializer):
    category    = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=NewsCategory.objects.all(), source='category',
        write_only=True, allow_null=True, required=False)

    class Meta:
        model = News
        fields = ['id', 'headline', 'body', 'category', 'category_id', 'file', 'published_at']
        extra_kwargs = {'file': {'write_only': True}}


class NewsDetailSerializer(BaseFileDetailSerializer):
    category    = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=NewsCategory.objects.all(), source='category',
        write_only=True, allow_null=True, required=False)

    class Meta:
        model = News
        fields = ['id', 'headline', 'body', 'category', 'category_id', 'file', 'file_url', 'published_at']
        extra_kwargs = {'file': {'write_only': True}}


class NewsPostSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = NewsPost
        fields = [
            'id', 'title', 'body',
            'cover_image',
            'cover_image_url',
            'is_published', 'created_at',
        ]
        extra_kwargs = {
            'cover_image': {'required': False, 'write_only': True},
            'is_published': {'required': False},
        }

    def get_cover_image_url(self, obj):
        request = self.context.get('request')
        if obj.cover_image and request:
            return request.build_absolute_uri(obj.cover_image.url)
        return None


class NewsViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsView
        fields = ['id', 'post', 'viewed_at', 'dismissed_permanently']
        read_only_fields = ['viewed_at']