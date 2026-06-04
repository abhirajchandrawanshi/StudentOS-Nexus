import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Loader2, BookOpen, ArrowRight } from 'lucide-react'
import useAuthStore from '../store/authStore'
import authService from '../services/authService'

const Signup = () => {
  const navigate = useNavigate()
  const { login, setLoading, setError, isLoading, error, clearError } = useAuthStore()

  const [formData,     setFormData]     = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors,  setFieldErrors]  = useState({})

  const validate = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Full name is required'
    if (!formData.email) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Enter a valid email'
    if (!formData.password) errors.password = 'Password is required'
    else if (formData.password.length < 6) errors.password = 'Minimum 6 characters'
    if (formData.password !== formData.confirm) errors.confirm = 'Passwords do not match'
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
      const mockUser = { name: formData.name, email: formData.email }
      login(mockUser, 'mock-token-123')
      navigate('/app/dashboard')
      // Real call: const data = await authService.signup(formData.name, formData.email, formData.password)
      // login(data.user, data.access_token); navigate('/app/dashboard')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not create account. Please try again.')
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

  const fields = [
    { key: 'name',     label: 'Full name',        type: 'text',     icon: User,  placeholder: 'Jane Doe',          autoComplete: 'name' },
    { key: 'email',    label: 'Email address',     type: 'email',    icon: Mail,  placeholder: 'you@example.com',   autoComplete: 'email' },
    { key: 'password', label: 'Password',          type: showPassword ? 'text' : 'password', icon: Lock, placeholder: '••••••••', autoComplete: 'new-password' },
    { key: 'confirm',  label: 'Confirm password',  type: 'password', icon: Lock,  placeholder: '••••••••',          autoComplete: 'new-password' },
  ]

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--bg-canvas)' }}
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%)',
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
            Create your account
          </h1>
          <p className="text-sm mb-7" style={{ color: 'var(--text-tertiary)' }}>
            Join thousands of students levelling up their career
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

            {fields.map(({ key, label, type, icon: Icon, placeholder, autoComplete }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                  {key === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="text-xs transition-colors"
                      style={{ color: 'var(--brand-500)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type={type}
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    style={inputStyle(key)}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--brand-500)'; e.target.style.boxShadow = 'var(--shadow-brand)' }}
                    onBlur={(e)  => { e.target.style.borderColor = fieldErrors[key] ? 'var(--error-text)' : 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
                  />
                  {key === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </div>
                {fieldErrors[key] && (
                  <p className="text-xs mt-1.5" style={{ color: 'var(--error-text)' }}>{fieldErrors[key]}</p>
                )}
              </div>
            ))}

            {/* Submit */}
            <button type="submit" disabled={isLoading} className="btn-brand w-full mt-2">
              {isLoading
                ? <><Loader2 size={14} className="animate-spin" /> Creating account...</>
                : <>'Create account' <ArrowRight size={14} /></>
              }
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium transition-colors" style={{ color: 'var(--brand-500)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup
