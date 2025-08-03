from django.core.management.base import BaseCommand
from wikidata import tasks


class Command(BaseCommand):
    help = """Trigger wikidata query tasks to update the database \
    with the latest data from Wikidata."""

    def handle(self, *args, **options):
        self.stdout.write("Starting the upgrade of Wikidata accomplices...\n")
        tasks.upgrade_accomplices()
