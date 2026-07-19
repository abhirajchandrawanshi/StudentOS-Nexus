import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, GraduationCap, Loader2, BookOpen, Sun, Moon } from 'lucide-react'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'

const BRANCHES = [
  'Computer Science', 'Information Technology', 'Electronics & Communication',
  'Mechanical', 'Civil', 'Electrical', 'Data Science', 'AI & ML', 'Other',
]

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year']

const FieldError = ({ error }) =>
  error ? (
    <p className="text-xs mt-1.5" style={{ color: 'var(--destructive)' }}>{error}</p>
  ) : null

const Signup = () => {
  const navigate = useNavigate()
  const { login, setLoading, setError, isLoading, error, clearError } = useAuthStore()
  const { theme } = useUIStore()
  const isDark = theme === 'dark'

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

    try {
      setLoading(true)
      clearError()
      // ── TEMPORARY mock until backend ready ──
      const mockUser = {
        name: formData.name,
        email: formData.email,
        branch: formData.branch,
        year: formData.year,
      }
      login(mockUser, 'mock-token-123')
      navigate('/app/dashboard')
    } catch (err) {
      setError(err?.response?.data?.detail || 'An error occurred during sign up')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = () => {
    setLoading(true)
    clearError()
    setTimeout(() => {
      const mockUser = { name: 'Sakshi (Google)', email: 'google.user@example.com', branch: 'Computer Science', year: '3rd Year' }
      login(mockUser, 'mock-google-token-123')
      setLoading(false)
      navigate('/app/dashboard')
    }, 1000)
  }

  const inputStyle = (field) => ({
    background: 'var(--background-elevated)',
    border: `1px solid ${fieldErrors[field] ? 'var(--destructive)' : 'var(--border)'}`,
    color: 'var(--foreground)',
    borderRadius: '12px',
    fontSize: '13.5px',
    padding: '11px 12px 11px 40px',
    width: '100%',
    outline: 'none',
    transition: 'all 0.15s ease',
    fontFamily: 'Inter, sans-serif',
  })

  const selectStyle = (field) => ({
    background: 'var(--background-elevated)',
    border: `1px solid ${fieldErrors[field] ? 'var(--destructive)' : 'var(--border)'}`,
    color: formData[field] ? 'var(--foreground)' : 'var(--foreground-subtle)',
    borderRadius: '12px',
    fontSize: '13.5px',
    padding: field === 'branch' ? '11px 12px 11px 40px' : '11px 12px',
    width: '100%',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'Inter, sans-serif',
  })

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative"
      style={{ background: 'var(--background)', color: 'var(--foreground)', overflowX: 'hidden' }}
    >
      <style>{`
        @keyframes drift {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.05); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .glowing-blob-1 { animation: drift 18s infinite alternate ease-in-out; }
        .glowing-blob-2 { animation: drift 24s infinite alternate-reverse ease-in-out; }
        .theme-btn:hover { background: var(--background-hover) !important; color: var(--foreground) !important; transform: scale(1.05); }
        .social-btn:hover { border-color: rgba(124, 58, 237, 0.4) !important; background: var(--background-hover) !important; transform: translateY(-1px); }
        .login-input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15) !important; }
      `}</style>

      {/* Background blobs */}
      <div className="glowing-blob-1" style={{ position: 'absolute', top: '10%', left: '20%', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 75%)', filter: 'blur(70px)', pointerEvents: 'none', zIndex: 1 }} />
      <div className="glowing-blob-2" style={{ position: 'absolute', bottom: '10%', right: '10%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 75%)', filter: 'blur(70px)', pointerEvents: 'none', zIndex: 1 }} />

      {/* Centered Content Container */}
      <div className="relative w-full max-w-[400px] z-10 fade-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#EC4899)' }}
          >
            <BookOpen size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            StudentOS <span className="grad-primary">Nexus</span>
          </span>
        </div>

        {/* Card */}
        <div
          className="card"
          style={{
            padding: '40px 32px',
            boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.35)' : '0 20px 40px rgba(124,58,237,0.06)',
            background: 'var(--background-card)',
            border: '1px solid var(--border)',
          }}
        >
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--foreground)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Create your account
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--foreground-subtle)', marginBottom: '28px' }}>
            Your AI-powered academic OS awaits
          </p>

          {/* Global error */}
          {error && (
            <div
              style={{
                marginBottom: '20px', padding: '12px 16px', borderRadius: '10px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: 'var(--destructive)', fontSize: '13.5px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <span style={{ fontWeight: 600 }}>Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Full Name */}
            <div>
              <label htmlFor="name" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--foreground-muted)', marginBottom: '8px' }}>Full name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--foreground-subtle)' }} />
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Arjun Kumar"
                  className="login-input"
                  style={inputStyle('name')}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)' }}
                  onBlur={(e)  => { e.target.style.borderColor = fieldErrors.name ? 'var(--destructive)' : 'var(--border)' }}
                />
              </div>
              {fieldErrors.name && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--destructive)' }}>{fieldErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--foreground-muted)', marginBottom: '8px' }}>Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--foreground-subtle)' }} />
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="login-input"
                  style={inputStyle('email')}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)' }}
                  onBlur={(e)  => { e.target.style.borderColor = fieldErrors.email ? 'var(--destructive)' : 'var(--border)' }}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--destructive)' }}>{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--foreground-muted)', marginBottom: '8px' }}>Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--foreground-subtle)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="login-input"
                  style={{ ...inputStyle('password'), paddingRight: '44px' }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)' }}
                  onBlur={(e)  => { e.target.style.borderColor = fieldErrors.password ? 'var(--destructive)' : 'var(--border)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  style={{
                    color: 'var(--foreground-subtle)',
                    background: 'none',
                    border: 'none',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--destructive)' }}>{fieldErrors.password}</p>
              )}
            </div>

            {/* Branch + Year — 2 column row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Branch */}
              <div>
                <label htmlFor="branch" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--foreground-muted)', marginBottom: '8px' }}>Branch</label>
                <div className="relative">
                  <GraduationCap size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-subtle)' }} />
                  <select
                    name="branch"
                    id="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="login-input"
                    style={selectStyle('branch')}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--primary)' }}
                    onBlur={(e)  => { e.target.style.borderColor = fieldErrors.branch ? 'var(--destructive)' : 'var(--border)' }}
                  >
                    <option value="" disabled>Branch</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b} style={{ background: 'var(--background-card)', color: 'var(--foreground)' }}>{b}</option>
                    ))}
                  </select>
                </div>
                {fieldErrors.branch && (
                  <p className="text-xs mt-1.5" style={{ color: 'var(--destructive)' }}>{fieldErrors.branch}</p>
                )}
              </div>

              {/* Year */}
              <div>
                <label htmlFor="year" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--foreground-muted)', marginBottom: '8px' }}>Year</label>
                <div className="relative">
                  <select
                    name="year"
                    id="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="login-input"
                    style={selectStyle('year')}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--primary)' }}
                    onBlur={(e)  => { e.target.style.borderColor = fieldErrors.year ? 'var(--destructive)' : 'var(--border)' }}
                  >
                    <option value="" disabled>Year</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y} style={{ background: 'var(--background-card)', color: 'var(--foreground)' }}>{y}</option>
                    ))}
                  </select>
                </div>
                {fieldErrors.year && (
                  <p className="text-xs mt-1.5" style={{ color: 'var(--destructive)' }}>{fieldErrors.year}</p>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-2 touch-target"
              style={{
                height: '46px', borderRadius: '12px',
                justifyContent: 'center', gap: '8px', fontSize: '14px',
              }}
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Creating account...</>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--foreground-subtle)', fontWeight: 500 }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* Google OAuth placeholder */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="btn-ghost w-full justify-center social-btn touch-target"
            style={{
              height: '46px', borderRadius: '12px', background: 'transparent',
              borderColor: 'var(--border)', color: 'var(--foreground)',
              fontSize: '14px', gap: '8px', display: 'flex', alignItems: 'center',
              transition: 'all 0.2s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Already have an account button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs" style={{ color: 'var(--foreground-subtle)', fontWeight: 500 }}>Already have an account?</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>
            <Link
              to="/login"
              className="btn-ghost w-full justify-center touch-target"
              style={{
                height: '46px', borderRadius: '12px', background: 'transparent',
                borderColor: 'var(--border)', color: 'var(--foreground)',
                fontSize: '14px', display: 'flex', alignItems: 'center',
                textDecoration: 'none', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--background-hover)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
