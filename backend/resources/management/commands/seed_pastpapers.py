from django.core.management.base import BaseCommand
from resources.seeds import seed_pastpapers

class Command(BaseCommand):
    help = "Seed past papers data"

    def handle(self, *args, **kwargs):
        seed_pastpapers.run()
