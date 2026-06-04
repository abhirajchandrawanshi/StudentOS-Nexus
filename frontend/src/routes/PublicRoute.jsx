import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'

/**
 * Renders children only when the user is NOT authenticated.
 * Redirects to /app/dashboard if already logged in.
 */
const PublicRoute = () => {
  const { token } = useAuthStore()
  return token ? <Navigate to="/app/dashboard" replace /> : <Outlet />
}

export default PublicRoute
