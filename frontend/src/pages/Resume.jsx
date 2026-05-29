import { useState, useRef } from 'react'
import {
  Download, Upload, Sparkles, CheckCircle2,
  Clock, AlertCircle, Plus, Trash2, Eye,
  RefreshCw,
} from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

// ── Initial Data ───────────────────────────────────────────────────
const INIT_RESUME = {
  name:  'Alex Johnson',
  title: 'Full Stack Developer',
  email: 'alex.j@email.com',
  phone: '+1 (555) 123-4567',
  linkedin: 'linkedin.com/in/alexj',
  summary: 'Passionate full-stack developer with 3+ years of experience building scalable web applications. Proficient in React, Node.js, and cloud technologies. Strong problem-solving with 450+ LeetCode problems solved.',
  experience: [
    {
      id: '1',
      role: 'Software Engineer Intern',
      company: 'Tech Corp Inc.',
      period: 'Jan 2025 – Aug 2025',
      bullets: [
        'Developed microservices using Node.js and Express',
        'Improved API response time by 40% through optimization',
        'Collaborated with team of 5 developers using Agile methodology',
      ],
    },
  ],
  education: [
    {
      id: '1',
      degree: 'B.Tech in Computer Science',
      school: 'XYZ University',
      gpa: '8.5/10',
      period: '2022 – 2026',
    },
  ],
  skills: ['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL'],
}

const AI_SUGGESTIONS = [
  { id: 1, icon: CheckCircle2, color: '#22C55E', title: 'Strong action verbs',  sub: 'Good use of impact words' },
  { id: 2, icon: Clock,        color: '#F59E0B', title: 'Add metrics',          sub: 'Quantify your achievements with numbers' },
  { id: 3, icon: AlertCircle,  color: '#F59E0B', title: 'Expand projects section', sub: 'Add 2–3 key projects' },
]

// ── Resume Score Ring ──────────────────────────────────────────────
const ScoreRing = ({ score }) => {
  const r = 34, circ = 2 * Math.PI * r, dash = (score / 100) * circ
  return (
    <div style={{ position: 'relative', width: '80px', height: '80px' }}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(124,58,237,0.15)" strokeWidth="8"/>
        <circle cx="40" cy="40" r={r} fill="none" stroke="url(#scoreGrad)" strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7C3AED"/>
            <stop offset="100%" stopColor="#EC4899"/>
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>{score}</span>
      </div>
    </div>
  )
}

// Dead EditField component removed

