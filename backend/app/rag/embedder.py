def get_embedding_model():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer('all-MiniLM-L6-v2')

_model = None

def create_embeddings(chunks):
    global _model
    if _model is None:
        _model = get_embedding_model()
    embeddings = _model.encode(chunks)
    return embeddings
