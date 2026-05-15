import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, GraduationCap, Loader2, BookOpen } from 'lucide-react'
import useAuthStore from '../store/authStore'
import authService from '../services/authService'

const BRANCHES = [
  'Computer Science', 'Information Technology', 'Electronics & Communication',
  'Mechanical', 'Civil', 'Electrical', 'Data Science', 'AI & ML', 'Other',
]

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year']

const Signup = () => {
  const navigate = useNavigate()
  const { login, setLoading, setError, isLoading, error, clearError } = useAuthStore()

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', branch: '', year: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  // ─── Validation ───────────────────────────────────────────────────
  const validate = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.email) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Enter a valid email'
    if (!formData.password) errors.password = 'Password is required'
    else if (formData.password.length < 6) errors.password = 'Minimum 6 characters'
    if (!formData.branch) errors.branch = 'Select your branch'
    if (!formData.year) errors.year = 'Select your year'
    return errors
  }

  // ─── Input change ─────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    if (error) clearError()
  }

  // ─── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const mockUser = {
    name: formData.name,
    email: formData.email,
    branch: formData.branch,
    year: formData.year,
  }
  login(mockUser, 'mock-token-123')
  navigate('/app/dashboard')
}

  // ─── Reusable field error ─────────────────────────────────────────
  const FieldError = ({ name }) =>
    fieldErrors[name] ? (
      <p className="text-red-400 text-xs mt-1.5">{fieldErrors[name]}</p>
    ) : null

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4 py-10">

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="text-white text-xl font-semibold tracking-tight">
            StudentOS <span className="text-indigo-400">Nexus</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-white/8 rounded-2xl p-8 shadow-2xl">

          <h1 className="text-white text-2xl font-semibold mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm mb-7">Your AI-powered academic OS awaits</p>

          {/* Global error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Arjun Kumar"
                  className={`w-full bg-[#1a2235] text-white text-sm pl-9 pr-4 py-2.5 rounded-lg border outline-none transition-colors placeholder:text-slate-600
                    ${fieldErrors.name ? 'border-red-500/50 focus:border-red-500' : 'border-white/8 focus:border-indigo-500/60'}`}
                />
              </div>
              <FieldError name="name" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`w-full bg-[#1a2235] text-white text-sm pl-9 pr-4 py-2.5 rounded-lg border outline-none transition-colors placeholder:text-slate-600
                    ${fieldErrors.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/8 focus:border-indigo-500/60'}`}
                />
              </div>
              <FieldError name="email" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  className={`w-full bg-[#1a2235] text-white text-sm pl-9 pr-10 py-2.5 rounded-lg border outline-none transition-colors placeholder:text-slate-600
                    ${fieldErrors.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/8 focus:border-indigo-500/60'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <FieldError name="password" />
            </div>

            {/* Branch + Year — 2 column row */}
            <div className="grid grid-cols-2 gap-3">

              {/* Branch */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Branch</label>
                <div className="relative">
                  <GraduationCap size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className={`w-full bg-[#1a2235] text-sm pl-9 pr-3 py-2.5 rounded-lg border outline-none transition-colors appearance-none cursor-pointer
                      ${formData.branch ? 'text-white' : 'text-slate-600'}
                      ${fieldErrors.branch ? 'border-red-500/50 focus:border-red-500' : 'border-white/8 focus:border-indigo-500/60'}`}
                  >
                    <option value="" disabled>Branch</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b} className="bg-[#1a2235] text-white">{b}</option>
                    ))}
                  </select>
                </div>
                <FieldError name="branch" />
              </div>

              {/* Year */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Year</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className={`w-full bg-[#1a2235] text-sm px-3 py-2.5 rounded-lg border outline-none transition-colors appearance-none cursor-pointer
                    ${formData.year ? 'text-white' : 'text-slate-600'}
                    ${fieldErrors.year ? 'border-red-500/50 focus:border-red-500' : 'border-white/8 focus:border-indigo-500/60'}`}
                >
                  <option value="" disabled>Year</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y} className="bg-[#1a2235] text-white">{y}</option>
                  ))}
                </select>
                <FieldError name="year" />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-slate-600 text-xs">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Google OAuth placeholder */}
          <button
            type="button"
            className="w-full bg-[#1a2235] hover:bg-[#1e2840] border border-white/8 text-slate-300 text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Login link */}
          <p className="text-center text-slate-500 text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup
