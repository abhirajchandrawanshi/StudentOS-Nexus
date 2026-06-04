import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'

/**
 * Renders children only when the user is authenticated.
 * Redirects to /login otherwise.
 */
const ProtectedRoute = () => {
  const { token } = useAuthStore()
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
