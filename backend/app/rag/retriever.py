from app.rag.embedder import get_model
from app.rag.vectordb import collection


def retrieve_chunks(query):
    if collection is None:
        return {"documents": [], "ids": [], "distances": []}

    model = get_model()
    if model is None:
        return {"documents": [], "ids": [], "distances": []}

    query_embedding = model.encode([query])
    results = collection.query(
        query_embeddings=query_embedding.tolist(),
        n_results=3,
    )
    return results