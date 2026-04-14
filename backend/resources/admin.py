from django.contrib import admin
from .models import (Subject, Grade, Note, PastPaper, Exam, News, EducationLevel, Topic, NewsCategory,
                   NewsPost, NewsView)
                     

class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'subject', 'grade', 'created_at')
    search_fields = ('title', 'subject__name', 'grade__name')
    list_filter = ('subject', 'grade')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')

class PastPaperAdmin(admin.ModelAdmin):
    list_display = ('title', 'subject', 'grade', 'year', 'created_at')
    search_fields = ('title', 'subject__name', 'grade__name')
    list_filter = ('subject', 'grade', 'year')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)

class ExamAdmin(admin.ModelAdmin):
    list_display = ('title', 'subject', 'grade', 'date', 'created_at')
    search_fields = ('title', 'subject__name', 'grade__name')
    list_filter = ('subject', 'grade', 'date')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)

class NewsAdmin(admin.ModelAdmin):
    list_display = ('headline', 'published_at')
    search_fields = ('headline',)
    ordering = ('-published_at',)
    readonly_fields = ('published_at',)  

@admin.register(NewsPost)
class NewsPostAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_published', 'created_at']
    list_editable = ['is_published']
    search_fields = ['title']

@admin.register(NewsView)
class NewsViewAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'viewed_at', 'dismissed_permanently']
    list_filter = ['dismissed_permanently']          

admin.site.register(Subject)
admin.site.register(Grade)
admin.site.register(NewsCategory)
admin.site.register(EducationLevel)
admin.site.register(Topic)
admin.site.register(Note, NoteAdmin)
admin.site.register(PastPaper, PastPaperAdmin)
admin.site.register(Exam, ExamAdmin)
admin.site.register(News, NewsAdmin)
