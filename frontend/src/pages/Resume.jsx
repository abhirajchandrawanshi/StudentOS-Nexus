import { useState, useRef } from 'react'
import {
  Download, Upload, Sparkles, CheckCircle, Info,
  ChevronDown, Eye, RefreshCw, Plus, Trash2, Flame
} from 'lucide-react'

// ─── Editable inline field ───────────────────────────────────────────────────
const EditableField = ({ value, onChange, className = '', multiline = false, placeholder = 'Click to edit...' }) => {
  const [editing, setEditing] = useState(false)
  const ref = useRef(null)

  const handleBlur = () => {
    setEditing(false)
    if (ref.current) onChange(ref.current.innerText.trim())
  }

  const handleKeyDown = (e) => {
    if (!multiline && e.key === 'Enter') { e.preventDefault(); ref.current?.blur() }
    if (e.key === 'Escape') ref.current?.blur()
  }

  const Tag = multiline ? 'div' : 'span'

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setEditing(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
      style={{
        outline: 'none',
        borderRadius: '4px',
        padding: editing ? '2px 6px' : '2px 2px',
        border: editing ? '1px dashed var(--accent)' : '1px dashed transparent',
        cursor: 'text',
        minWidth: '40px',
        display: multiline ? 'block' : 'inline',
        whiteSpace: multiline ? 'pre-wrap' : 'normal',
        transition: 'border 0.15s, padding 0.15s',
      }}
      title="Click to edit"
    >
      {value || placeholder}
    </Tag>
  )
}

// ─── Skill tag ───────────────────────────────────────────────────────────────
const SkillTag = ({ skill, onRemove }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '3px 10px', borderRadius: '999px', fontSize: '12px',
    background: 'var(--rp-skill-bg)', color: 'var(--rp-skill-text)',
    border: '1px solid var(--rp-skill-bd)',
  }}>
    {skill}
    <button onClick={() => onRemove(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', opacity: 0.6, display: 'flex', alignItems: 'center' }}>
      ×
    </button>
  </span>
)

// ─── Section header inside resume ────────────────────────────────────────────
const ResumeSection = ({ title }) => (
  <div style={{ marginBottom: '10px', paddingBottom: '4px', borderBottom: '1.5px solid #222' }}>
    <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', color: '#111', textTransform: 'uppercase' }}>{title}</span>
  </div>
)

// ─── AI Suggestion item ──────────────────────────────────────────────────────
const Suggestion = ({ type, title, desc }) => {
  const isOk = type === 'ok'
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '10px 12px', borderRadius: '10px', marginBottom: '8px',
      background: 'var(--rp-card)', border: '1px solid var(--rp-border)',
    }}>
      {isOk
        ? <CheckCircle size={16} style={{ color: '#22c55e', marginTop: '2px', flexShrink: 0 }} />
        : <Info size={16} style={{ color: '#a78bfa', marginTop: '2px', flexShrink: 0 }} />
      }
      <div>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rp-fg)', margin: 0 }}>{title}</p>
        <p style={{ fontSize: '12px', color: 'var(--rp-fg-muted)', margin: '2px 0 0' }}>{desc}</p>
      </div>
    </div>
  )
}

// ─── Quick action button ─────────────────────────────────────────────────────
const QuickAction = ({ icon: Icon, label, onClick }) => (
  <button className="rp-quick-btn" onClick={onClick}>
    <Icon size={15} style={{ color: 'var(--rp-accent)', flexShrink: 0 }} />
    {label}
  </button>
)

