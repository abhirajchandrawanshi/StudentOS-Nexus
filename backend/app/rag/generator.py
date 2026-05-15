import google.generativeai as genai

# Configure API Key
genai.configure(api_key="AIzaSyByCKBOcIup3ZWkCcIzqIxeZ5ob-WUyt4k")

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