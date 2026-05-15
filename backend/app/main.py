from pydantic import BaseModel
from rag.retriever import retrieve_chunks
from rag.generator import generate_answer
from fastapi import FastAPI, UploadFile, File
import shutil

from rag.pdf_loader import extract_text
from rag.chunker import chunk_text
from rag.embedder import create_embeddings
from rag.vectordb import store_chunks

app = FastAPI()


@app.get("/")
def home():

    return {
        "message": "StudentOS Nexus RAG API Running"
    }


@app.post("/upload")
def upload_pdf(file: UploadFile = File(...)):

    # Save uploaded PDF
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text
    text = extract_text(file_path)

    # Chunk text
    chunks = chunk_text(text)

    # Generate embeddings
    embeddings = create_embeddings(chunks)

    # Store in ChromaDB
    store_chunks(chunks, embeddings)

    return {
        "message": f"{file.filename} processed successfully",
        "total_chunks": len(chunks)
    }

class QuestionRequest(BaseModel):
    question: str


@app.post("/ask")
def ask_question(request: QuestionRequest):

    # User question
    query = request.question

    # Retrieve relevant chunks
    results = retrieve_chunks(query)

    # Generate AI answer
    answer = generate_answer(
        query,
        results["documents"]
    )

    return {
        "question": query,
        "answer": answer
    }