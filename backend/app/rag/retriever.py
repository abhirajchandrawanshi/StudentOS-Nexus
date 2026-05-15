from app.rag.embedder import model
from app.rag.vectordb import collection

def retrieve_chunks(query):

    # Convert query into embedding
    query_embedding = model.encode([query])

    # Search similar chunks
    results = collection.query(
        query_embeddings=query_embedding.tolist(),
        n_results=3
    )

    return results