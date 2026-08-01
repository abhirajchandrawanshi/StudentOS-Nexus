import os
import logging
from dotenv import load_dotenv

try:
    import google.generativeai as genai
except Exception:
    genai = None

logger = logging.getLogger("rag.generator")

# Load environment variables from .env
load_dotenv()

# Configure API Key from environment
if genai is not None and os.getenv("GEMINI_API_KEY"):
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-2.5-flash")
    except Exception as exc:
        logger.warning(f"Gemini model initialization failed: {exc}")
        model = None
else:
    model = None


def generate_answer(query, retrieved_docs):
    if model is None:
        return "Gemini is not available in the current environment."

    # Convert list into readable text
    context = "\n".join(retrieved_docs[0])

    prompt = f"""
    Answer the question using only the provided context.

    Context:
    {context}

    Question:
    {query}
    """

    response = model.generate_content(prompt)

    return response.text