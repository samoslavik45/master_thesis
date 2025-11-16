# main/management/commands/build_reco_index.py
from django.core.management.base import BaseCommand
from main.recommender.index import rebuild_tfidf_index

class Command(BaseCommand):
    help = "Rebuild TF-IDF article embeddings for all articles."

    def handle(self, *args, **options):
        count = rebuild_tfidf_index()
        self.stdout.write(self.style.SUCCESS(
            f"TF-IDF index rebuilt for {count} articles."
        ))
