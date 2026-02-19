# resources/serializers.py
from rest_framework import serializers
from .models import Note, PastPaper, Exam, News, Subject, Grade, EducationLevel, Topic, NewsCategory


class BaseFileSerializer(serializers.ModelSerializer):
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
    # READ fields - return string names to frontend
    subject    = serializers.CharField(source='subject.name',         read_only=True, allow_null=True)
    grade      = serializers.CharField(source='grade.name',           read_only=True, allow_null=True)
    curriculum = serializers.CharField(source='education_level.name', read_only=True, allow_null=True)
    topic      = serializers.CharField(source='topic.name',           read_only=True, allow_null=True)

    # WRITE fields - accept IDs when admin creates/updates
    subject_id         = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), 
        source='subject',
        write_only=True,
        allow_null=True, 
        required=False
    )
    grade_id           = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(), 
        source='grade',
        write_only=True,
        allow_null=True, 
        required=False
    )
    education_level_id = serializers.PrimaryKeyRelatedField(
        queryset=EducationLevel.objects.all(), 
        source='education_level',
        write_only=True,
        allow_null=True, 
        required=False
    )
    topic_id           = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(), 
        source='topic',
        write_only=True,
        allow_null=True, 
        required=False
    )

    class Meta:
        model = Note
        fields = [
            'id', 'title',
            # Read fields (strings)
            'subject', 'grade', 'curriculum', 'topic',
            # Write fields (IDs)
            'subject_id', 'grade_id', 'education_level_id', 'topic_id',
            # Other fields
            'content', 'price', 'file', 'file_url', 'created_at', 'updated_at'
        ]


class PastPaperSerializer(BaseFileSerializer):
    # READ fields
    subject    = serializers.CharField(source='subject.name',         read_only=True, allow_null=True)
    grade      = serializers.CharField(source='grade.name',           read_only=True, allow_null=True)
    curriculum = serializers.CharField(source='education_level.name', read_only=True, allow_null=True)
    topic      = serializers.CharField(source='topic.name',           read_only=True, allow_null=True)

    # WRITE fields
    subject_id         = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), 
        source='subject',
        write_only=True,
        allow_null=True, 
        required=False
    )
    grade_id           = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(), 
        source='grade',
        write_only=True,
        allow_null=True, 
        required=False
    )
    education_level_id = serializers.PrimaryKeyRelatedField(
        queryset=EducationLevel.objects.all(), 
        source='education_level',
        write_only=True,
        allow_null=True, 
        required=False
    )
    topic_id           = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(), 
        source='topic',
        write_only=True,
        allow_null=True, 
        required=False
    )

    class Meta:
        model = PastPaper
        fields = [
            'id', 'title',
            'subject', 'grade', 'curriculum', 'topic',
            'subject_id', 'grade_id', 'education_level_id', 'topic_id',
            'year', 'price', 'file', 'file_url', 'created_at'
        ]


class ExamSerializer(BaseFileSerializer):
    # READ fields
    subject    = serializers.CharField(source='subject.name',         read_only=True, allow_null=True)
    grade      = serializers.CharField(source='grade.name',           read_only=True, allow_null=True)
    curriculum = serializers.CharField(source='education_level.name', read_only=True, allow_null=True)
    topic      = serializers.CharField(source='topic.name',           read_only=True, allow_null=True)

    # WRITE fields
    subject_id         = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), 
        source='subject',
        write_only=True,
        allow_null=True, 
        required=False
    )
    grade_id           = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(), 
        source='grade',
        write_only=True,
        allow_null=True, 
        required=False
    )
    education_level_id = serializers.PrimaryKeyRelatedField(
        queryset=EducationLevel.objects.all(), 
        source='education_level',
        write_only=True,
        allow_null=True, 
        required=False
    )
    topic_id           = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(), 
        source='topic',
        write_only=True,
        allow_null=True, 
        required=False
    )

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
        queryset=NewsCategory.objects.all(), 
        source='category',
        write_only=True,
        allow_null=True, 
        required=False
    )

    class Meta:
        model = News
        fields = [
            'id', 'headline', 'body',
            'category', 'category_id',
            'file', 'file_url', 'published_at'
        ]