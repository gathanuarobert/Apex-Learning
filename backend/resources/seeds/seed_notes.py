import json
import os
from resources.models import Note, Subject, Grade, EducationLevel, Topic
from django.conf import settings

def run():
    file_path = os.path.join(settings.BASE_DIR, "resources", "seeds", "notesData.json")

    with open(file_path, "r", encoding="utf-8") as f:
        notes_data = json.load(f)

    for education_level, grades in notes_data.items():
        edu_level_obj, _ = EducationLevel.objects.get_or_create(name=education_level)

        for grade_name, grade_content in grades.items():
            grade_obj, _ = Grade.objects.get_or_create(name=grade_name)

            # Case 1: grade_content is a dict with "subjects"
            if isinstance(grade_content, dict):
                subjects = grade_content.get("subjects", {})
                for subject_name, topics in subjects.items():
                    subject_obj, _ = Subject.objects.get_or_create(name=subject_name)

                    for topic_name in topics:
                        topic_obj, _ = Topic.objects.get_or_create(name=topic_name)

                        Note.objects.update_or_create(
                            title=f"{topic_name} Notes",
                            subject=subject_obj,
                            grade=grade_obj,
                            education_level=edu_level_obj,
                            topic=topic_obj,
                            defaults={
                                "content": f"Content for {topic_name} in {subject_name}, {grade_name} - {education_level}",
                                "price": 0.00,
                            },
                        )

            # Case 2: grade_content is just a list of subjects
            elif isinstance(grade_content, list):
                for subject_name in grade_content:
                    subject_obj, _ = Subject.objects.get_or_create(name=subject_name)

                    Note.objects.update_or_create(
                        title=f"{subject_name} Notes",
                        subject=subject_obj,
                        grade=grade_obj,
                        education_level=edu_level_obj,
                        defaults={
                            "content": f"Content for {subject_name} in {grade_name} - {education_level}",
                            "price": 0.00,
                        },
                    )

    print("✅ Notes seeded successfully!")
