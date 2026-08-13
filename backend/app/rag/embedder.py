from __future__ import annotations

import logging

logger = logging.getLogger("rag.embedder")

model = None


def get_model():
    global model

    if model is not None:
        return model

    try:
        from sentence_transformers import SentenceTransformer
    except Exception as exc:
        logger.warning(f"sentence-transformers unavailable ({exc}). Embeddings disabled.")
        return None

    try:
        model = SentenceTransformer("all-MiniLM-L6-v2")
    except Exception as exc:
        logger.warning(f"Embedding model unavailable ({exc}). Embeddings disabled.")
        return None

    return model


def create_embeddings(chunks):
    embedding_model = get_model()

    if embedding_model is None or not chunks:
        return None

    return embedding_model.encode(chunks)