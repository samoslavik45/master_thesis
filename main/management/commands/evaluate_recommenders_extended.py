import csv
import math
import random
from pathlib import Path

import numpy as np
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from main.models import ArticleEmbedding, ArticleLike, GroupArticleLike, UserInteraction
from main.recommender.similarity import cosine_similarity


User = get_user_model()


class Command(BaseCommand):
    help = (
        "Offline evaluation of the extended personalized recommendation scenario "
        "using user likes, group likes, positive feedback, and dismiss feedback."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--usernames",
            nargs="*",
            default=[],
            help="List of usernames to evaluate. If omitted, all users are considered.",
        )
        parser.add_argument(
            "--models",
            nargs="*",
            default=["tfidf-v1"],
            help="Embedding model names to evaluate, e.g. tfidf-v1 or sbert-v1.",
        )
        parser.add_argument(
            "--ks",
            nargs="*",
            type=int,
            default=[5, 10],
            help="Cutoff values K for Precision@K, Recall@K, MAP@K, nDCG@K.",
        )
        parser.add_argument(
            "--base-like-count",
            type=int,
            default=20,
            help=(
                "Number of original manual user likes to treat as the base profile. "
                "These are inferred as the earliest likes by created_at."
            ),
        )
        parser.add_argument(
            "--train-size",
            type=int,
            default=16,
            help="Number of original user likes used for the train profile.",
        )
        parser.add_argument(
            "--test-size",
            type=int,
            default=4,
            help="Number of original user likes hidden for evaluation.",
        )
        parser.add_argument(
            "--min-group-likes",
            type=int,
            default=0,
            help="Optional minimum number of group likes required for a user.",
        )
        parser.add_argument(
            "--min-positive-feedback",
            type=int,
            default=0,
            help="Optional minimum number of positive feedback interactions required for a user.",
        )
        parser.add_argument(
            "--min-dismiss-feedback",
            type=int,
            default=0,
            help="Optional minimum number of dismiss feedback interactions required for a user.",
        )
        parser.add_argument(
            "--seed",
            type=int,
            default=42,
            help="Random seed for reproducible per-user train/test splits.",
        )
        parser.add_argument(
            "--diagnostic-top",
            type=int,
            default=10,
            help="How many top recommendation ids to print and save for diagnostics.",
        )
        parser.add_argument(
            "--output-dir",
            default="evaluation_outputs_extended",
            help="Directory where CSV outputs will be saved.",
        )

    def handle(self, *args, **options):
        usernames = options["usernames"]
        models = options["models"]
        ks = sorted(set(options["ks"]))
        base_like_count = options["base_like_count"]
        train_size = options["train_size"]
        test_size = options["test_size"]
        min_group_likes = options["min_group_likes"]
        min_positive_feedback = options["min_positive_feedback"]
        min_dismiss_feedback = options["min_dismiss_feedback"]
        seed = options["seed"]
        diagnostic_top = options["diagnostic_top"]
        output_dir = Path(options["output_dir"])
        output_dir.mkdir(parents=True, exist_ok=True)

        if train_size + test_size > base_like_count:
            raise CommandError("train_size + test_size must be <= base_like_count")

        users = self._load_users(usernames)
        embeddings_by_model = self._load_embeddings(models)

        eligible_users = []
        user_state = {}

        for user in users:
            state = self._collect_user_state(user, base_like_count=base_like_count)

            if len(state["base_like_ids"]) < base_like_count:
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipping {user.username}: has only {len(state['base_like_ids'])} base likes, "
                        f"needs at least {base_like_count}."
                    )
                )
                continue

            if len(state["group_like_ids"]) < min_group_likes:
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipping {user.username}: has only {len(state['group_like_ids'])} group likes, "
                        f"needs at least {min_group_likes}."
                    )
                )
                continue

            if len(state["positive_feedback_ids"]) < min_positive_feedback:
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipping {user.username}: has only {len(state['positive_feedback_ids'])} positive feedback "
                        f"interactions, needs at least {min_positive_feedback}."
                    )
                )
                continue

            if len(state["dismiss_feedback_ids"]) < min_dismiss_feedback:
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipping {user.username}: has only {len(state['dismiss_feedback_ids'])} dismiss feedback "
                        f"interactions, needs at least {min_dismiss_feedback}."
                    )
                )
                continue

            train_ids, test_ids = self._split_likes(
                liked_ids=state["base_like_ids"],
                train_size=train_size,
                test_size=test_size,
                seed=seed + user.id,
            )

            state["train_ids"] = train_ids
            state["test_ids"] = test_ids

            eligible_users.append(user)
            user_state[user.id] = state

        if not eligible_users:
            raise CommandError("No eligible users found for evaluation.")

        self.stdout.write(self.style.SUCCESS(f"Eligible users: {len(eligible_users)}"))

        per_user_rows = []
        summary_rows = []
        split_rows = []

        for user in eligible_users:
            state = user_state[user.id]
            split_rows.append({
                "username": user.username,
                "base_like_ids": ",".join(map(str, state["base_like_ids"])),
                "train_article_ids": ",".join(map(str, state["train_ids"])),
                "test_article_ids": ",".join(map(str, state["test_ids"])),
                "group_like_ids": ",".join(map(str, sorted(state["group_like_ids"]))),
                "positive_feedback_ids": ",".join(map(str, sorted(state["positive_feedback_ids"]))),
                "dismiss_feedback_ids": ",".join(map(str, sorted(state["dismiss_feedback_ids"]))),
            })

            self.stdout.write("")
            self.stdout.write(self.style.HTTP_INFO(f"User: {user.username}"))
            self.stdout.write(f"  base_like_ids={state['base_like_ids']}")
            self.stdout.write(f"  train_ids={state['train_ids']}")
            self.stdout.write(f"  test_ids={state['test_ids']}")
            self.stdout.write(f"  group_like_ids={sorted(state['group_like_ids'])}")
            self.stdout.write(f"  positive_feedback_ids={sorted(state['positive_feedback_ids'])}")
            self.stdout.write(f"  dismiss_feedback_ids={sorted(state['dismiss_feedback_ids'])}")

            for model_name in models:
                emb_map = embeddings_by_model.get(model_name, {})
                profile, diagnostics = self._build_profile_from_state(
                    train_ids=state["train_ids"],
                    group_like_ids=state["group_like_ids"],
                    positive_feedback_ids=state["positive_feedback_ids"],
                    dismiss_feedback_ids=state["dismiss_feedback_ids"],
                    emb_map=emb_map,
                )

                if profile is None:
                    self.stdout.write(self.style.WARNING(f"  {model_name}: skipped, empty profile"))
                    continue

                ranking = self._rank_articles(
                    profile=profile,
                    emb_map=emb_map,
                    excluded_ids=set(state["train_ids"]) | set(state["positive_feedback_ids"]) | set(state["dismiss_feedback_ids"]),
                )

                row = {
                    "username": user.username,
                    "model": model_name,
                    "base_like_count": len(state["base_like_ids"]),
                    "train_count": len(state["train_ids"]),
                    "test_count": len(state["test_ids"]),
                    "group_like_count": len(state["group_like_ids"]),
                    "positive_feedback_count": len(state["positive_feedback_ids"]),
                    "dismiss_feedback_count": len(state["dismiss_feedback_ids"]),
                    "top_ids": ",".join(map(str, ranking[:diagnostic_top])),
                    "used_train_vectors": diagnostics["used_train_vectors"],
                    "used_group_vectors": diagnostics["used_group_vectors"],
                    "used_positive_vectors": diagnostics["used_positive_vectors"],
                    "used_dismiss_vectors": diagnostics["used_dismiss_vectors"],
                }

                self.stdout.write(f"  {model_name} top{diagnostic_top}={ranking[:diagnostic_top]}")

                for k in ks:
                    precision = precision_at_k(ranking, state["test_ids"], k)
                    recall = recall_at_k(ranking, state["test_ids"], k)
                    ap = average_precision_at_k(ranking, state["test_ids"], k)
                    ndcg = ndcg_at_k(ranking, state["test_ids"], k)
                    hits = hit_count_at_k(ranking, state["test_ids"], k)

                    row[f"hits@{k}"] = hits
                    row[f"precision@{k}"] = precision
                    row[f"recall@{k}"] = recall
                    row[f"map@{k}"] = ap
                    row[f"ndcg@{k}"] = ndcg

                per_user_rows.append(row)

        for model_name in models:
            model_rows = [r for r in per_user_rows if r["model"] == model_name]
            if not model_rows:
                continue

            summary = {
                "model": model_name,
                "users": len(model_rows),
            }
            for k in ks:
                for metric in ["precision", "recall", "map", "ndcg"]:
                    key = f"{metric}@{k}"
                    summary[key] = safe_mean([r[key] for r in model_rows])
            summary_rows.append(summary)

        per_user_csv = output_dir / "extended_recommender_eval_per_user.csv"
        summary_csv = output_dir / "extended_recommender_eval_summary.csv"
        split_csv = output_dir / "extended_recommender_eval_splits.csv"

        write_csv(per_user_csv, per_user_rows)
        write_csv(summary_csv, summary_rows)
        write_csv(split_csv, split_rows)

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=== SUMMARY ==="))
        for summary in summary_rows:
            self.stdout.write(format_summary_line(summary, ks))

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"Saved per-user results to: {per_user_csv}"))
        self.stdout.write(self.style.SUCCESS(f"Saved summary results to: {summary_csv}"))
        self.stdout.write(self.style.SUCCESS(f"Saved split overview to: {split_csv}"))

    def _load_users(self, usernames):
        qs = User.objects.all().order_by("username")
        if usernames:
            qs = qs.filter(username__in=usernames).order_by("username")
        return list(qs)

    def _load_embeddings(self, models):
        data = {}
        for model_name in models:
            emb_map = {}
            qs = ArticleEmbedding.objects.filter(model_name=model_name).only("article_id", "vector")
            for emb in qs:
                emb_map[emb.article_id] = np.array(emb.vector, dtype=float)
            if not emb_map:
                raise CommandError(f"No embeddings found for model '{model_name}'.")
            data[model_name] = emb_map
        return data

    def _collect_user_state(self, user, base_like_count):
        likes_qs = (
            ArticleLike.objects.filter(user=user)
            .order_by("created_at", "article_id")
            .values_list("article_id", flat=True)
        )
        ordered_like_ids = list(dict.fromkeys(likes_qs))
        base_like_ids = ordered_like_ids[:base_like_count]

        group_like_ids = set(
            GroupArticleLike.objects.filter(group__members=user)
            .values_list("article_id", flat=True)
        )
        positive_feedback_ids = set(
            UserInteraction.objects.filter(user=user, kind=2)
            .values_list("article_id", flat=True)
        )
        dismiss_feedback_ids = set(
            UserInteraction.objects.filter(user=user, kind=3)
            .values_list("article_id", flat=True)
        )

        return {
            "ordered_like_ids": ordered_like_ids,
            "base_like_ids": base_like_ids,
            "group_like_ids": group_like_ids,
            "positive_feedback_ids": positive_feedback_ids,
            "dismiss_feedback_ids": dismiss_feedback_ids,
        }

    def _split_likes(self, liked_ids, train_size, test_size, seed):
        rng = random.Random(seed)
        items = liked_ids[:]
        rng.shuffle(items)
        train_ids = sorted(items[:train_size])
        test_ids = sorted(items[train_size:train_size + test_size])
        return train_ids, test_ids

    def _build_profile_from_state(self, train_ids, group_like_ids, positive_feedback_ids, dismiss_feedback_ids, emb_map):
        weighted_vectors = []
        weights = []

        diagnostics = {
            "used_train_vectors": 0,
            "used_group_vectors": 0,
            "used_positive_vectors": 0,
            "used_dismiss_vectors": 0,
        }

        def add_articles(article_ids, weight, diagnostic_key):
            for article_id in article_ids:
                vec = emb_map.get(article_id)
                if vec is not None:
                    weighted_vectors.append(vec)
                    weights.append(weight)
                    diagnostics[diagnostic_key] += 1

        add_articles(train_ids, 1.0, "used_train_vectors")
        add_articles(group_like_ids, 0.7, "used_group_vectors")
        add_articles(positive_feedback_ids, 1.2, "used_positive_vectors")
        add_articles(dismiss_feedback_ids, -1.0, "used_dismiss_vectors")

        if not weighted_vectors:
            return None, diagnostics

        matrix = np.vstack(weighted_vectors)
        weights_array = np.array(weights, dtype=float)

        denominator = np.sum(np.abs(weights_array))
        if denominator == 0:
            return None, diagnostics

        profile = np.sum(matrix * weights_array[:, None], axis=0) / denominator
        return profile, diagnostics

    def _rank_articles(self, profile, emb_map, excluded_ids):
        scored = []
        for article_id, vec in emb_map.items():
            if article_id in excluded_ids:
                continue
            scored.append((article_id, cosine_similarity(profile, vec)))
        scored.sort(key=lambda x: x[1], reverse=True)
        return [article_id for article_id, _score in scored]


