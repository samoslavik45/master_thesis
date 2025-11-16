# main/recommender/similarity.py
import numpy as np
from numpy.linalg import norm

def cosine_similarity(vec_a, vec_b):
    """
    Bezpečný výpočet cosine similarity medzi dvoma 1D vektormi.
    """
    a = np.array(vec_a, dtype=float)
    b = np.array(vec_b, dtype=float)

    na = norm(a)
    nb = norm(b)
    if na == 0.0 or nb == 0.0:
        return 0.0

    return float(np.dot(a, b) / (na * nb))
