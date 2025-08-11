from rest_framework import serializers
from .models import Note, PastPaper, Exam, News


class BaseFileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            return request.build_absolute_uri(obj.file.url)
        return None


class NoteSerializer(BaseFileSerializer):
    class Meta:
        model = Note
        fields = '__all__'


class PastPaperSerializer(BaseFileSerializer):
    class Meta:
        model = PastPaper
        fields = '__all__'


class ExamSerializer(BaseFileSerializer):
    class Meta:
        model = Exam
        fields = '__all__'


class NewsSerializer(BaseFileSerializer):
    class Meta:
        model = News
        fields = '__all__'