def hit_count_at_k(ranking, relevant_ids, k):
    relevant = set(relevant_ids)
    return sum(1 for article_id in ranking[:k] if article_id in relevant)


def precision_at_k(ranking, relevant_ids, k):
    if k <= 0:
        return 0.0
    return hit_count_at_k(ranking, relevant_ids, k) / float(k)


def recall_at_k(ranking, relevant_ids, k):
    relevant = set(relevant_ids)
    if not relevant:
        return 0.0
    return hit_count_at_k(ranking, relevant_ids, k) / float(len(relevant))


def average_precision_at_k(ranking, relevant_ids, k):
    relevant = set(relevant_ids)
    if not relevant:
        return 0.0

    hits = 0
    score = 0.0
    for idx, article_id in enumerate(ranking[:k], start=1):
        if article_id in relevant:
            hits += 1
            score += hits / float(idx)
    return score / float(len(relevant))


def ndcg_at_k(ranking, relevant_ids, k):
    relevant = set(relevant_ids)
    if not relevant:
        return 0.0

    dcg = 0.0
    for idx, article_id in enumerate(ranking[:k], start=1):
        if article_id in relevant:
            dcg += 1.0 / math.log2(idx + 1)

    ideal_hits = min(len(relevant), k)
    idcg = sum(1.0 / math.log2(idx + 1) for idx in range(1, ideal_hits + 1))
    return dcg / idcg if idcg > 0 else 0.0


def safe_mean(values):
    values = list(values)
    return sum(values) / len(values) if values else 0.0


def write_csv(path, rows):
    rows = list(rows)
    if not rows:
        return
    fieldnames = list(rows[0].keys())
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def format_summary_line(summary, ks):
    parts = [f"{summary['model']} (users={summary['users']})"]
    for k in ks:
        parts.append(
            " | ".join([
                f"P@{k}={summary[f'precision@{k}']:.4f}",
                f"R@{k}={summary[f'recall@{k}']:.4f}",
                f"MAP@{k}={summary[f'map@{k}']:.4f}",
                f"nDCG@{k}={summary[f'ndcg@{k}']:.4f}",
            ])
        )
    return " || ".join(parts)
