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
