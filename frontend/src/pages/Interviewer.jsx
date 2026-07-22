import { useState } from 'react'
import {
  Code2, MessageSquare, Globe, Play,
  Trophy, Clock, Target, ChevronRight,
  Star, Calendar, TrendingUp, Mic,
  Video, Monitor, StopCircle, CheckCircle2,
} from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

// ── Score color ────────────────────────────────────────────────────
const scoreColor = (s) => {
  const n = parseFloat(s)
  if (n >= 9) return '#22C55E'
  if (n >= 8) return '#06B6D4'
  if (n >= 7) return '#F59E0B'
  return '#EF4444'
}

// ── Data ───────────────────────────────────────────────────────────
const INTERVIEW_TYPES = [
  {
    key: 'technical',
    icon: Code2,
    iconBg: 'rgba(124,58,237,0.15)',
    iconColor: '#7C3AED',
    title: 'Technical Interview',
    desc: 'DSA, system design, and problem-solving',
  },
  {
    key: 'behavioral',
    icon: MessageSquare,
    iconBg: 'rgba(236,72,153,0.15)',
    iconColor: '#EC4899',
    title: 'Behavioral Interview',
    desc: 'Communication and soft skills assessment',
  },
  {
    key: 'custom',
    icon: Globe,
    iconBg: 'rgba(6,182,212,0.15)',
    iconColor: '#06B6D4',
    title: 'Custom Interview',
    desc: 'Tailored to specific role or company',
  },
]

const RECENT = [
  { type: 'Technical Interview',  topic: 'System Design', date: 'May 16', score: '9.2/10' },
  { type: 'Behavioral Interview', topic: 'Leadership',    date: 'May 15', score: '8.5/10' },
  { type: 'Technical Interview',  topic: 'DSA',           date: 'May 14', score: '7.8/10' },
  { type: 'Custom Interview',     topic: 'Frontend',      date: 'May 13', score: '8.9/10' },
]

const TIPS = [
  {
    icon: Star,       color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',
    title: 'Pro Tip',
    body: 'Practice STAR method answers for behavioral questions to structure your responses effectively.',
  },
  {
    icon: TrendingUp, color: '#22C55E',
    bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)',
    title: 'Improvement Area',
    body: 'System design scores are your weakest area. Consider reviewing distributed systems concepts.',
  },
  {
    icon: Target,     color: '#06B6D4',
    bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)',
    title: 'Next Goal',
    body: 'Complete 3 more technical interviews to unlock your personalized placement readiness score.',
  },
]

// ── Sub-components ─────────────────────────────────────────────────
const StatCard = ({ icon: Icon, iconBg, iconColor, label, value, sub, isMobile }) => (
  <div style={{
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: isMobile ? '18px 20px' : '24px 28px',
    flex: 1,
    background: 'linear-gradient(135deg, var(--background-card) 60%, rgba(124,58,237,0.04) 100%)',
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{
        width: isMobile ? 40 : 48, height: isMobile ? 40 : 48,
        borderRadius: 14, flexShrink: 0,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={isMobile ? 18 : 22} style={{ color: iconColor }} />
      </div>
      <div>
        <p style={{ fontSize: 12, color: 'var(--foreground-muted)', margin: '0 0 5px' }}>{label}</p>
        <p style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 3px', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 11, color: 'var(--foreground-subtle)', margin: 0 }}>{sub}</p>
      </div>
    </div>
  </div>
)

const InterviewCard = ({ icon: Icon, iconBg, iconColor, title, desc, onClick }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '18px 20px', borderRadius: 14,
        background: hovered
          ? 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(236,72,153,0.04))'
          : 'var(--background)',
        border: `1px solid ${hovered ? 'rgba(124,58,237,0.5)' : 'var(--border)'}`,
        cursor: 'pointer',
        transform: hovered ? 'translateX(4px)' : 'none',
        transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: hovered ? 'scale(1.08)' : 'scale(1)',
        transition: 'transform 0.18s',
      }}>
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', margin: '0 0 3px' }}>{title}</p>
        <p style={{ fontSize: 12, color: 'var(--foreground-muted)', margin: 0 }}>{desc}</p>
      </div>
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: hovered ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.18s',
      }}>
        <Play size={12} style={{ color: hovered ? '#7C3AED' : 'var(--foreground-muted)', marginLeft: 1 }} />
      </div>
    </div>
  )
}

const SessionRow = ({ type, topic, date, score, last, onClick }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: last ? 'none' : '1px solid var(--border)',
        background: hovered ? 'rgba(124,58,237,0.05)' : 'transparent',
        cursor: 'pointer', transition: 'background 0.15s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', margin: '0 0 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{type}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20,
            background: 'rgba(124,58,237,0.12)', color: '#a78bfa',
            border: '1px solid rgba(124,58,237,0.2)',
          }}>{topic}</span>
          <span style={{ fontSize: 11, color: 'var(--foreground-subtle)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Calendar size={10} /> {date}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: scoreColor(score) }}>{score}</span>
        <ChevronRight size={14} style={{ color: 'var(--foreground-subtle)', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }} />
      </div>
    </div>
  )
}

// ── Active Session View ────────────────────────────────────────────
const ActiveSession = ({ sessionKey, onEnd, showToast }) => {
  const t = INTERVIEW_TYPES.find(x => x.key === sessionKey)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Session header */}
      <div style={{
        background: 'var(--background-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: t.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <t.icon size={20} style={{ color: t.iconColor }} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>{t.title}</p>
            <p style={{ fontSize: 12, color: 'var(--foreground-muted)', margin: '2px 0 0' }}>Session in progress</p>
          </div>
        </div>
        <button
          onClick={onEnd}
          aria-label="End Session"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 10,
            border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.08)', color: '#ef4444',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
        >
          <StopCircle size={14} /> End Session
        </button>
      </div>

      {/* Chat placeholder */}
      <div style={{
        flex: 1, background: 'var(--background-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 40,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, minHeight: 360,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: t.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <t.icon size={30} style={{ color: t.iconColor }} />
        </div>
        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
          {t.title} Started
        </p>
        <p style={{ fontSize: 13, color: 'var(--foreground-muted)', textAlign: 'center', maxWidth: 360, margin: 0, lineHeight: 1.6 }}>
          The AI interviewer is ready. This is where the interview chat interface will be integrated with your backend.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: Mic,     label: 'Microphone', action: () => showToast('Microphone toggled!') },
            { icon: Video,   label: 'Video', action: () => showToast('Video toggled!') },
            { icon: Monitor, label: 'Share Screen', action: () => showToast('Screen sharing toggled!') },
          ].map(({ icon: Icon, label, action }) => (
            <button key={label} onClick={action} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'rgba(124,58,237,0.08)', color: 'var(--foreground-muted)',
              fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.color = 'var(--foreground)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--foreground-muted)' }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────
export default function Interviewer() {
  const [activeSession, setActiveSession] = useState(null)
  const [toast, setToast] = useState('')
  const isMobile = useIsMobile()

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  if (activeSession) {
    return <ActiveSession sessionKey={activeSession} onEnd={() => setActiveSession(null)} showToast={showToast} />
  }

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          AI Interviewer
        </h1>
        <p style={{ fontSize: 14, color: 'var(--foreground-muted)', margin: 0 }}>
          Practice with AI-powered mock interviews
        </p>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: 14,
      }}>
        <StatCard icon={Trophy}  iconBg="rgba(124,58,237,0.15)" iconColor="#7C3AED" label="Interview Score"  value="8.5/10" sub="Average across 12 interviews" isMobile={isMobile} />
        <StatCard icon={Clock}   iconBg="rgba(236,72,153,0.15)" iconColor="#EC4899" label="Practice Time"   value="24h"    sub="Total interview practice"     isMobile={isMobile} />
        <StatCard icon={Target}  iconBg="rgba(6,182,212,0.15)"  iconColor="#06B6D4" label="Success Rate"    value="87%"    sub="Questions answered correctly"  isMobile={isMobile} />
      </div>

      {/* Main content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 380px',
        gap: 20,
        alignItems: 'start',
      }}>

        {/* Start new interview */}
        <div style={{
          background: 'var(--background-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '22px 22px 26px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
              Start New Interview
            </h2>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 20,
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#22C55E' }}>AI Ready</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {INTERVIEW_TYPES.map(({ key, ...rest }) => (
              <InterviewCard key={key} {...rest} onClick={() => setActiveSession(key)} />
            ))}
          </div>
        </div>

        {/* Recent sessions */}
        <div style={{
          background: 'var(--background-card)', border: '1px solid var(--border)',
          borderRadius: 16, overflow: 'hidden',
        }}>
          <div style={{
            padding: '18px 20px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
              Recent Sessions
            </h2>
            <button 
              onClick={() => showToast('Opening interview session history...')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: 'var(--primary)', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          {RECENT.map((s, i) => (
            <SessionRow 
              key={i} 
              {...s} 
              last={i === RECENT.length - 1} 
              onClick={() => showToast(`Opening feedback report for ${s.type} (${s.topic})...`)}
            />
          ))}
          {/* Performance footer */}
          <div style={{
            margin: '0 14px 14px',
            padding: '12px 16px', borderRadius: 12,
            background: 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(236,72,153,0.05))',
            border: '1px solid rgba(124,58,237,0.2)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <TrendingUp size={15} style={{ color: '#22C55E', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', margin: '0 0 2px' }}>
                Performance improving!
              </p>
              <p style={{ fontSize: 11, color: 'var(--foreground-muted)', margin: 0 }}>
                Your average score increased by 0.4 this week
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: 14,
      }}>
        {TIPS.map(({ icon: Icon, color, bg, border, title, body }) => (
          <div key={title} style={{
            padding: '16px 18px', borderRadius: 14,
            background: bg, border: `1px solid ${border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon size={14} style={{ color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color }}>{title}</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--foreground-muted)', margin: 0, lineHeight: 1.6 }}>{body}</p>
          </div>
        ))}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--background-card)',
          border: '1px solid var(--primary)',
          color: 'var(--foreground)',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(124, 58, 237, 0.25)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeUp 0.2s ease-out'
        }}>
          <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>{toast}</span>
        </div>
      )}

    </div>
  )
}