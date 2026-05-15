import chromadb

# Create ChromaDB client
client = chromadb.PersistentClient(path="./chroma_db")

# Create collection
collection = client.get_or_create_collection(
    name="notes"
)

def store_chunks(chunks, embeddings):

    ids = [str(i) for i in range(len(chunks))]

    collection.add(
        documents=chunks,
        embeddings=embeddings.tolist(),
        ids=ids
    )

    print("Chunks stored successfully!")