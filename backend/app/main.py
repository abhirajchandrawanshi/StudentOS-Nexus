from contextlib import asynccontextmanager
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil

from app.rag.retriever import retrieve_chunks
from app.rag.generator import generate_answer
from app.rag.pdf_loader import extract_text
from app.rag.chunker import chunk_text
from app.rag.embedder import create_embeddings
from app.rag.vectordb import store_chunks
from app.dsa.routes import router as dsa_router
from app.resume.routes import router as resume_router
from app.todo.routes import router as todo_router
from app.todo.analytics_routes import router as analytics_router
from app.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialise resume DB tables on startup (no-op if DATABASE_URL not set)
    await init_db()
    yield

app = FastAPI(
    title="StudentOS Nexus API",
    description="AI-powered student career platform backend",
    version="1.0.0",
    lifespan=lifespan,
)

# Include DSA Router
app.include_router(dsa_router,    prefix="/dsa",    tags=["DSA"])
app.include_router(resume_router, prefix="/resume", tags=["Resume"])
app.include_router(todo_router, prefix="/todo", tags=["Todo"])
app.include_router(analytics_router)

# ─── CORS — allow frontend to call this API ────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://127.0.0.1:5173",
        "http://localhost:3000",   # fallback if port changes
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():

    return {
        "message": "StudentOS Nexus RAG API Running"
    }


@app.post("/upload")
def upload_pdf(file: UploadFile = File(...)):

    # Save uploaded PDF
    file_path = f"app/uploads/{file.filename}"

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