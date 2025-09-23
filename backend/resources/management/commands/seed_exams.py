from django.core.management.base import BaseCommand
from resources.seeds import seed_exams

class Command(BaseCommand):
    help = "Seed exam data from examsData.json"

    def handle(self, *args, **options):
        seed_exams.run()
