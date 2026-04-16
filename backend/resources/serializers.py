# resources/serializers.py
from rest_framework import serializers
from .models import Note, PastPaper, Exam, News, Subject, Grade, EducationLevel, Topic, NewsCategory, NewsPost, NewsView
import os


# ========== Reusable File Validator ==========
ALLOWED_EXTENSIONS = [
    # Documents
    '.pdf', '.doc', '.docx', '.ppt', '.pptx',
    # Images
    '.jpg', '.jpeg', '.png',
    '.xlsx', '.xls', '.csv',
]

MAX_FILE_SIZE_MB = 50  # 50MB max per file

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
    """Used for list views — no file_url exposed."""

    def validate_file(self, value):
        return validate_file(value)


class BaseFileDetailSerializer(BaseFileSerializer):
    """Used for retrieve/download views — exposes file_url."""
    file_url = serializers.SerializerMethodField()

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            return request.build_absolute_uri(obj.file.url)
        return None

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


# ========== Resource Serializers ==========
class NoteSerializer(BaseFileSerializer):
    subject    = serializers.CharField(source='subject.name',         read_only=True, allow_null=True)
    grade      = serializers.CharField(source='grade.name',           read_only=True, allow_null=True)
    curriculum = serializers.CharField(source='education_level.name', read_only=True, allow_null=True)
    topic      = serializers.CharField(source='topic.name',           read_only=True, allow_null=True)

    subject_id         = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), source='subject',
        write_only=True, allow_null=True, required=False)
    grade_id           = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(), source='grade',
        write_only=True, allow_null=True, required=False)
    education_level_id = serializers.PrimaryKeyRelatedField(
        queryset=EducationLevel.objects.all(), source='education_level',
        write_only=True, allow_null=True, required=False)
    topic_id           = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(), source='topic',
        write_only=True, allow_null=True, required=False)

    class Meta:
        model = Note
        fields = [
            'id', 'title',
            'subject', 'grade', 'curriculum', 'topic',
            'subject_id', 'grade_id', 'education_level_id', 'topic_id',
            'content', 'price', 'file', 'created_at', 'updated_at'
        ]


class NoteDetailSerializer(BaseFileDetailSerializer):
    subject    = serializers.CharField(source='subject.name',         read_only=True, allow_null=True)
    grade      = serializers.CharField(source='grade.name',           read_only=True, allow_null=True)
    curriculum = serializers.CharField(source='education_level.name', read_only=True, allow_null=True)
    topic      = serializers.CharField(source='topic.name',           read_only=True, allow_null=True)

    subject_id         = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), source='subject',
        write_only=True, allow_null=True, required=False)
    grade_id           = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(), source='grade',
        write_only=True, allow_null=True, required=False)
    education_level_id = serializers.PrimaryKeyRelatedField(
        queryset=EducationLevel.objects.all(), source='education_level',
        write_only=True, allow_null=True, required=False)
    topic_id           = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(), source='topic',
        write_only=True, allow_null=True, required=False)

    class Meta:
        model = Note
        fields = [
            'id', 'title',
            'subject', 'grade', 'curriculum', 'topic',
            'subject_id', 'grade_id', 'education_level_id', 'topic_id',
            'content', 'price', 'file', 'file_url', 'created_at', 'updated_at'
        ]


class PastPaperSerializer(BaseFileSerializer):
    subject    = serializers.CharField(source='subject.name',         read_only=True, allow_null=True)
    grade      = serializers.CharField(source='grade.name',           read_only=True, allow_null=True)
    curriculum = serializers.CharField(source='education_level.name', read_only=True, allow_null=True)
    topic      = serializers.CharField(source='topic.name',           read_only=True, allow_null=True)

    subject_id         = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), source='subject',
        write_only=True, allow_null=True, required=False)
    grade_id           = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(), source='grade',
        write_only=True, allow_null=True, required=False)
    education_level_id = serializers.PrimaryKeyRelatedField(
        queryset=EducationLevel.objects.all(), source='education_level',
        write_only=True, allow_null=True, required=False)
    topic_id           = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(), source='topic',
        write_only=True, allow_null=True, required=False)

    class Meta:
        model = PastPaper
        fields = [
            'id', 'title',
            'subject', 'grade', 'curriculum', 'topic',
            'subject_id', 'grade_id', 'education_level_id', 'topic_id',
            'year', 'price', 'file', 'created_at'
        ]


