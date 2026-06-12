import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'

<<<<<<< HEAD
/**
 * Renders children only when the user is authenticated.
 * Redirects to /login otherwise.
 */
const ProtectedRoute = () => {
  const { token } = useAuthStore()
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
=======
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
>>>>>>> fc462d48ce69bd682d378efa519605f533f2b8e7
