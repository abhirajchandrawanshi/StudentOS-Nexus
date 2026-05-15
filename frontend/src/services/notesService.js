import axios from 'axios'

// ─── RAG API instance (separate from main auth API) ──────────────
const ragApi = axios.create({
  baseURL: import.meta.env.VITE_RAG_API_URL || 'http://localhost:8000',
  timeout: 120000, // 2 min — PDF processing + AI generation can be slow
})

const notesService = {
  // ─── Upload PDF ─────────────────────────────────────────────────
  // POST /upload
  // Body: FormData with file
  // Returns: { message, total_chunks }
  uploadPdf: async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await ragApi.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // ─── Ask Question ───────────────────────────────────────────────
  // POST /ask
  // Body: { question }
  // Returns: { question, answer }
  askQuestion: async (question) => {
    const response = await ragApi.post('/ask', { question })
    return response.data
  },
}

export default notesService
