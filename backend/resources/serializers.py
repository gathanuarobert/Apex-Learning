from rest_framework import serializers
from .models import Note, PastPaper, Exam, News, Subject, Grade, EducationLevel, Topic, NewsCategory


class BaseFileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            return request.build_absolute_uri(obj.file.url)
        return None


class NoteSerializer(BaseFileSerializer):
    # Make foreign keys optional - they can be null
    subject = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), 
        allow_null=True, 
        required=False
    )
    grade = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(), 
        allow_null=True, 
        required=False
    )
    education_level = serializers.PrimaryKeyRelatedField(
        queryset=EducationLevel.objects.all(), 
        allow_null=True, 
        required=False
    )
    topic = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(), 
        allow_null=True, 
        required=False
    )

    class Meta:
        model = Note
        fields = '__all__'


class PastPaperSerializer(BaseFileSerializer):
    subject = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), 
        allow_null=True, 
        required=False
    )
    grade = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(), 
        allow_null=True, 
        required=False
    )
    education_level = serializers.PrimaryKeyRelatedField(
        queryset=EducationLevel.objects.all(), 
        allow_null=True, 
        required=False
    )
    topic = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(), 
        allow_null=True, 
        required=False
    )

    class Meta:
        model = PastPaper
        fields = '__all__'


class ExamSerializer(BaseFileSerializer):
    subject = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), 
        allow_null=True, 
        required=False
    )
    grade = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(), 
        allow_null=True, 
        required=False
    )
    education_level = serializers.PrimaryKeyRelatedField(
        queryset=EducationLevel.objects.all(), 
        allow_null=True, 
        required=False
    )
    topic = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(), 
        allow_null=True, 
        required=False
    )

    class Meta:
        model = Exam
        fields = '__all__'


class NewsSerializer(BaseFileSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset=NewsCategory.objects.all(), 
        allow_null=True, 
        required=False
    )

    class Meta:
        model = News
        fields = '__all__'