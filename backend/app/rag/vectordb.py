_collection = None

def get_collection():
    global _collection
    if _collection is None:
        import chromadb
        client = chromadb.PersistentClient(path="./chroma_db")
        _collection = client.get_or_create_collection(name="notes")
    return _collection

def store_chunks(chunks, embeddings):
    collection = get_collection()
    ids = [str(i) for i in range(len(chunks))]
    collection.add(
        documents=chunks,
        embeddings=embeddings.tolist(),
        ids=ids
    )
    print("Chunks stored successfully!")
