import os
import json
from datetime import date

from django.conf import settings
from resources.models import Subject, Grade, EducationLevel, Exam

def run():
    # Load examsData.json
    file_path = os.path.join(settings.BASE_DIR, "resources", "seeds", "examsData.json")
    with open(file_path, "r") as f:
        exams_data = json.load(f)

    # Clear old exam data
    Exam.objects.all().delete()
    print("🗑️ Old Exam data cleared.")

    for curriculum, levels in exams_data.items():
        edu_level, _ = EducationLevel.objects.get_or_create(name=curriculum)

        if curriculum in ["CBC", "8-4-4"]:
            # Loop grades
            for grade_name, grade_data in levels.items():
                grade, _ = Grade.objects.get_or_create(name=grade_name)

                # Loop subjects
                subjects = grade_data.get("subjects", {})
                for subject_name, subject_data in subjects.items():
                    subject, _ = Subject.objects.get_or_create(name=subject_name)

                    # Loop exams list
                    for exam_title in subject_data.get("exams", []):
                        Exam.objects.create(
                            title=exam_title,
                            subject=subject,
                            grade=grade,
                            education_level=edu_level,
                            date=date(2024, 1, 1),  # default date
                            description="",
                        )

        elif curriculum == "University":
            # Loop courses
            for course_name, exam_list in levels.items():
                grade, _ = Grade.objects.get_or_create(name=course_name)
                subject, _ = Subject.objects.get_or_create(name=course_name)

                for exam_title in exam_list:
                    Exam.objects.create(
                        title=exam_title,
                        subject=subject,
                        grade=grade,
                        education_level=edu_level,
                        date=date(2024, 1, 1),  # default date
                        description="",
                    )

    print("✅ Exams seeded successfully!")
