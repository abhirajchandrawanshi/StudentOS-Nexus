def retrieve_chunks(query):
    from app.rag.embedder import create_embeddings
    from app.rag.vectordb import get_collection

    # Convert query into embedding
    query_embedding = create_embeddings([query])

    # Search similar chunks
    collection = get_collection()
    results = collection.query(
        query_embeddings=query_embedding.tolist() if hasattr(query_embedding, 'tolist') else query_embedding,
        n_results=3
    )

    return results