class PastPaperDetailSerializer(BaseFileDetailSerializer):
    subject    = serializers.CharField(source='subject.name',         read_only=True, allow_null=True)
    grade      = serializers.CharField(source='grade.name',           read_only=True, allow_null=True)
    curriculum = serializers.CharField(source='education_level.name', read_only=True, allow_null=True)
    topic      = serializers.CharField(source='topic.name',           read_only=True, allow_null=True)

    subject_id         = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), source='subject',
        write_only=True, allow_null=True, required=False)
    grade_id           = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(), source='grade',
        write_only=True, allow_null=True, required=False)
    education_level_id = serializers.PrimaryKeyRelatedField(
        queryset=EducationLevel.objects.all(), source='education_level',
        write_only=True, allow_null=True, required=False)
    topic_id           = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(), source='topic',
        write_only=True, allow_null=True, required=False)

    class Meta:
        model = PastPaper
        fields = [
            'id', 'title',
            'subject', 'grade', 'curriculum', 'topic',
            'subject_id', 'grade_id', 'education_level_id', 'topic_id',
            'year', 'price', 'file', 'file_url', 'created_at'
        ]        


class ExamSerializer(BaseFileSerializer):
    subject    = serializers.CharField(source='subject.name',         read_only=True, allow_null=True)
    grade      = serializers.CharField(source='grade.name',           read_only=True, allow_null=True)
    curriculum = serializers.CharField(source='education_level.name', read_only=True, allow_null=True)
    topic      = serializers.CharField(source='topic.name',           read_only=True, allow_null=True)

    subject_id         = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), source='subject',
        write_only=True, allow_null=True, required=False)
    grade_id           = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(), source='grade',
        write_only=True, allow_null=True, required=False)
    education_level_id = serializers.PrimaryKeyRelatedField(
        queryset=EducationLevel.objects.all(), source='education_level',
        write_only=True, allow_null=True, required=False)
    topic_id           = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(), source='topic',
        write_only=True, allow_null=True, required=False)

    class Meta:
        model = Exam
        fields = [
            'id', 'title',
            'subject', 'grade', 'curriculum', 'topic',
            'subject_id', 'grade_id', 'education_level_id', 'topic_id',
            'date', 'description', 'price', 'file', 'created_at'
        ]


class ExamDetailSerializer(BaseFileDetailSerializer):
    subject    = serializers.CharField(source='subject.name',         read_only=True, allow_null=True)
    grade      = serializers.CharField(source='grade.name',           read_only=True, allow_null=True)
    curriculum = serializers.CharField(source='education_level.name', read_only=True, allow_null=True)
    topic      = serializers.CharField(source='topic.name',           read_only=True, allow_null=True)

    subject_id         = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), source='subject',
        write_only=True, allow_null=True, required=False)
    grade_id           = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(), source='grade',
        write_only=True, allow_null=True, required=False)
    education_level_id = serializers.PrimaryKeyRelatedField(
        queryset=EducationLevel.objects.all(), source='education_level',
        write_only=True, allow_null=True, required=False)
    topic_id           = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(), source='topic',
        write_only=True, allow_null=True, required=False)

    class Meta:
        model = Exam
        fields = [
            'id', 'title',
            'subject', 'grade', 'curriculum', 'topic',
            'subject_id', 'grade_id', 'education_level_id', 'topic_id',
            'date', 'description', 'price', 'file', 'file_url', 'created_at'
        ]


class NewsSerializer(BaseFileSerializer):
    category    = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=NewsCategory.objects.all(), source='category',
        write_only=True, allow_null=True, required=False)

    class Meta:
        model = News
        fields = [
            'id', 'headline', 'body',
            'category', 'category_id',
            'file', 'published_at'
        ]


class NewsDetailSerializer(BaseFileDetailSerializer):
    category    = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=NewsCategory.objects.all(), source='category',
        write_only=True, allow_null=True, required=False)

    class Meta:
        model = News
        fields = [
            'id', 'headline', 'body',
            'category', 'category_id',
            'file', 'file_url', 'published_at'
        ]        


class NewsPostSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = NewsPost
        fields = [
            'id', 'title', 'body',
            'cover_image',        # write field — accepts uploaded file
            'cover_image_url',    # read field — returns full URL
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