const Resume = () => {
  const isMobile = useIsMobile()
  const [resume, setResume]     = useState(INIT_RESUME)
  const [newSkill, setNewSkill] = useState('')
  const [score]                 = useState(85)
  const [toast, setToast]       = useState('')
  const importRef               = useRef(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const updateField = (field, value) => setResume(r => ({ ...r, [field]: value }))

  const updateExp = (id, field, value) =>
    setResume(r => ({ ...r, experience: r.experience.map(e => e.id === id ? { ...e, [field]: value } : e) }))

  const updateBullet = (expId, idx, value) =>
    setResume(r => ({ ...r, experience: r.experience.map(e =>
      e.id === expId ? { ...e, bullets: e.bullets.map((b, i) => i === idx ? value : b) } : e
    )}))

  const addBullet = (expId) =>
    setResume(r => ({ ...r, experience: r.experience.map(e =>
      e.id === expId ? { ...e, bullets: [...e.bullets, ''] } : e
    )}))

  const addExperience = () =>
    setResume(r => ({ ...r, experience: [...r.experience, {
      id: Date.now().toString(), role: 'New Role', company: 'Company Name',
      period: '2024 – Present', bullets: ['Describe your responsibilities...'],
    }]}))

  const removeSkill = (skill) =>
    setResume(r => ({ ...r, skills: r.skills.filter(s => s !== skill) }))

  const addSkill = (e) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      setResume(r => ({ ...r, skills: [...r.skills, newSkill.trim()] }))
      setNewSkill('')
    }
  }

  const card = {
    background: 'var(--background-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
  }

  // ── Resume document styles (white paper look) ──────────────────
  const paper = { fontFamily: 'Georgia, "Times New Roman", serif', color: '#1a1a1a' }
  const section = { borderBottom: '1.5px solid #1a1a1a', marginBottom: '8px', paddingBottom: '2px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }
  const inputStyle = { background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Georgia, serif', color: '#1a1a1a', width: '100%', cursor: 'text' }

  return (
    <div className="fade-up" style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'flex-start',
        justifyContent: 'space-between',
        gap: isMobile ? '16px' : '20px',
        flexShrink: 0
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            Resume Builder
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--foreground-muted)' }}>
            Create and optimize your resume with AI
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
          <input ref={importRef} type="file" accept=".pdf,.doc,.docx,.json" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) showToast(`Imported: ${e.target.files[0].name}`); e.target.value = '' }} />
          <button className="btn-ghost" style={{ gap: '8px' }} onClick={() => importRef.current?.click()}>
            <Upload size={15}/> Import
          </button>
          <button className="btn-primary" style={{ gap: '8px' }} onClick={() => { showToast('Opening print dialog...'); setTimeout(() => window.print(), 300) }}>
            <Download size={15}/> Export PDF
          </button>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: '20px', flex: 1, minHeight: 0 }}>

        {/* ── LEFT: Resume document ── */}
        <div style={{ overflowY: 'auto', order: isMobile ? 2 : 1 }} className="scrollbar-hide">
          <div style={{
            background: '#ffffff', borderRadius: '12px',
            boxShadow: '0 4px 40px rgba(0,0,0,0.15)',
            padding: isMobile ? '20px 16px' : '48px 52px', ...paper,
            minHeight: isMobile ? 'auto' : '900px',
          }}>
            {/* Name + title */}
            <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '1.5px solid #1a1a1a', paddingBottom: '14px' }}>
              <input
                type="text" value={resume.name}
                onChange={e => updateField('name', e.target.value)}
                style={{ ...inputStyle, fontSize: '26px', fontWeight: 700, textAlign: 'center', marginBottom: '4px', display: 'block', letterSpacing: '-0.01em' }}
              />
              <input
                type="text" value={resume.title}
                onChange={e => updateField('title', e.target.value)}
                style={{ ...inputStyle, fontSize: '14px', textAlign: 'center', color: '#555', display: 'block' }}
              />
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                {[
                  { field: 'email',    val: resume.email },
                  { field: 'phone',    val: resume.phone },
                  { field: 'linkedin', val: resume.linkedin },
                ].map(({ field, val }) => (
                  <input key={field} type="text" value={val}
                    onChange={e => updateField(field, e.target.value)}
                    style={{ ...inputStyle, fontSize: '12px', color: '#555', width: 'auto', textAlign: 'center' }}
                  />
                ))}
              </div>
            </div>

            {/* Summary */}
            <div style={{ marginBottom: '18px' }}>
              <div style={section}>Summary</div>
              <textarea
                value={resume.summary}
                onChange={e => updateField('summary', e.target.value)}
                rows={3}
                style={{ ...inputStyle, fontSize: '13px', lineHeight: 1.7, resize: 'none', display: 'block', color: '#333' }}
              />
            </div>

            {/* Experience */}
            <div style={{ marginBottom: '18px' }}>
              <div style={section}>Experience</div>
              {resume.experience.map((exp) => (
                <div key={exp.id} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-start', marginBottom: '2px', gap: isMobile ? '4px' : '0' }}>
                    <input type="text" value={exp.role} onChange={e => updateExp(exp.id, 'role', e.target.value)}
                      style={{ ...inputStyle, fontSize: '13px', fontWeight: 700, flex: 1 }}/>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
                      <input type="text" value={exp.period} onChange={e => updateExp(exp.id, 'period', e.target.value)}
                        style={{ ...inputStyle, fontSize: '12px', color: '#555', width: isMobile ? 'auto' : '130px', textAlign: isMobile ? 'left' : 'right' }}/>
                      <button onClick={() => setResume(r => ({ ...r, experience: r.experience.filter(e => e.id !== exp.id) }))}
                        aria-label="Delete experience"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '8px', opacity: 0.6 }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                      >
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                  <input type="text" value={exp.company} onChange={e => updateExp(exp.id, 'company', e.target.value)}
                    style={{ ...inputStyle, fontSize: '12px', color: '#555', marginBottom: '6px' }}/>
                  <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {exp.bullets.map((b, i) => (
                      <li key={i}>
                        <input type="text" value={b} onChange={e => updateBullet(exp.id, i, e.target.value)}
                          style={{ ...inputStyle, fontSize: '12px', color: '#333', lineHeight: 1.6 }}/>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => addBullet(exp.id)}
                    aria-label="Add bullet point to experience"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7C3AED', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px' }}>
                    <Plus size={12}/> Add bullet
                  </button>
                </div>
              ))}
              <button onClick={addExperience}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
                  borderRadius: '8px', border: '1px dashed rgba(124,58,237,0.4)',
                  background: 'rgba(124,58,237,0.05)', color: '#7C3AED',
                  fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.05)'}
              >
                <Plus size={13}/> Add experience
              </button>
            </div>

            {/* Education */}
            <div style={{ marginBottom: '18px' }}>
              <div style={section}>Education</div>
              {resume.education.map((edu) => (
                <div key={edu.id} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', marginBottom: isMobile ? '4px' : '0' }}>
                    <input type="text" value={edu.degree}
                      onChange={e => setResume(r => ({ ...r, education: r.education.map(d => d.id === edu.id ? { ...d, degree: e.target.value } : d) }))}
                      style={{ ...inputStyle, fontSize: '13px', fontWeight: 700, flex: 1 }}/>
                    <input type="text" value={edu.period}
                      onChange={e => setResume(r => ({ ...r, education: r.education.map(d => d.id === edu.id ? { ...d, period: e.target.value } : d) }))}
                      style={{ ...inputStyle, fontSize: '12px', color: '#555', width: isMobile ? 'auto' : '100px', textAlign: isMobile ? 'left' : 'right', marginTop: isMobile ? '2px' : '0' }}/>
                  </div>
                  <p style={{ fontSize: '12px', color: '#555' }}>
                    {edu.school} • GPA: {edu.gpa}
                  </p>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div>
              <div style={section}>Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                {resume.skills.map(skill => (
                  <span key={skill} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '3px 10px', borderRadius: '20px',
                    background: 'rgba(124,58,237,0.08)', color: '#7C3AED',
                    border: '1px solid rgba(124,58,237,0.2)',
                    fontSize: '12px', fontFamily: 'Inter, sans-serif',
                  }}>
                    {skill}
                    <button onClick={() => removeSkill(skill)}
                      aria-label={`Remove ${skill} skill`}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7C3AED', opacity: 0.6, padding: '2px 6px', display: 'flex', lineHeight: 1 }}>×</button>
                  </span>
                ))}
                <input
                  type="text" value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={addSkill}
                  placeholder="+ Add skill"
                  aria-label="Add new skill"
                  style={{
                    border: '1px dashed rgba(124,58,237,0.3)', borderRadius: '20px',
                    padding: '3px 10px', fontSize: '12px', color: '#7C3AED',
                    background: 'transparent', outline: 'none', fontFamily: 'Inter, sans-serif',
                    cursor: 'text', minWidth: '80px',
                  }}
                />
              </div>
            </div>

            {/* Footer hint */}
            <p style={{ textAlign: 'center', fontSize: '11px', color: '#aaa', marginTop: '32px', fontFamily: 'Inter, sans-serif' }}>
              Click any field to edit • Enter or click away to save
            </p>
          </div>
        </div>

        {/* ── RIGHT: Score + Suggestions + Actions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: isMobile ? 'visible' : 'auto', order: isMobile ? 1 : 2 }} className="scrollbar-hide">

          {/* Resume Score */}
          <div style={{ ...card, padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '16px' }}>
              Resume Score
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
              <ScoreRing score={score} />
              <div>
                <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>
                  {score}<span style={{ fontSize: '14px', color: 'var(--foreground-muted)', fontWeight: 400 }}>/100</span>
                </p>
                <p style={{ fontSize: '12px', color: 'var(--foreground-muted)', marginTop: '4px' }}>
                  Good — keep improving
                </p>
              </div>
            </div>
            {/* Score bar */}
            <div style={{ height: '4px', borderRadius: '2px', background: 'var(--muted)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${score}%`, borderRadius: '2px',
                background: 'linear-gradient(90deg,#7C3AED,#EC4899)',
                transition: 'width 1s ease',
              }}/>
            </div>
          </div>

          {/* AI Suggestions */}
          <div style={{ ...card, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Sparkles size={15} style={{ color: 'var(--primary)' }}/>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>AI Suggestions</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {AI_SUGGESTIONS.map(({ id, icon: Icon, color, title, sub }) => (
                <div key={id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 12px', borderRadius: '10px',
                  background: 'var(--background)', border: '1px solid var(--border)',
                }}>
                  <Icon size={15} style={{ color, flexShrink: 0, marginTop: '1px' }}/>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>{title}</p>
                    <p style={{ fontSize: '11px', color: 'var(--foreground-muted)', lineHeight: 1.4 }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <button style={{
              width: '100%', marginTop: '12px', padding: '9px',
              borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: 'rgba(124,58,237,0.1)', color: 'var(--primary)',
              fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
              onClick={() => showToast('AI analysis completed. Suggestions updated!')}
            >
              <Sparkles size={13}/> Get More Suggestions
            </button>
          </div>

          {/* Quick Actions */}
          <div style={{ ...card, padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '14px' }}>Quick Actions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { icon: Eye,       label: 'Toggle Preview', color: 'var(--accent)',   bg: 'rgba(6,182,212,0.1)',   action: () => showToast('Preview mode toggled') },
                { icon: RefreshCw, label: 'AI Rewrite',     color: 'var(--secondary)',bg: 'rgba(236,72,153,0.1)',  action: () => showToast('AI rewrite will be available when backend is connected') },
                { icon: Download,  label: 'Download Draft', color: 'var(--success)',  bg: 'rgba(34,197,94,0.1)',   action: () => { showToast('Opening print dialog...'); setTimeout(() => window.print(), 300) } },
              ].map(({ icon: Icon, label, color, bg, action }) => (
                <button key={label} onClick={action} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '11px 14px', borderRadius: '10px', border: '1px solid var(--border)',
                  background: 'var(--background)', cursor: 'pointer', transition: 'all 0.15s', width: '100%',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = color }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--background)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  <Icon size={15} style={{ color, flexShrink: 0 }}/>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
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

export default Resume