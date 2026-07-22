import axios from 'axios'
 
// ─── Base instance ────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})
 
// ─── Request interceptor — attach JWT token ───────────────────────
api.interceptors.request.use(
  (config) => {
    // Read token from localStorage (Zustand persist stores it here)
    const authData = localStorage.getItem('auth-storage')
    if (authData) {
      const parsed = JSON.parse(authData)
      const token = parsed?.state?.token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)
 
// ─── Response interceptor — handle errors globally ────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
 
    // 401 = token expired or invalid → force logout
    if (status === 401) {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
 
    // 403 = forbidden
    if (status === 403) {
      console.error('Access forbidden')
    }
 
    // 500 = server error
    if (status === 500) {
      console.error('Server error — please try again later')
    }
 
    return Promise.reject(error)
  }
)
 
export default api