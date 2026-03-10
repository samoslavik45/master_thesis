from django.core.management.base import BaseCommand
from main.recommender.index import rebuild_tfidf_index


class Command(BaseCommand):
    help = "Rebuild TF-IDF recommendation index for all articles."

    def add_arguments(self, parser):
        parser.add_argument(
            "--max-features",
            type=int,
            default=5000,
            help="Maximum number of TF-IDF features."
        )
        parser.add_argument(
            "--model-name",
            type=str,
            default="tfidf-v1",
            help="Model name stored in ArticleEmbedding."
        )

    def handle(self, *args, **options):
        max_features = options["max_features"]
        model_name = options["model_name"]

        self.stdout.write(
            self.style.NOTICE(
                f"Building recommendation index: model={model_name}, max_features={max_features}"
            )
        )

        count = rebuild_tfidf_index(
            max_features=max_features,
            model_name=model_name,
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Rebuilt TF-IDF embeddings for {count} articles."
            )
        )