from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from main.recommender.personalize import refresh_user_recommendations

User = get_user_model()


class Command(BaseCommand):
    help = "Build recommendation cache for users."

    def add_arguments(self, parser):
        parser.add_argument(
            "--model-name",
            type=str,
            default="tfidf-v1",
            help="Recommendation algorithm / model name."
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=8,
            help="How many recommendations to store per user."
        )
        parser.add_argument(
            "--user-id",
            type=int,
            default=None,
            help="Optional: rebuild recommendations only for one user."
        )

    def handle(self, *args, **options):
        model_name = options["model_name"]
        limit = options["limit"]
        user_id = options["user_id"]

        if user_id is not None:
            users = User.objects.filter(id=user_id)
        else:
            users = User.objects.all()

        total = users.count()

        self.stdout.write(
            self.style.NOTICE(
                f"Building user recommendations: model={model_name}, limit={limit}, users={total}"
            )
        )

        built = 0

        for user in users:
            payload = refresh_user_recommendations(
                user,
                model_name=model_name,
                limit=limit,
            )
            built += 1
            self.stdout.write(
                f"User {user.id}: stored {len(payload)} recommendations"
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Recommendation cache rebuilt for {built} users."
            )
        )