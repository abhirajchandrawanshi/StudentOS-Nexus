import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, Loader2, BookOpen, ArrowRight } from 'lucide-react'
import useAuthStore from '../store/authStore'
import authService from '../services/authService'

const Login = () => {
  const navigate = useNavigate()
  const { login, setLoading, setError, isLoading, error, clearError } = useAuthStore()

  const [formData,     setFormData]     = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors,  setFieldErrors]  = useState({})

  const validate = () => {
    const errors = {}
    if (!formData.email) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Enter a valid email'
    if (!formData.password) errors.password = 'Password is required'
    else if (formData.password.length < 6) errors.password = 'Minimum 6 characters'
    return errors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((p) => ({ ...p, [name]: value }))
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: '' }))
    if (error) clearError()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }

    try {
      setLoading(true)
      clearError()
      // ── TEMPORARY mock until backend ready ──
      const mockUser = { name: 'Sakshi', email: formData.email, branch: 'Computer Science', year: '3rd Year' }
      login(mockUser, 'mock-token-123')
      navigate('/app/dashboard')
      // Real call: const data = await authService.login(formData.email, formData.password)
      // login(data.user, data.access_token); navigate('/app/dashboard')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field) => ({
    background: 'var(--bg-subtle)',
    border: `1px solid ${fieldErrors[field] ? 'var(--error-text)' : 'var(--border-subtle)'}`,
    color: 'var(--text-primary)',
    borderRadius: '8px',
    fontSize: '13.5px',
    padding: '9px 12px 9px 36px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: 'Inter, sans-serif',
  })

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--bg-canvas)' }}
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(244,63,94,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative w-full max-w-[400px] animate-fade-in">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--brand-500)' }}
          >
            <BookOpen size={15} className="text-white" />
          </div>
          <span className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            StudentOS <span style={{ color: 'var(--brand-500)' }}>Nexus</span>
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--bg-muted)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-7" style={{ color: 'var(--text-tertiary)' }}>
            Sign in to continue your learning journey
          </p>

          {/* Error */}
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-lg text-sm"
              style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email address
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email" name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={inputStyle('email')}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--brand-500)'; e.target.style.boxShadow = 'var(--shadow-brand)' }}
                  onBlur={(e)  => { e.target.style.borderColor = fieldErrors.email ? 'var(--error-text)' : 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--error-text)' }}>{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Password</label>
                <Link to="/forgot-password" className="text-xs transition-colors" style={{ color: 'var(--brand-500)' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'} name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ ...inputStyle('password'), paddingRight: '36px' }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--brand-500)'; e.target.style.boxShadow = 'var(--shadow-brand)' }}
                  onBlur={(e)  => { e.target.style.borderColor = fieldErrors.password ? 'var(--error-text)' : 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--error-text)' }}>{fieldErrors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoading} className="btn-brand w-full mt-2">
              {isLoading
                ? <><Loader2 size={14} className="animate-spin" /> Signing in...</>
                : <>'Sign in' <ArrowRight size={14} /></>
              }
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          </div>

          {/* Google */}
          <button type="button" className="btn-ghost w-full justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium transition-colors" style={{ color: 'var(--brand-500)' }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login