from django.core.management.base import BaseCommand
from resources.seeds import seed_notes

class Command(BaseCommand):
    help = "Seed notes data from notesData.json"

    def handle(self, *args, **kwargs):
        seed_notes.run()
