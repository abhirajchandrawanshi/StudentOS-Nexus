<<<<<<< HEAD
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: API_BASE })

// Attach token to every request
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth-storage')
  if (raw) {
    try {
      const { state } = JSON.parse(raw)
      if (state?.token) config.headers.Authorization = `Bearer ${state.token}`
    } catch {}
  }
  return config
})

const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },
  signup: async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password })
    return data
  },
  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignore errors on logout — just clear local state
    }
  },
}

export default authService
=======
import api from './api'
 
const authService = {
  // ─── Login ────────────────────────────────────────────────────────
  // POST /auth/login
  // Body: { email, password }
  // Returns: { user, access_token }
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },
 
  // ─── Signup ───────────────────────────────────────────────────────
  // POST /auth/signup
  // Body: { name, email, password, branch, year }
  // Returns: { user, access_token }
  signup: async (formData) => {
    const response = await api.post('/auth/signup', formData)
    return response.data
  },
 
  // ─── Google OAuth ─────────────────────────────────────────────────
  // POST /auth/google
  // Body: { token } — Google ID token from OAuth popup
  // Returns: { user, access_token }
  googleAuth: async (googleToken) => {
    const response = await api.post('/auth/google', { token: googleToken })
    return response.data
  },
 
  // ─── Get current user ─────────────────────────────────────────────
  // GET /auth/me — verifies token is still valid
  // Returns: { user }
  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
 
  // ─── Logout ───────────────────────────────────────────────────────
  // POST /auth/logout — optional server-side token invalidation
  logout: async () => {
    try {
      const authData = localStorage.getItem('auth-storage')
      if (authData) {
        const parsed = JSON.parse(authData)
        const token = parsed?.state?.token
        if (token === 'mock-token-123' || !token) {
          // In mock mode, don't make backend API call to avoid connection error in console
          return
        }
      }
      await api.post('/auth/logout')
    } catch {
      // Even if server call fails, local logout still happens
    }
  },
}
 
export default authService
>>>>>>> fc462d48ce69bd682d378efa519605f533f2b8e7
