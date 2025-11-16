# main/recommender/index.py
from django.db import transaction
from main.models import Article, ArticleEmbedding
from main.recommender.vectorizers import fit_tfidf

def rebuild_tfidf_index(max_features=5000, model_name='tfidf-v1'):
    """
    Prepočíta TF-IDF vektory pre všetky články a uloží ich do ArticleEmbedding.
    Vráti počet spracovaných článkov.
    """
    # Načítame všetky články s prefetchom, aby to bolo efektívnejšie
    articles = list(
        Article.objects.all()
        .prefetch_related('keywords', 'categories', 'authors')
    )

    if not articles:
        return 0

    vectorizer, X = fit_tfidf(articles, max_features=max_features)
    if vectorizer is None or X is None:
        return 0

    # X je scipy sparse matrix, ideme riadok po riadku
    with transaction.atomic():
        for row, article in zip(X, articles):
            dense = row.toarray().ravel().astype(float).tolist()
            ArticleEmbedding.objects.update_or_create(
                article=article,
                defaults={
                    'vector': dense,
                    'model_name': model_name,
                }
            )

    return len(articles)
