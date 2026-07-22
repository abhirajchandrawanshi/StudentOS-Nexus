import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env
load_dotenv()

# Configure API Key from environment
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Load Gemini model
model = genai.GenerativeModel("gemini-2.5-flash")
def generate_answer(query, retrieved_docs):

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