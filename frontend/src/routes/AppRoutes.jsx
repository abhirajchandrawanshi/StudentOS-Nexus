import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'

import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'
import DashboardLayout from '../layouts/DashboardLayout'

// Auth pages — not lazy (load immediately)
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import ForgotPassword from '../pages/ForgotPassword'

// App pages — lazy loaded
const Dashboard     = lazy(() => import('../pages/Dashboard'))
const Notes         = lazy(() => import('../pages/Notes'))
const DSA           = lazy(() => import('../pages/DSA'))
const Interviewer   = lazy(() => import('../pages/Interviewer'))
const Resume        = lazy(() => import('../pages/Resume'))
const Recommendations = lazy(() => import('../pages/Recommendations'))
const Planner       = lazy(() => import('../pages/Planner'))
const Analytics     = lazy(() => import('../pages/Analytics'))
const NotFound      = lazy(() => import('../pages/NotFound'))
const Profile       = lazy(() => import('../pages/Profile'))
const Settings      = lazy(() => import('../pages/Settings'))
const Todo          = lazy(() => import('../pages/Todo'))

// Simple loading fallback
const Loader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />

        {/* Public routes — redirect to dashboard if already logged in */}
        <Route element={<PublicRoute />}>
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Protected routes — redirect to login if not authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/app/dashboard"        element={<Dashboard />} />
            <Route path="/app/notes"            element={<Notes />} />
            <Route path="/app/dsa"              element={<DSA />} />
            <Route path="/app/interviewer"      element={<Interviewer />} />
            <Route path="/app/resume"           element={<Resume />} />
            <Route path="/app/recommendations"  element={<Recommendations />} />
            <Route path="/app/planner"          element={<Planner />} />
            <Route path="/app/productivity"     element={<Analytics />} />
            <Route path="/app/profile"          element={<Profile />} />
            <Route path="/app/settings"         element={<Settings />} />
            <Route path="/app/todo"             element={<Todo />} />
            
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Suspense>
  )
}

export default AppRoutes