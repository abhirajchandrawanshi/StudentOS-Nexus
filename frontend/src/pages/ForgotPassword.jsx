import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Loader2, BookOpen, ArrowLeft, CheckCircle2 } from 'lucide-react'
import useUIStore from '../store/uiStore'

const ForgotPassword = () => {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'

  const [email, setEmail]       = useState('')
  const [error, setError]       = useState('')
  const [isLoading, setLoading] = useState(false)
  const [sent, setSent]         = useState(false)

  const validate = () => {
    if (!email) return 'Email is required'
    if (!/\S+@\S+\.\S+/.test(email)) return 'Enter a valid email'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    setError('')
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
    setSent(true)
  }

  const inputStyle = {
    background: 'var(--background-elevated)',
    border: `1px solid ${error ? 'var(--destructive)' : 'var(--border)'}`,
    color: 'var(--foreground)',
    borderRadius: '12px',
    fontSize: '13.5px',
    padding: '11px 12px 11px 40px',
    width: '100%',
    outline: 'none',
    transition: 'all 0.15s ease',
    fontFamily: 'Inter, sans-serif',
  }

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
        .fp-input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15) !important; }
      `}</style>

      {/* Background blobs */}
      <div className="glowing-blob-1" style={{ position: 'absolute', top: '10%', left: '20%', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 75%)', filter: 'blur(70px)', pointerEvents: 'none', zIndex: 1 }} />
      <div className="glowing-blob-2" style={{ position: 'absolute', bottom: '10%', right: '10%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 75%)', filter: 'blur(70px)', pointerEvents: 'none', zIndex: 1 }} />



      {/* Content */}
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
          {sent ? (
            /* ── Success State ── */
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px',
                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle2 size={32} style={{ color: '#22C55E' }} />
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
                Check your email
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--foreground-muted)', lineHeight: 1.6, maxWidth: '300px' }}>
                We've sent a password reset link to <strong style={{ color: 'var(--foreground)' }}>{email}</strong>. 
                Check your inbox and follow the instructions.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--foreground-subtle)', lineHeight: 1.5 }}>
                Didn't receive it? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                >
                  try again
                </button>
              </p>
              <Link
                to="/login"
                className="btn-primary w-full mt-2 touch-target"
                style={{
                  height: '46px', borderRadius: '12px',
                  justifyContent: 'center', gap: '8px', fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                <ArrowLeft size={16} /> Back to Sign in
              </Link>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--foreground)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
                Forgot password?
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--foreground-subtle)', marginBottom: '28px', lineHeight: 1.5 }}>
                No worries! Enter your email and we'll send you a reset link.
              </p>

              {/* Error */}
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
                {/* Email */}
                <div>
                  <label htmlFor="fp-email" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--foreground-muted)', marginBottom: '8px' }}>
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--foreground-subtle)' }} />
                    <input
                      type="email"
                      id="fp-email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); if (error) setError('') }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="fp-input"
                      style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--primary)' }}
                      onBlur={e => { e.target.style.borderColor = error ? 'var(--destructive)' : 'var(--border)' }}
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full touch-target"
                  style={{
                    height: '46px', borderRadius: '12px',
                    justifyContent: 'center', gap: '8px', fontSize: '14px',
                  }}
                >
                  {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Sending link...</>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </form>

              <p className="text-center text-xs mt-6" style={{ color: 'var(--foreground-subtle)', fontWeight: 500 }}>
                Remember your password?{' '}
                <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
