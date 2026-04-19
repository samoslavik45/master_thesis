import csv
import math
import random
from collections import defaultdict
from pathlib import Path

import numpy as np
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from main.models import ArticleEmbedding, ArticleLike
from main.recommender.similarity import cosine_similarity


User = get_user_model()


class Command(BaseCommand):
    help = (
        "Offline evaluation of personalized recommendations for tfidf-v1 and "
        "sbert-v1 using a fixed train/test split of user likes."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--usernames",
            nargs="*",
            default=[],
            help="Optional list of usernames to evaluate. If omitted, all eligible users are used.",
        )
        parser.add_argument(
            "--models",
            nargs="*",
            default=["tfidf-v1", "sbert-v1"],
            help="Embedding model names to evaluate.",
        )
        parser.add_argument(
            "--ks",
            nargs="*",
            type=int,
            default=[5, 10],
            help="Cutoff values K for Precision@K, Recall@K, MAP@K, nDCG@K.",
        )
        parser.add_argument(
            "--min-likes",
            type=int,
            default=15,
            help="Minimum number of likes required for a user to be included.",
        )
        parser.add_argument(
            "--train-size",
            type=int,
            default=12,
            help="Number of liked articles used for building the profile.",
        )
        parser.add_argument(
            "--test-size",
            type=int,
            default=3,
            help="Number of liked articles hidden for evaluation.",
        )
        parser.add_argument(
            "--seed",
            type=int,
            default=42,
            help="Random seed for reproducible per-user train/test splits.",
        )
        parser.add_argument(
            "--output-dir",
            default="evaluation_outputs",
            help="Directory where CSV outputs will be saved.",
        )

    def handle(self, *args, **options):
        usernames = options["usernames"]
        models = options["models"]
        ks = sorted(set(options["ks"]))
        min_likes = options["min_likes"]
        train_size = options["train_size"]
        test_size = options["test_size"]
        seed = options["seed"]
        output_dir = Path(options["output_dir"])
        output_dir.mkdir(parents=True, exist_ok=True)

        if train_size + test_size > min_likes:
            raise CommandError("train_size + test_size must be <= min_likes")

        users = self._load_users(usernames)
        embeddings_by_model = self._load_embeddings(models)

        eligible_users = []
        splits = {}
        for user in users:
            liked_ids = list(
                ArticleLike.objects.filter(user=user)
                .order_by("article_id")
                .values_list("article_id", flat=True)
            )
            liked_ids = list(dict.fromkeys(liked_ids))
            if len(liked_ids) < min_likes:
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipping {user.username}: has {len(liked_ids)} likes, needs at least {min_likes}."
                    )
                )
                continue

            train_ids, test_ids = self._split_likes(
                liked_ids=liked_ids,
                train_size=train_size,
                test_size=test_size,
                seed=seed + user.id,
            )
            eligible_users.append(user)
            splits[user.id] = {
                "train_ids": train_ids,
                "test_ids": test_ids,
                "all_liked_ids": liked_ids,
            }

        if not eligible_users:
            raise CommandError("No eligible users found for evaluation.")

        self.stdout.write(self.style.SUCCESS(f"Eligible users: {len(eligible_users)}"))

        per_user_rows = []
        summary_rows = []
        split_rows = []

        for user in eligible_users:
            split = splits[user.id]
            split_rows.append({
                "username": user.username,
                "train_article_ids": ",".join(map(str, split["train_ids"])),
                "test_article_ids": ",".join(map(str, split["test_ids"])),
            })

            self.stdout.write("")
            self.stdout.write(self.style.HTTP_INFO(f"User: {user.username}"))
            self.stdout.write(f"  train_ids={split['train_ids']}")
            self.stdout.write(f"  test_ids={split['test_ids']}")

            for model_name in models:
                emb_map = embeddings_by_model.get(model_name, {})
                ranking = self._rank_articles(
                    train_ids=split["train_ids"],
                    emb_map=emb_map,
                )

                row = {
                    "username": user.username,
                    "model": model_name,
                    "train_count": len(split["train_ids"]),
                    "test_count": len(split["test_ids"]),
                    "top_10_ids": ",".join(map(str, ranking[:10])),
                }

                self.stdout.write(f"  {model_name} top10={ranking[:10]}")

                for k in ks:
                    precision = precision_at_k(ranking, split["test_ids"], k)
                    recall = recall_at_k(ranking, split["test_ids"], k)
                    ap = average_precision_at_k(ranking, split["test_ids"], k)
                    ndcg = ndcg_at_k(ranking, split["test_ids"], k)
                    hits = hit_count_at_k(ranking, split["test_ids"], k)

                    row[f"hits@{k}"] = hits
                    row[f"precision@{k}"] = precision
                    row[f"recall@{k}"] = recall
                    row[f"map@{k}"] = ap
                    row[f"ndcg@{k}"] = ndcg

                per_user_rows.append(row)

        for model_name in models:
            model_rows = [r for r in per_user_rows if r["model"] == model_name]
            summary = {
                "model": model_name,
                "users": len(model_rows),
            }
            for k in ks:
                for metric in ["precision", "recall", "map", "ndcg"]:
                    key = f"{metric}@{k}"
                    summary[key] = safe_mean([r[key] for r in model_rows])
            summary_rows.append(summary)

        per_user_csv = output_dir / "recommender_eval_per_user.csv"
        summary_csv = output_dir / "recommender_eval_summary.csv"
        split_csv = output_dir / "recommender_eval_splits.csv"

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

    def _split_likes(self, liked_ids, train_size, test_size, seed):
        rng = random.Random(seed)
        items = liked_ids[:]
        rng.shuffle(items)
        train_ids = sorted(items[:train_size])
        test_ids = sorted(items[train_size:train_size + test_size])
        return train_ids, test_ids

    def _rank_articles(self, train_ids, emb_map):
        train_vectors = [emb_map[article_id] for article_id in train_ids if article_id in emb_map]
        if not train_vectors:
            return []

        profile = np.mean(np.vstack(train_vectors), axis=0)
        excluded_ids = set(train_ids)
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
