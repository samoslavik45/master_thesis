# main/recommender/personalize.py
import numpy as np

from main.models import (
    Article,
    ArticleEmbedding,
    ArticleLike,
    GroupArticleLike,
    UserInteraction,
    RecommendationCache,
)
from main.recommender.similarity import cosine_similarity


def get_user_seed_articles(user):
    """
    Vráti základné množiny článkov, z ktorých sa bude skladať profil používateľa.
    """
    user_liked_ids = set(
        ArticleLike.objects.filter(user=user).values_list("article_id", flat=True)
    )

    group_liked_ids = set(
        GroupArticleLike.objects.filter(group__members=user).values_list("article_id", flat=True)
    )

    positive_feedback_ids = set(
        UserInteraction.objects.filter(user=user, kind=2).values_list("article_id", flat=True)
    )

    dismiss_feedback_ids = set(
        UserInteraction.objects.filter(user=user, kind=3).values_list("article_id", flat=True)
    )

    return {
        "user_liked_ids": user_liked_ids,
        "group_liked_ids": group_liked_ids,
        "positive_feedback_ids": positive_feedback_ids,
        "dismiss_feedback_ids": dismiss_feedback_ids,
    }


def _get_embedding_map(model_name="tfidf-v1"):
    """
    Načíta všetky embeddingy pre daný model do dictu:
    {article_id: np.array(vector)}
    """
    embeddings = ArticleEmbedding.objects.filter(model_name=model_name)

    emb_map = {}
    for emb in embeddings:
        emb_map[emb.article_id] = np.array(emb.vector, dtype=float)

    return emb_map


def build_user_profile(user, model_name="tfidf-v1"):
    """
    Vytvorí profilový vektor používateľa ako vážený priemer embeddingov.

    Váhy:
    - user liked article = +1.0
    - group liked article = +0.7
    - positive feedback = +1.2
    - dismiss feedback = -1.0

    Vráti numpy vector alebo None, ak profil nie je možné zostaviť.
    """
    seed = get_user_seed_articles(user)
    emb_map = _get_embedding_map(model_name=model_name)

    weighted_vectors = []
    weights = []

    def add_articles(article_ids, weight):
        for article_id in article_ids:
            vec = emb_map.get(article_id)
            if vec is not None:
                weighted_vectors.append(vec)
                weights.append(weight)

    add_articles(seed["user_liked_ids"], 1.0)
    add_articles(seed["group_liked_ids"], 0.7)
    add_articles(seed["positive_feedback_ids"], 1.2)
    add_articles(seed["dismiss_feedback_ids"], -1.0)

    if not weighted_vectors:
        return None

    matrix = np.vstack(weighted_vectors)
    weights_array = np.array(weights, dtype=float)

    denominator = np.sum(np.abs(weights_array))
    if denominator == 0:
        return None

    profile = np.sum(matrix * weights_array[:, None], axis=0) / denominator
    return profile


def score_articles_for_user(user, model_name="tfidf-v1", limit=8):
    """
    Spočíta similarity skóre medzi profilovým vektorom používateľa
    a kandidátnymi článkami.

    Vracia list:
    [
        {"id": article_id, "score": similarity},
        ...
    ]
    """
    profile = build_user_profile(user, model_name=model_name)
    if profile is None:
        return []

    seed = get_user_seed_articles(user)
    emb_map = _get_embedding_map(model_name=model_name)

    excluded_ids = set()
    excluded_ids.update(seed["user_liked_ids"])
    excluded_ids.update(seed["dismiss_feedback_ids"])

    scored = []

    for article_id, vec in emb_map.items():
        if article_id in excluded_ids:
            continue

        sim = cosine_similarity(profile, vec)
        scored.append({"id": article_id, "score": float(sim)})

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]


def refresh_user_recommendations(user, model_name="tfidf-v1", limit=8):
    """
    Prepočíta odporúčania pre používateľa a uloží ich do RecommendationCache.
    """
    payload = score_articles_for_user(user, model_name=model_name, limit=limit)

    RecommendationCache.objects.create(
        user=user,
        algo=model_name,
        payload=payload,
    )

    return payload

def build_user_profile_debug(user, model_name="tfidf-v1", limit=8):
    seed = get_user_seed_articles(user)
    emb_map = _get_embedding_map(model_name=model_name)

    weighted_vectors = []
    weights_info = []

    def add_articles(article_ids, weight, source_name):
        for article_id in article_ids:
            vec = emb_map.get(article_id)
            if vec is not None:
                weighted_vectors.append((article_id, vec, weight, source_name))
                weights_info.append({
                    "article_id": article_id,
                    "weight": weight,
                    "source": source_name,
                })

    add_articles(seed["user_liked_ids"], 1.0, "user_like")
    add_articles(seed["group_liked_ids"], 0.7, "group_like")
    add_articles(seed["positive_feedback_ids"], 1.2, "positive_feedback")
    add_articles(seed["dismiss_feedback_ids"], -1.0, "dismiss_feedback")

    if not weighted_vectors:
        return {
            "seed": seed,
            "weights_used": [],
            "profile_summary": {
                "exists": False,
                "nonzero_dimensions": 0,
                "vector_length": 0,
            },
            "recommendations": [],
        }

    matrix = np.vstack([item[1] for item in weighted_vectors])
    weights_array = np.array([item[2] for item in weighted_vectors], dtype=float)

    denominator = np.sum(np.abs(weights_array))
    profile = np.sum(matrix * weights_array[:, None], axis=0) / denominator

    scored = score_articles_for_user(user, model_name=model_name, limit=limit)

    return {
        "seed": {
            "user_liked_ids": list(seed["user_liked_ids"]),
            "group_liked_ids": list(seed["group_liked_ids"]),
            "positive_feedback_ids": list(seed["positive_feedback_ids"]),
            "dismiss_feedback_ids": list(seed["dismiss_feedback_ids"]),
        },
        "weights_used": weights_info,
        "profile_summary": {
            "exists": True,
            "vector_length": int(len(profile)),
            "nonzero_dimensions": int((profile != 0).sum()),
            "norm": float(np.linalg.norm(profile)),
            "first_20_values": profile[:20].astype(float).tolist(),
        },
        "recommendations": scored,
    }