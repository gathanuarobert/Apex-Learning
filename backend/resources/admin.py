from django.contrib import admin
from .models import Subject, Grade, Note, PastPaper, Exam, News

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

admin.site.register(Subject)
admin.site.register(Grade)
admin.site.register(Note, NoteAdmin)
admin.site.register(PastPaper, PastPaperAdmin)
admin.site.register(Exam, ExamAdmin)
admin.site.register(News, NewsAdmin)
