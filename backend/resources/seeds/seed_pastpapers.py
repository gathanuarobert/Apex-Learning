import os
import json
import re
from django.conf import settings
from resources.models import PastPaper, Subject, Grade, EducationLevel, Topic

BASE_DIR = settings.BASE_DIR

def run():
    file_path = os.path.join(BASE_DIR, "resources", "seeds", "pastpapers.json")

    with open(file_path, "r") as f:
        data = json.load(f)

    # optional: clear existing
    # PastPaper.objects.all().delete()

    for system, grades in data.items():
        education_level, _ = EducationLevel.objects.get_or_create(name=system)

        for grade_name, grade_content in grades.items():
            if system == "University":
                # University level can be either:
                # 1) grade_name acts as the subject and grade_content is a list of exams (common in your JSON)
                # 2) or grade_content is a dict mapping subject_name -> exams (handle both)
                if isinstance(grade_content, list):
                    # Case 1: grade_name is the subject (e.g. "Computer Science": [ ... ])
                    subject, _ = Subject.objects.get_or_create(name=grade_name)
                    for exam_title in grade_content:
                        PastPaper.objects.get_or_create(
                            title=exam_title,
                            subject=subject,
                            grade=None,
                            education_level=education_level,
                            topic=None,
                            year=_extract_year(exam_title),
                        )
                elif isinstance(grade_content, dict):
                    # Case 2: unexpected shape but support it (subject_name -> [exams])
                    for subject_name, exams in grade_content.items():
                        subject, _ = Subject.objects.get_or_create(name=subject_name)
                        for exam_title in exams:
                            PastPaper.objects.get_or_create(
                                title=exam_title,
                                subject=subject,
                                grade=None,
                                education_level=education_level,
                                topic=None,
                                year=_extract_year(exam_title),
                            )
                else:
                    # Fallback: try to iterate, otherwise skip
                    try:
                        for subject_name, exams in dict(grade_content).items():
                            subject, _ = Subject.objects.get_or_create(name=subject_name)
                            for exam_title in exams:
                                PastPaper.objects.get_or_create(
                                    title=exam_title,
                                    subject=subject,
                                    grade=None,
                                    education_level=education_level,
                                    topic=None,
                                    year=_extract_year(exam_title),
                                )
                    except Exception:
                        continue
            else:
                # For CBC / 8-4-4 etc.
                grade, _ = Grade.objects.get_or_create(name=grade_name)

                # grade_content expected to be a dict with a "subjects" key
                subjects = {}
                if isinstance(grade_content, dict):
                    subjects = grade_content.get("subjects", {})
                else:
                    # unexpected shape: skip this grade
                    continue

                for subject_name, subject_data in subjects.items():
                    subject, _ = Subject.objects.get_or_create(name=subject_name)
                    topic = None
                    if isinstance(subject_data, dict) and "topic" in subject_data:  # optional support
                        topic, _ = Topic.objects.get_or_create(name=subject_data["topic"])

                    exams_list = []
                    if isinstance(subject_data, dict):
                        exams_list = subject_data.get("exams", [])
                    elif isinstance(subject_data, list):
                        # support the case where subject_data is directly a list of exams
                        exams_list = subject_data

                    for exam_title in exams_list:
                        PastPaper.objects.get_or_create(
                            title=exam_title,
                            subject=subject,
                            grade=grade,
                            education_level=education_level,
                            topic=topic,
                            year=_extract_year(exam_title),
                        )

    print("✅ Past papers seeded successfully!")


def _extract_year(title: str) -> int:
    """Try to extract a year from exam title (defaults to 2023)."""
    match = re.search(r"(19|20)\d{2}", title)
    if match:
        return int(match.group(0))
    return 2023
