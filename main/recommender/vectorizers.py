# main/recommender/vectorizers.py
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

def build_corpus(articles):
    """
    Vytvorí textový korpus z článkov:
    title + abstract (content) + keywords + categories + authors.
    """
    texts = []

    for a in articles:
        kw = ", ".join(a.keywords.values_list('keyword', flat=True))
        cats = ", ".join(a.categories.values_list('name', flat=True))
        authors = ", ".join(a.authors.values_list('name', flat=True))

        text_parts = [
            a.title or "",
            a.content or "",
            kw,
            cats,
            authors,
        ]
        text = " ".join([t for t in text_parts if t])
        texts.append(text)

    return texts


def fit_tfidf(articles, max_features=5000):
    """
    Natrénuje TF-IDF na všetkých článkoch a vráti:
    - natrénovaný vectorizer
    - maticu X (každý riadok je článok)
    """
    texts = build_corpus(articles)
    if not texts:
        return None, None

    vectorizer = TfidfVectorizer(
        max_features=max_features,
        ngram_range=(1, 2),
        stop_words='english',
    )
    X = vectorizer.fit_transform(texts)  # scipy sparse matrix
    return vectorizer, X
