<<<<<<< HEAD
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
=======
// src/routes/PublicRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function PublicRoute() {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Outlet />
}
>>>>>>> fc462d48ce69bd682d378efa519605f533f2b8e7