// ─── Main Resume Page ─────────────────────────────────────────────────────────
const Resume = () => {

  // ── resume state ──
  const [name, setName] = useState('Alex Johnson')
  const [title, setTitle] = useState('Full Stack Developer')
  const [email, setEmail] = useState('alex.j@email.com')
  const [phone, setPhone] = useState('+1 (555) 123-4567')
  const [linkedin, setLinkedin] = useState('linkedin.com/in/alexj')
  const [summary, setSummary] = useState(
    'Passionate full-stack developer with 3+ years of experience building scalable web applications. Proficient in React, Node.js, and cloud technologies. Strong problem-solving with 450+ LeetCode problems solved.'
  )
  const [skills, setSkills] = useState(['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL'])
  const [newSkill, setNewSkill] = useState('')

  const [experiences, setExperiences] = useState([
    {
      id: 1, role: 'Software Engineer Intern', company: 'Tech Corp Inc.',
      period: 'Jun 2025 – Aug 2025',
      bullets: [
        'Developed microservices using Node.js and Express',
        'Improved API response time by 40% through optimization',
        'Collaborated with team of 5 developers using Agile methodology',
      ],
    },
  ])

  const [education, setEducation] = useState([
    { id: 1, degree: 'B.Tech in Computer Science', institution: 'XYZ University', period: '2022 – 2026', gpa: '8.5/10' },
  ])

  const resumeScore = 85

  // ── skill handlers ──
  const removeSkill = (s) => setSkills(prev => prev.filter(x => x !== s))
  const addSkill = (e) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      setSkills(prev => [...prev, newSkill.trim()])
      setNewSkill('')
    }
  }

  // ── experience bullet handlers ──
  const updateBullet = (expId, idx, val) => {
    setExperiences(prev => prev.map(e =>
      e.id === expId ? { ...e, bullets: e.bullets.map((b, i) => i === idx ? val : b) } : e
    ))
  }
  const addBullet = (expId) => {
    setExperiences(prev => prev.map(e =>
      e.id === expId ? { ...e, bullets: [...e.bullets, 'New achievement here'] } : e
    ))
  }
  const removeBullet = (expId, idx) => {
    setExperiences(prev => prev.map(e =>
      e.id === expId ? { ...e, bullets: e.bullets.filter((_, i) => i !== idx) } : e
    ))
  }
  const addExperience = () => {
    setExperiences(prev => [...prev, {
      id: Date.now(), role: 'New Role', company: 'Company Name',
      period: '2024 – Present', bullets: ['Describe your achievement here'],
    }])
  }
  const removeExperience = (id) => setExperiences(prev => prev.filter(e => e.id !== id))

  // ── score ring ──
  const radius = 28, circ = 2 * Math.PI * radius
  const dash = (resumeScore / 100) * circ

  const PAGE_VARS = {
    '--rp-accent':      '#7C3AED',
    '--rp-accent-soft': 'rgba(124,58,237,0.12)',
    '--rp-card':        'var(--background-card, #1a1a2e)',
    '--rp-border':      'var(--border, rgba(255,255,255,0.08))',
    '--rp-fg':          'var(--foreground, #f1f0f9)',
    '--rp-fg-muted':    'var(--foreground-muted, #9ca3af)',
    '--rp-hover':       'rgba(124,58,237,0.08)',
    '--rp-skill-bg':    'rgba(124,58,237,0.12)',
    '--rp-skill-text':  '#c4b5fd',
    '--rp-skill-bd':    'rgba(124,58,237,0.25)',
  }

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', minHeight: '100%', ...PAGE_VARS }}>

      {/* Scoped styles — use --rp- prefix to avoid collisions */}
      <style>{`
        [contenteditable]:hover { border-color: rgba(124,58,237,0.4) !important; }
        .score-ring { transform: rotate(-90deg); transform-origin: center; }
        .rp-btn-ghost {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 8px; font-size: 13px;
          font-weight: 500; cursor: pointer; transition: all 0.15s;
          border: 1px solid var(--rp-border); background: var(--rp-card);
          color: var(--rp-fg);
        }
        .rp-btn-ghost:hover { background: var(--rp-hover); border-color: var(--rp-accent); }
        .rp-btn-primary {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 8px; font-size: 13px;
          font-weight: 600; cursor: pointer; transition: all 0.15s;
          border: none; background: var(--rp-accent); color: #fff;
        }
        .rp-btn-primary:hover { opacity: 0.9; }
        .rp-quick-btn {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 10px; margin-bottom: 6px;
          background: var(--rp-card); border: 1px solid var(--rp-border);
          color: var(--rp-fg); font-size: 13px; cursor: pointer;
          text-align: left; transition: background 0.15s;
        }
        .rp-quick-btn:hover { background: var(--rp-hover); }
      `}</style>

      <div style={{ display: 'contents' }}>

        {/* ── LEFT: Resume Preview ─────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--rp-fg)', margin: 0 }}>Resume Builder</h1>
              <p style={{ fontSize: '13px', color: 'var(--rp-fg-muted)', margin: '4px 0 0' }}>Create and optimize your resume with AI</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="rp-btn-ghost"><Upload size={14} /> Import</button>
              <button className="rp-btn-primary"><Download size={14} /> Export PDF</button>
            </div>
          </div>

          {/* Resume white card */}
          <div style={{
            background: '#ffffff', borderRadius: '12px', padding: '40px 44px',
            boxShadow: '0 2px 24px rgba(0,0,0,0.25)',
            fontFamily: '"Times New Roman", Georgia, serif',
          }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>
                <EditableField value={name} onChange={setName} />
              </div>
              <div style={{ fontSize: '14px', color: '#444', marginBottom: '10px' }}>
                <EditableField value={title} onChange={setTitle} />
              </div>
              <div style={{ fontSize: '12px', color: '#555', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <EditableField value={email} onChange={setEmail} />
                <span style={{ color: '#999' }}>•</span>
                <EditableField value={phone} onChange={setPhone} />
                <span style={{ color: '#999' }}>•</span>
                <EditableField value={linkedin} onChange={setLinkedin} />
              </div>
            </div>

            {/* Summary */}
            <div style={{ marginBottom: '20px' }}>
              <ResumeSection title="Summary" />
              <div style={{ fontSize: '12px', color: '#333', lineHeight: 1.7 }}>
                <EditableField value={summary} onChange={setSummary} multiline className="" />
              </div>
            </div>

            {/* Experience */}
            <div style={{ marginBottom: '20px' }}>
              <ResumeSection title="Experience" />
              {experiences.map((exp) => (
                <div key={exp.id} style={{ marginBottom: '14px', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>
                        <EditableField value={exp.role} onChange={val => setExperiences(p => p.map(e => e.id === exp.id ? { ...e, role: val } : e))} />
                      </div>
                      <div style={{ fontSize: '12px', color: '#444' }}>
                        <EditableField value={exp.company} onChange={val => setExperiences(p => p.map(e => e.id === exp.id ? { ...e, company: val } : e))} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap' }}>
                        <EditableField value={exp.period} onChange={val => setExperiences(p => p.map(e => e.id === exp.id ? { ...e, period: val } : e))} />
                      </span>
                      <button onClick={() => removeExperience(exp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px', opacity: 0.6, display: 'flex' }} title="Remove">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    {exp.bullets.map((b, i) => (
                      <li key={i} style={{ fontSize: '12px', color: '#333', lineHeight: 1.7, marginBottom: '2px', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                        <span style={{ listStyleType: 'disc', display: 'list-item', flex: 1 }}>
                          <EditableField value={b} onChange={val => updateBullet(exp.id, i, val)} multiline />
                        </span>
                        <button onClick={() => removeBullet(exp.id, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px', opacity: 0, flexShrink: 0, marginTop: '2px' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                        >
                          <Trash2 size={10} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => addBullet(exp.id)} style={{
                    marginTop: '4px', marginLeft: '16px', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: '11px', color: '#7C3AED', display: 'flex', alignItems: 'center', gap: '3px', padding: 0,
                  }}>
                    <Plus size={11} /> Add bullet
                  </button>
                </div>
              ))}
              <button onClick={addExperience} style={{
                marginTop: '4px', background: 'none', border: '1px dashed #7C3AED',
                cursor: 'pointer', fontSize: '12px', color: '#7C3AED',
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '5px 12px', borderRadius: '6px',
              }}>
                <Plus size={13} /> Add experience
              </button>
            </div>

            {/* Education */}
            <div style={{ marginBottom: '20px' }}>
              <ResumeSection title="Education" />
              {education.map((ed) => (
                <div key={ed.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>
                      <EditableField value={ed.degree} onChange={val => setEducation(p => p.map(e => e.id === ed.id ? { ...e, degree: val } : e))} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#444' }}>
                      <EditableField value={ed.institution} onChange={val => setEducation(p => p.map(e => e.id === ed.id ? { ...e, institution: val } : e))} />
                      {' '}• GPA: <EditableField value={ed.gpa} onChange={val => setEducation(p => p.map(e => e.id === ed.id ? { ...e, gpa: val } : e))} />
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap' }}>
                    <EditableField value={ed.period} onChange={val => setEducation(p => p.map(e => e.id === ed.id ? { ...e, period: val } : e))} />
                  </span>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div>
              <ResumeSection title="Skills" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                {skills.map(s => (
                  <SkillTag key={s} skill={s} onRemove={removeSkill} />
                ))}
                <input
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={addSkill}
                  placeholder="+ Add skill"
                  style={{
                    border: '1px dashed rgba(124,58,237,0.4)', background: 'transparent',
                    borderRadius: '999px', padding: '3px 10px', fontSize: '12px',
                    color: '#7C3AED', outline: 'none', width: '90px',
                    cursor: 'text',
                  }}
                />
              </div>
            </div>
          </div>
          {/* end white card */}

          <p style={{ fontSize: '11px', color: 'var(--rp-fg-muted)', marginTop: '8px', textAlign: 'center' }}>
            Click any field to edit • Press Enter or click away to save
          </p>
        </div>

        {/* ── RIGHT: Score + AI Panel ──────────────────────────── */}
        <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Resume Score card */}
          <div style={{
            background: 'var(--rp-card)', border: '1px solid var(--rp-border)',
            borderRadius: '14px', padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '9px',
                background: 'var(--rp-accent-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Flame size={18} style={{ color: 'var(--rp-accent)' }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rp-fg-muted)' }}>Resume Score</span>
            </div>

            {/* Score ring */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(124,58,237,0.12)" strokeWidth="7" />
                  <circle
                    cx="36" cy="36" r={radius} fill="none"
                    stroke="url(#scoreGrad)" strokeWidth="7"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    className="score-ring"
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7C3AED" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--rp-fg)' }}>{resumeScore}</span>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--rp-fg)', margin: 0 }}>
                  {resumeScore}<span style={{ fontSize: '14px', color: 'var(--rp-fg-muted)' }}>/100</span>
                </p>
                <p style={{ fontSize: '12px', color: 'var(--rp-fg-muted)', margin: '2px 0 0' }}>Good — keep improving</p>
              </div>
            </div>

            {/* Score bar */}
            <div style={{ marginTop: '14px', height: '5px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ height: '100%', borderRadius: '999px', width: `${resumeScore}%`, background: 'linear-gradient(90deg,#7C3AED,#EC4899)' }} />
            </div>
          </div>

          {/* AI Suggestions */}
          <div style={{
            background: 'var(--rp-card)', border: '1px solid var(--rp-border)',
            borderRadius: '14px', padding: '18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Sparkles size={16} style={{ color: '#a78bfa' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rp-fg)' }}>AI Suggestions</span>
            </div>

            <Suggestion type="ok" title="Strong action verbs" desc="Good use of impact words" />
            <Suggestion type="warn" title="Add metrics" desc="Quantify your achievements with numbers" />
            <Suggestion type="warn" title="Expand projects section" desc="Add 2–3 key projects" />

            <button style={{
              width: '100%', padding: '9px', borderRadius: '9px', marginTop: '6px',
              background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(236,72,153,0.15))',
              border: '1px solid rgba(124,58,237,0.3)',
              color: '#c4b5fd', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              <Sparkles size={13} /> Get More Suggestions
            </button>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: 'var(--rp-card)', border: '1px solid var(--rp-border)',
            borderRadius: '14px', padding: '18px',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rp-fg)', margin: '0 0 12px' }}>Quick Actions</p>
            <QuickAction icon={Eye} label="Preview Mode" onClick={() => {}} />
            <QuickAction icon={RefreshCw} label="AI Rewrite" onClick={() => {}} />
            <QuickAction icon={ChevronDown} label="Download Draft" onClick={() => {}} />
          </div>

        </div>

      </div>
    </div>
  )
}

export default Resume