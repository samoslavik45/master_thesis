# main/recommender/index.py
from django.db import transaction
from main.models import Article, ArticleEmbedding
from main.recommender.vectorizers import fit_tfidf, encode_sbert


def rebuild_tfidf_index(max_features=5000, model_name='tfidf-v1'):
    """
    Prepočíta TF-IDF vektory pre všetky články a uloží ich do ArticleEmbedding.
    Vráti počet spracovaných článkov.
    """
    articles = list(
        Article.objects.all()
        .prefetch_related('keywords', 'categories', 'authors')
    )

    if not articles:
        return 0

    vectorizer, X = fit_tfidf(articles, max_features=max_features)
    if vectorizer is None or X is None:
        return 0

    with transaction.atomic():
        for row, article in zip(X, articles):
            dense = row.toarray().ravel().astype(float).tolist()

            ArticleEmbedding.objects.update_or_create(
                article=article,
                model_name=model_name,
                defaults={
                    'vector': dense,
                }
            )

    return len(articles)


def rebuild_sbert_index(model_name='sbert-v1', encoder_name='all-MiniLM-L6-v2'):
    """
    Prepočíta SBERT embeddingy pre všetky články a uloží ich do ArticleEmbedding.
    Vráti počet spracovaných článkov.
    """
    articles = list(
        Article.objects.all()
        .prefetch_related('keywords', 'categories', 'authors')
    )

    if not articles:
        return 0

    model, X = encode_sbert(articles, encoder_name=encoder_name)
    if model is None or X is None:
        return 0

    with transaction.atomic():
        for vector, article in zip(X, articles):
            dense = vector.astype(float).tolist()

            ArticleEmbedding.objects.update_or_create(
                article=article,
                model_name=model_name,
                defaults={
                    'vector': dense,
                }
            )

    return len(articles)


def update_single_article_sbert_embedding(article, model_name='sbert-v1', encoder_name='all-MiniLM-L6-v2'):
    """
    Prepočíta a uloží SBERT embedding pre jeden článok.
    Vráti True, ak sa embedding úspešne uložil.
    """
    articles = [article]

    model, X = encode_sbert(articles, encoder_name=encoder_name)
    if model is None or X is None or len(X) == 0:
        return False

    dense = X[0].astype(float).tolist()

    ArticleEmbedding.objects.update_or_create(
        article=article,
        model_name=model_name,
        defaults={
            'vector': dense,
        }
    )

    return True