from sklearn.feature_extraction.text import TfidfVectorizer
from sentence_transformers import SentenceTransformer
import numpy as np


def build_corpus(articles):
    """
    Vytvorí textový korpus z článkov:
    title + abstract (content) + keywords + categories + authors.
    """
    texts = []

    for a in articles:
        kw = ", ".join(a.keywords.values_list("keyword", flat=True))
        cats = ", ".join(a.categories.values_list("name", flat=True))
        authors = ", ".join(a.authors.values_list("name", flat=True))

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
        stop_words="english",
    )
    X = vectorizer.fit_transform(texts)  # scipy sparse matrix
    return vectorizer, X


def get_sbert_model(encoder_name="all-MiniLM-L6-v2"):
    """
    Načíta Sentence-BERT model.
    """
    return SentenceTransformer(encoder_name)


def encode_sbert(articles, encoder_name="all-MiniLM-L6-v2"):
    """
    Vygeneruje SBERT embeddingy pre všetky články a vráti:
    - model
    - numpy pole embeddingov, kde každý riadok patrí jednému článku
    """
    texts = build_corpus(articles)
    if not texts:
        return None, None

    model = get_sbert_model(encoder_name)
    X = model.encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return model, X