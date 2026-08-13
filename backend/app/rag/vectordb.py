from __future__ import annotations

import logging

logger = logging.getLogger("rag.vectordb")

# chromadb is not compatible with Python 3.14+ (pydantic v1 dependency).
# The RAG vector store is disabled gracefully when chromadb cannot be imported.
try:
    import chromadb  # type: ignore[import-untyped]

    _client = chromadb.PersistentClient(path="./chroma_db")
    collection = _client.get_or_create_collection(name="notes")
    _available = True
except Exception as _exc:  # ImportError or runtime crash on Python 3.14
    logger.warning(f"ChromaDB unavailable ({_exc}). Vector store disabled.")
    collection = None  # type: ignore[assignment]
    _available = False


def store_chunks(chunks, embeddings) -> None:
    if not _available or collection is None:
        logger.warning("store_chunks called but ChromaDB is not available.")
        return

    if embeddings is None:
        logger.warning("store_chunks called without embeddings. Skipping persistence.")
        return

    ids = [str(i) for i in range(len(chunks))]
    if hasattr(embeddings, "tolist"):
        embeddings = embeddings.tolist()

    collection.add(
        documents=chunks,
        embeddings=embeddings,
        ids=ids,
    )
    print("Chunks stored successfully!")