import { Link } from 'react-router-dom'
import { Compass, ArrowLeft } from 'lucide-react'

const NotFound = () => {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--background)' }}
    >
      {/* Background decoration */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-25 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      <div className="text-center relative max-w-md w-full fade-up flex flex-col items-center">
        {/* Animated Compass Icon */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8"
          style={{
            background: 'var(--background-card)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          }}
        >
          <Compass
            size={40}
            style={{
              color: 'var(--primary)',
              animation: 'spin 20s linear infinite',
            }}
          />
        </div>

        {/* 404 text with primary gradient */}
        <h1
          className="text-8xl font-extrabold tracking-tight mb-2 grad-primary"
          style={{
            lineHeight: 1.15,
          }}
        >
          404
        </h1>

        {/* Subtitle */}
        <h2
          className="text-2xl font-bold mb-3"
          style={{ color: 'var(--foreground)' }}
        >
          Oops! Page not found
        </h2>

        {/* Description */}
        <p
          className="text-sm mb-8 max-w-[320px] mx-auto"
          style={{ color: 'var(--foreground-muted)', lineHeight: 1.6 }}
        >
          The page you're looking for doesn't exist, has been moved, or is temporarily unavailable.
        </p>

        {/* Action Button */}
        <Link
          to="/app/dashboard"
          className="btn-primary inline-flex items-center gap-2"
          style={{
            padding: '12px 28px',
            borderRadius: '12px',
            fontSize: '14.5px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>
    </main>
  )
}

export default NotFound