import { useState, useRef, useCallback } from 'react'
import {
<<<<<<< HEAD
  Upload, Sparkles, CheckCircle, AlertTriangle, XCircle,
  ChevronDown, Eye, RefreshCw, Plus, Trash2, Flame,
  Download, Target, Zap, TrendingUp, BookOpen, Code2,
  Award, Info, ArrowRight, Loader2, FileText, X,
  BarChart2, Search, Star, AlertCircle,
=======
  Download, Upload, Sparkles, CheckCircle2,
  Clock, AlertCircle, Plus, Trash2, Eye,
  RefreshCw,
>>>>>>> fc462d48ce69bd682d378efa519605f533f2b8e7
} from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

<<<<<<< HEAD
// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const DOMAINS = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'AI/ML Engineer',
  'Data Scientist',
  'DevOps Engineer',
]

const PAGE_VARS = {
  '--rp-accent':       '#7C3AED',
  '--rp-accent-soft':  'rgba(124,58,237,0.12)',
  '--rp-pink':         '#EC4899',
  '--rp-card':         'var(--background-card, #1a1a2e)',
  '--rp-border':       'var(--border, rgba(255,255,255,0.08))',
  '--rp-fg':           'var(--foreground, #f1f0f9)',
  '--rp-fg-muted':     'var(--foreground-muted, #9ca3af)',
  '--rp-hover':        'rgba(124,58,237,0.08)',
  '--rp-skill-bg':     'rgba(124,58,237,0.12)',
  '--rp-skill-text':   '#c4b5fd',
  '--rp-skill-bd':     'rgba(124,58,237,0.25)',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const EditableField = ({ value, onChange, multiline = false, placeholder = 'Click to edit...' }) => {
  const [editing, setEditing] = useState(false)
  const ref = useRef(null)
  const handleBlur = () => { setEditing(false); if (ref.current) onChange(ref.current.innerText.trim()) }
  const handleKeyDown = (e) => { if (!multiline && e.key === 'Enter') { e.preventDefault(); ref.current?.blur() } if (e.key === 'Escape') ref.current?.blur() }
  const Tag = multiline ? 'div' : 'span'
  return (
    <Tag ref={ref} contentEditable suppressContentEditableWarning
      onFocus={() => setEditing(true)} onBlur={handleBlur} onKeyDown={handleKeyDown}
      style={{ outline: 'none', borderRadius: '4px', padding: editing ? '2px 6px' : '2px 2px', border: editing ? '1px dashed #7C3AED' : '1px dashed transparent', cursor: 'text', minWidth: '40px', display: multiline ? 'block' : 'inline', whiteSpace: multiline ? 'pre-wrap' : 'normal', transition: 'border 0.15s' }}
      title="Click to edit"
    >{value || placeholder}</Tag>
  )
}

const SkillTag = ({ skill, onRemove }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', background: 'var(--rp-skill-bg)', color: 'var(--rp-skill-text)', border: '1px solid var(--rp-skill-bd)' }}>
    {skill}
    <button onClick={() => onRemove(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', opacity: 0.6, display: 'flex', alignItems: 'center' }}>×</button>
  </span>
)

const ResumeSection = ({ title }) => (
  <div style={{ marginBottom: '10px', paddingBottom: '4px', borderBottom: '1.5px solid #222' }}>
    <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', color: '#111', textTransform: 'uppercase' }}>{title}</span>
  </div>
)

// ─── Score Ring ───────────────────────────────────────────────────────────────
const ScoreRing = ({ score, size = 80, stroke = 8, color = 'url(#ringSG)', label = '' }) => {
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const dash = (score / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="ringSG" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="ringSG2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(124,58,237,0.12)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size > 70 ? '18px' : '14px', fontWeight: 700, color: 'var(--rp-fg)' }}>{Math.round(score)}</span>
        {label && <span style={{ fontSize: '10px', color: 'var(--rp-fg-muted)', marginTop: '1px' }}>{label}</span>}
      </div>
    </div>
  )
}

// ─── Score Badge ──────────────────────────────────────────────────────────────
const ScoreBadge = ({ score }) => {
  const cfg = score >= 75
    ? { color: '#22C55E', bg: 'rgba(34,197,94,0.12)', bd: 'rgba(34,197,94,0.25)', label: 'Excellent' }
    : score >= 55
    ? { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', bd: 'rgba(245,158,11,0.25)', label: 'Good' }
    : { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  bd: 'rgba(239,68,68,0.25)',  label: 'Needs Work' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.bd}` }}>
      {cfg.label}
    </span>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ value, color = 'linear-gradient(90deg,#7C3AED,#EC4899)', height = 6 }) => (
  <div style={{ height, borderRadius: '999px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
    <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: color, borderRadius: '999px', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
  </div>
)

// ─── Skill Pill (missing skill) ───────────────────────────────────────────────
const MissingSkill = ({ skill }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
    <XCircle size={10} /> {skill}
  </span>
)

const FoundKeyword = ({ kw }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '999px', fontSize: '11px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
    <CheckCircle size={10} /> {kw}
  </span>
)

// ─── Upload Zone ──────────────────────────────────────────────────────────────
const UploadZone = ({ onFile, dragActive, setDragActive }) => {
  const inputRef = useRef(null)
  const handleDrop = (e) => {
    e.preventDefault(); setDragActive(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') onFile(f)
  }
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragActive ? '#7C3AED' : 'rgba(124,58,237,0.3)'}`,
        borderRadius: '16px', padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
        background: dragActive ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.02)',
        transition: 'all 0.2s',
      }}
    >
      <input ref={inputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]) }} />
      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <FileText size={26} style={{ color: '#7C3AED' }} />
      </div>
      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--rp-fg)', marginBottom: '6px' }}>Drop your resume PDF here</p>
      <p style={{ fontSize: '13px', color: 'var(--rp-fg-muted)', marginBottom: '16px' }}>or click to browse • Max 5 MB</p>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 20px', borderRadius: '10px', background: 'rgba(124,58,237,0.15)', color: '#c4b5fd', fontSize: '13px', fontWeight: 500, border: '1px solid rgba(124,58,237,0.3)' }}>
        <Upload size={14} /> Select PDF
      </span>
    </div>
  )
}

// ─── Analysis Results Panel ───────────────────────────────────────────────────
const AnalysisResults = ({ data, onReset }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const card = { background: 'var(--rp-card)', border: '1px solid var(--rp-border)', borderRadius: '14px' }
  const tabs = [
    { id: 'overview',  label: 'Overview',   icon: BarChart2 },
    { id: 'skills',    label: 'Skills',     icon: Code2 },
    { id: 'projects',  label: 'Projects',   icon: Star },
    { id: 'ai',        label: 'AI Insights',icon: Sparkles },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--rp-fg)', margin: 0 }}>Analysis Complete</h2>
          <p style={{ fontSize: '13px', color: 'var(--rp-fg-muted)', marginTop: '4px' }}>
            {data.filename} • {data.target_domain}
          </p>
        </div>
        <button onClick={onReset} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '9px', border: '1px solid var(--rp-border)', background: 'var(--rp-card)', color: 'var(--rp-fg-muted)', fontSize: '13px', cursor: 'pointer' }}>
          <RefreshCw size={13} /> Analyse Again
        </button>
      </div>

      {/* ── Score Cards Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {[
          { label: 'ATS Score',        score: data.ats_score,                color: 'url(#ringSG)',  icon: Target,    iconCol: '#7C3AED' },
          { label: 'Domain Match',     score: data.domain_match_pct,         color: 'url(#ringSG)',  icon: Award,     iconCol: '#EC4899' },
          { label: 'Placement Ready',  score: data.placement_readiness_score, color: 'url(#ringSG2)', icon: TrendingUp, iconCol: '#22C55E' },
        ].map(({ label, score, color, icon: Icon, iconCol }) => (
          <div key={label} style={{ ...card, padding: '20px', textAlign: 'center' }}>
            <ScoreRing score={score} size={72} stroke={7} color={color} />
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rp-fg)', marginTop: '12px', marginBottom: '6px' }}>{label}</p>
            <ScoreBadge score={score} />
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '8px 10px', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            border: 'none', transition: 'all 0.15s',
            background: activeTab === id ? 'var(--rp-card)' : 'transparent',
            color: activeTab === id ? 'var(--rp-accent)' : 'var(--rp-fg-muted)',
            boxShadow: activeTab === id ? '0 1px 6px rgba(0,0,0,0.2)' : 'none',
          }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}

      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* ATS Breakdown */}
          <div style={{ ...card, padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rp-fg)', marginBottom: '16px' }}>ATS Score Breakdown</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Keyword Match',       value: data.ats_breakdown?.keyword_score || 0 },
                { label: 'Formatting',          value: data.ats_breakdown?.format_score || 0 },
                { label: 'Length',              value: data.ats_breakdown?.length_score || 0 },
                { label: 'Section Completeness',value: data.ats_breakdown?.section_completeness_score || 0 },
                { label: 'Action Verbs',        value: data.ats_breakdown?.action_verbs_score || 0 },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--rp-fg-muted)' }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rp-fg)' }}>{Math.round(value)}</span>
                  </div>
                  <ProgressBar value={value} />
                </div>
              ))}
            </div>
          </div>

          {/* Weak Sections & Formatting */}
          {(data.weak_sections?.length > 0 || data.formatting_suggestions?.length > 0) && (
            <div style={{ ...card, padding: '20px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rp-fg)', marginBottom: '14px' }}>Issues to Address</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.weak_sections?.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <AlertTriangle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
                    <span style={{ fontSize: '13px', color: 'var(--rp-fg)' }}>{s}</span>
                  </div>
                ))}
                {data.formatting_suggestions?.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <Info size={15} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
                    <span style={{ fontSize: '13px', color: 'var(--rp-fg)' }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parsed Info */}
          <div style={{ ...card, padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rp-fg)', marginBottom: '14px' }}>Parsed Resume Info</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Pages',        val: data.parsed?.page_count || '—' },
                { label: 'Word Count',   val: data.parsed?.word_count || '—' },
                { label: 'Email',        val: data.parsed?.email_found ? '✓ Found' : '✗ Missing', color: data.parsed?.email_found ? '#22c55e' : '#ef4444' },
                { label: 'Phone',        val: data.parsed?.phone_found ? '✓ Found' : '✗ Missing', color: data.parsed?.phone_found ? '#22c55e' : '#ef4444' },
                { label: 'LinkedIn',     val: data.parsed?.linkedin_found ? '✓ Found' : '✗ Missing', color: data.parsed?.linkedin_found ? '#22c55e' : '#ef4444' },
                { label: 'GitHub',       val: data.parsed?.github_found ? '✓ Found' : '✗ Missing', color: data.parsed?.github_found ? '#22c55e' : '#ef4444' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ padding: '10px 12px', borderRadius: '9px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--rp-border)' }}>
                  <p style={{ fontSize: '11px', color: 'var(--rp-fg-muted)', marginBottom: '4px' }}>{label}</p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: color || 'var(--rp-fg)' }}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Keyword Density */}
          <div style={{ ...card, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rp-fg)' }}>Keyword Density</p>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#7C3AED' }}>
                {Math.round((data.keyword_analysis?.keyword_density || 0) * 100)}%
              </span>
            </div>
            <ProgressBar value={(data.keyword_analysis?.keyword_density || 0) * 100} />
            <p style={{ fontSize: '12px', color: 'var(--rp-fg-muted)', marginTop: '8px' }}>
              {data.keyword_analysis?.found_keywords?.length || 0} of {
                (data.keyword_analysis?.found_keywords?.length || 0) + (data.keyword_analysis?.missing_keywords?.length || 0)
              } domain keywords matched
            </p>
          </div>

          {/* Top Matched Keywords */}
          {data.keyword_analysis?.top_matched?.length > 0 && (
            <div style={{ ...card, padding: '20px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rp-fg)', marginBottom: '12px' }}>Top Matched Keywords</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {data.keyword_analysis.top_matched.map(kw => <FoundKeyword key={kw} kw={kw} />)}
              </div>
            </div>
          )}

          {/* Missing Skills */}
          {data.missing_skills?.length > 0 && (
            <div style={{ ...card, padding: '20px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rp-fg)', marginBottom: '6px' }}>Missing Skills</p>
              <p style={{ fontSize: '12px', color: 'var(--rp-fg-muted)', marginBottom: '12px' }}>
                Add these to your resume to improve your domain match score.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {data.missing_skills.slice(0, 20).map(s => <MissingSkill key={s} skill={s} />)}
              </div>
            </div>
          )}

          {/* Extracted Skills */}
          {data.parsed?.skills?.length > 0 && (
            <div style={{ ...card, padding: '20px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rp-fg)', marginBottom: '12px' }}>Extracted Skills ({data.parsed.skills.length})</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {data.parsed.skills.map(s => (
                  <span key={s} style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', background: 'rgba(124,58,237,0.1)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.2)' }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'projects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.project_relevance?.length === 0 && (
            <div style={{ ...card, padding: '32px', textAlign: 'center' }}>
              <BookOpen size={32} style={{ color: 'var(--rp-fg-muted)', marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', color: 'var(--rp-fg-muted)' }}>No projects detected in your resume.</p>
              <p style={{ fontSize: '12px', color: 'var(--rp-fg-muted)', marginTop: '6px' }}>Add a Projects section to your resume for project relevance scoring.</p>
            </div>
          )}
          {data.project_relevance?.map((proj, i) => (
            <div key={i} style={{ ...card, padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Code2 size={16} style={{ color: '#7C3AED' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rp-fg)', margin: 0 }}>{proj.project_name}</p>
                    {proj.matched_technologies?.length > 0 && (
                      <p style={{ fontSize: '11px', color: '#7C3AED', marginTop: '2px' }}>
                        Matched: {proj.matched_technologies.slice(0, 5).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <ScoreRing score={proj.relevance_score * 100} size={52} stroke={5} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--rp-fg-muted)', lineHeight: 1.6 }}>{proj.reasoning}</p>
              <div style={{ marginTop: '10px' }}>
                <ProgressBar value={proj.relevance_score * 100}
                  color={proj.relevance_score >= 0.7 ? 'linear-gradient(90deg,#22C55E,#06B6D4)' :
                    proj.relevance_score >= 0.4 ? 'linear-gradient(90deg,#F59E0B,#EC4899)' :
                    'linear-gradient(90deg,#EF4444,#F59E0B)'} />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'ai' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* AI Summary */}
          {data.gemini_insights?.ai_summary && (
            <div style={{ ...card, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg,#7C3AED,#EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={15} color="#fff" />
                </div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rp-fg)' }}>Gemini AI Analysis</p>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--rp-fg-muted)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {data.gemini_insights.ai_summary}
              </p>
            </div>
          )}

          {/* Strengths */}
          {data.gemini_insights?.top_strengths?.length > 0 && (
            <div style={{ ...card, padding: '20px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#22c55e', marginBottom: '12px' }}>✓ Top Strengths</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.gemini_insights.top_strengths.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <CheckCircle size={15} style={{ color: '#22c55e', flexShrink: 0, marginTop: '1px' }} />
                    <span style={{ fontSize: '13px', color: 'var(--rp-fg)', lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvements */}
          {data.gemini_insights?.top_improvements?.length > 0 && (
            <div style={{ ...card, padding: '20px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#f59e0b', marginBottom: '12px' }}>⚡ Top Improvements</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.gemini_insights.top_improvements.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <AlertCircle size={15} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
                    <span style={{ fontSize: '13px', color: 'var(--rp-fg)', lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Holistic Score */}
          <div style={{ ...card, padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <ScoreRing score={data.gemini_insights?.gemini_holistic_score || 0} size={72} stroke={7} color="url(#ringSG2)" label="AI Score" />
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rp-fg)', marginBottom: '4px' }}>Gemini Holistic Score</p>
              <p style={{ fontSize: '12px', color: 'var(--rp-fg-muted)', lineHeight: 1.6 }}>
                AI's overall placement readiness estimate, factoring in all dimensions of your resume quality.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Resume Page ─────────────────────────────────────────────────────────
const Resume = () => {
  const [activePageTab, setActivePageTab] = useState('builder') // 'builder' | 'analyzer'

  // ── Builder state ────────────────────────────────────────────────────────────
  const [name, setName]         = useState('Alex Johnson')
  const [title, setTitle]       = useState('Full Stack Developer')
  const [email, setEmail]       = useState('alex.j@email.com')
  const [phone, setPhone]       = useState('+1 (555) 123-4567')
  const [linkedin, setLinkedin] = useState('linkedin.com/in/alexj')
  const [summary, setSummary]   = useState('Passionate full-stack developer with 3+ years of experience building scalable web applications. Proficient in React, Node.js, and cloud technologies.')
  const [skills, setSkills]     = useState(['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL'])
  const [newSkill, setNewSkill] = useState('')
  const [experiences, setExperiences] = useState([{
    id: 1, role: 'Software Engineer Intern', company: 'Tech Corp Inc.', period: 'Jun 2025 – Aug 2025',
    bullets: ['Developed microservices using Node.js and Express', 'Improved API response time by 40% through optimization'],
  }])
  const [education, setEducation] = useState([
    { id: 1, degree: 'B.Tech in Computer Science', institution: 'XYZ University', period: '2022 – 2026', gpa: '8.5/10' },
  ])

  const removeSkill   = (s) => setSkills(prev => prev.filter(x => x !== s))
  const addSkill      = (e) => { if (e.key === 'Enter' && newSkill.trim()) { setSkills(p => [...p, newSkill.trim()]); setNewSkill('') } }
  const addBullet     = (id) => setExperiences(p => p.map(e => e.id === id ? { ...e, bullets: [...e.bullets, 'New achievement here'] } : e))
  const removeBullet  = (id, i) => setExperiences(p => p.map(e => e.id === id ? { ...e, bullets: e.bullets.filter((_, j) => j !== i) } : e))
  const updateBullet  = (id, i, val) => setExperiences(p => p.map(e => e.id === id ? { ...e, bullets: e.bullets.map((b, j) => j === i ? val : b) } : e))
  const addExperience = () => setExperiences(p => [...p, { id: Date.now(), role: 'New Role', company: 'Company Name', period: '2024 – Present', bullets: ['Describe your achievement'] }])
  const removeExperience = (id) => setExperiences(p => p.filter(e => e.id !== id))

  const builderScore = Math.min(60 + skills.length * 2 + experiences.length * 5, 100)
  const radius = 28, circ = 2 * Math.PI * radius, dash = (builderScore / 100) * circ

  // ── Analyzer state ───────────────────────────────────────────────────────────
  const [dragActive,     setDragActive]     = useState(false)
  const [selectedFile,   setSelectedFile]   = useState(null)
  const [selectedDomain, setSelectedDomain] = useState('Backend Developer')
  const [analyzing,      setAnalyzing]      = useState(false)
  const [analysisData,   setAnalysisData]   = useState(null)
  const [apiError,       setApiError]       = useState(null)

  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file)
    setAnalysisData(null)
    setApiError(null)
  }, [])

  const handleAnalyze = async () => {
    if (!selectedFile) return
    setAnalyzing(true)
    setApiError(null)
    setAnalysisData(null)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('target_domain', selectedDomain)

    try {
      const res = await fetch(`${API_BASE}/resume/analyze`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
        throw new Error(err.detail || `Server error ${res.status}`)
      }
      const data = await res.json()
      setAnalysisData(data)
    } catch (err) {
      setApiError(err.message || 'Failed to reach the backend. Make sure uvicorn is running.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setAnalysisData(null)
    setApiError(null)
  }

  // ── Page Tabs ────────────────────────────────────────────────────────────────
  const pageTabs = [
    { id: 'builder',  label: 'Resume Builder', icon: FileText },
    { id: 'analyzer', label: 'AI Analyser',    icon: Sparkles },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100%', ...PAGE_VARS }}>

      <style>{`
        [contenteditable]:hover { border-color: rgba(124,58,237,0.4) !important; }
        .score-ring { transform: rotate(-90deg); transform-origin: center; }
        .rp-btn-ghost { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; border: 1px solid var(--rp-border); background: var(--rp-card); color: var(--rp-fg); }
        .rp-btn-ghost:hover { background: var(--rp-hover); border-color: var(--rp-accent); }
        .rp-btn-primary { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; border: none; background: var(--rp-accent); color: #fff; }
        .rp-btn-primary:hover { opacity: 0.9; }
        .rp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .domain-select { appearance: none; -webkit-appearance: none; background: var(--rp-card); border: 1px solid var(--rp-border); color: var(--rp-fg); padding: 10px 36px 10px 14px; border-radius: 10px; font-size: 14px; font-family: inherit; cursor: pointer; width: 100%; outline: none; transition: border-color 0.15s; }
        .domain-select:focus { border-color: #7C3AED; }
        .domain-select:hover { border-color: rgba(124,58,237,0.5); }
        @keyframes analyzeGlow { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0)} 50%{box-shadow:0 0 20px 4px rgba(124,58,237,0.3)} }
        .analyzing-card { animation: analyzeGlow 1.8s ease-in-out infinite; }
      `}</style>

      {/* ── Page Header + Tabs ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--rp-fg)', margin: 0 }}>Resume</h1>
            <p style={{ fontSize: '13px', color: 'var(--rp-fg-muted)', marginTop: '4px' }}>Build, optimize, and analyse your resume with AI</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
          {pageTabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActivePageTab(id)} style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 20px', borderRadius: '9px', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: activePageTab === id ? 'var(--rp-card)' : 'transparent',
              color: activePageTab === id ? 'var(--rp-accent)' : 'var(--rp-fg-muted)',
              boxShadow: activePageTab === id ? '0 1px 8px rgba(0,0,0,0.25)' : 'none',
            }}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          BUILDER TAB
      ══════════════════════════════════════════════════════ */}
      {activePageTab === 'builder' && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* Left: Resume white card */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'flex-end' }}>
              <button className="rp-btn-ghost"><Upload size={14} /> Import</button>
              <button className="rp-btn-primary"><Download size={14} /> Export PDF</button>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '40px 44px', boxShadow: '0 2px 24px rgba(0,0,0,0.25)', fontFamily: '"Times New Roman", Georgia, serif' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#111', marginBottom: '4px' }}><EditableField value={name} onChange={setName} /></div>
                <div style={{ fontSize: '14px', color: '#444', marginBottom: '10px' }}><EditableField value={title} onChange={setTitle} /></div>
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
                <div style={{ fontSize: '12px', color: '#333', lineHeight: 1.7 }}><EditableField value={summary} onChange={setSummary} multiline /></div>
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
                        <button onClick={() => removeExperience(exp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px', opacity: 0.6, display: 'flex' }} title="Remove"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                      {exp.bullets.map((b, i) => (
                        <li key={i} style={{ fontSize: '12px', color: '#333', lineHeight: 1.7, marginBottom: '2px', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                          <span style={{ listStyleType: 'disc', display: 'list-item', flex: 1 }}>
                            <EditableField value={b} onChange={val => updateBullet(exp.id, i, val)} multiline />
                          </span>
                          <button onClick={() => removeBullet(exp.id, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px', opacity: 0, flexShrink: 0 }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                            <Trash2 size={10} />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => addBullet(exp.id)} style={{ marginTop: '4px', marginLeft: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#7C3AED', display: 'flex', alignItems: 'center', gap: '3px', padding: 0 }}>
                      <Plus size={11} /> Add bullet
                    </button>
                  </div>
                ))}
                <button onClick={addExperience} style={{ marginTop: '4px', background: 'none', border: '1px dashed #7C3AED', cursor: 'pointer', fontSize: '12px', color: '#7C3AED', display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '6px' }}>
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
                  {skills.map(s => <SkillTag key={s} skill={s} onRemove={removeSkill} />)}
                  <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={addSkill} placeholder="+ Add skill"
                    style={{ border: '1px dashed rgba(124,58,237,0.4)', background: 'transparent', borderRadius: '999px', padding: '3px 10px', fontSize: '12px', color: '#7C3AED', outline: 'none', width: '90px', cursor: 'text' }} />
                </div>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--rp-fg-muted)', marginTop: '8px', textAlign: 'center' }}>Click any field to edit • Press Enter or click away to save</p>
          </div>

          {/* Right: Score + AI Panel */}
          <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Score card */}
            <div style={{ background: 'var(--rp-card)', border: '1px solid var(--rp-border)', borderRadius: '14px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'var(--rp-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flame size={18} style={{ color: 'var(--rp-accent)' }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rp-fg-muted)' }}>Resume Score</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(124,58,237,0.12)" strokeWidth="7" />
                    <circle cx="36" cy="36" r={radius} fill="none" stroke="url(#scoreGrad)" strokeWidth="7"
                      strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" className="score-ring" />
                    <defs>
                      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7C3AED" /><stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--rp-fg)' }}>{builderScore}</span>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--rp-fg)', margin: 0 }}>{builderScore}<span style={{ fontSize: '14px', color: 'var(--rp-fg-muted)' }}>/100</span></p>
                  <p style={{ fontSize: '12px', color: 'var(--rp-fg-muted)', margin: '2px 0 0' }}>
                    {builderScore >= 80 ? 'Excellent — ready to send!' : builderScore >= 65 ? 'Good — keep improving' : 'Needs more content'}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: '14px', height: '5px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ height: '100%', borderRadius: '999px', width: `${builderScore}%`, background: 'linear-gradient(90deg,#7C3AED,#EC4899)', transition: 'width 0.5s' }} />
              </div>
            </div>

            {/* Tips */}
            <div style={{ background: 'var(--rp-card)', border: '1px solid var(--rp-border)', borderRadius: '14px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Sparkles size={16} style={{ color: '#a78bfa' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rp-fg)' }}>Quick Tips</span>
              </div>
              {[
                { ok: skills.length >= 8, title: 'Skills section', desc: skills.length >= 8 ? 'Great! 8+ skills listed' : `Add ${8 - skills.length} more skills` },
                { ok: experiences.length >= 2, title: 'Experience', desc: experiences.length >= 2 ? 'Multiple entries ✓' : 'Add at least 2 experiences' },
                { ok: summary.length > 80, title: 'Summary', desc: summary.length > 80 ? 'Summary is detailed ✓' : 'Expand your summary' },
              ].map(({ ok, title, desc }) => (
                <div key={title} style={{ display: 'flex', gap: '10px', padding: '10px 12px', borderRadius: '10px', marginBottom: '8px', background: 'var(--rp-card)', border: '1px solid var(--rp-border)' }}>
                  {ok ? <CheckCircle size={16} style={{ color: '#22c55e', marginTop: '2px', flexShrink: 0 }} /> : <Info size={16} style={{ color: '#a78bfa', marginTop: '2px', flexShrink: 0 }} />}
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rp-fg)', margin: 0 }}>{title}</p>
                    <p style={{ fontSize: '12px', color: 'var(--rp-fg-muted)', margin: '2px 0 0' }}>{desc}</p>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setActivePageTab('analyzer')}
                style={{ width: '100%', padding: '9px', borderRadius: '9px', marginTop: '6px', background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(236,72,153,0.15))', border: '1px solid rgba(124,58,237,0.3)', color: '#c4b5fd', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Sparkles size={13} /> Deep AI Analysis →
=======
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
>>>>>>> fc462d48ce69bd682d378efa519605f533f2b8e7
              </button>
            </div>
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* ══════════════════════════════════════════════════════
          AI ANALYSER TAB
      ══════════════════════════════════════════════════════ */}
      {activePageTab === 'analyzer' && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* Left: Upload + Domain Selection */}
          <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Upload card */}
            <div style={{ background: 'var(--rp-card)', border: '1px solid var(--rp-border)', borderRadius: '16px', padding: '20px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rp-fg)', marginBottom: '14px' }}>
                <Upload size={14} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                Upload Resume PDF
              </p>

              {!selectedFile ? (
                <UploadZone onFile={handleFileSelect} dragActive={dragActive} setDragActive={setDragActive} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={20} style={{ color: '#7C3AED' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rp-fg)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</p>
                    <p style={{ fontSize: '11px', color: 'var(--rp-fg-muted)', marginTop: '2px' }}>{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={() => { setSelectedFile(null); setAnalysisData(null); setApiError(null) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rp-fg-muted)', display: 'flex', padding: '4px' }}>
                    <X size={16} />
                  </button>
=======
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
>>>>>>> fc462d48ce69bd682d378efa519605f533f2b8e7
                </div>
              )}
            </div>

<<<<<<< HEAD
            {/* Domain Selection */}
            <div style={{ background: 'var(--rp-card)', border: '1px solid var(--rp-border)', borderRadius: '16px', padding: '20px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--rp-fg)', marginBottom: '12px' }}>
                <Target size={14} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                Target Domain
              </p>
              <div style={{ position: 'relative' }}>
                <select className="domain-select" value={selectedDomain} onChange={e => setSelectedDomain(e.target.value)}>
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--rp-fg-muted)', pointerEvents: 'none' }} />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--rp-fg-muted)', marginTop: '8px' }}>
                We'll compare your resume against {selectedDomain} skill requirements
              </p>
            </div>

            {/* Analyse Button */}
            <button
              onClick={handleAnalyze}
              disabled={!selectedFile || analyzing}
              className="rp-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', borderRadius: '12px', opacity: (!selectedFile || analyzing) ? 0.6 : 1 }}
            >
              {analyzing
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analysing...</>
                : <><Sparkles size={16} /> Analyse with AI</>
              }
=======
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
>>>>>>> fc462d48ce69bd682d378efa519605f533f2b8e7
            </button>

            {/* What we analyse */}
            {!analysisData && (
              <div style={{ background: 'var(--rp-card)', border: '1px solid var(--rp-border)', borderRadius: '16px', padding: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rp-fg)', marginBottom: '12px' }}>What we analyse</p>
                {[
                  { icon: Target,    label: 'ATS Compatibility Score' },
                  { icon: Search,    label: 'Keyword Density Analysis' },
                  { icon: Award,     label: 'Domain Skill Gap' },
                  { icon: Code2,     label: 'Project Relevance (AI)' },
                  { icon: Sparkles,  label: 'Gemini AI Narrative' },
                  { icon: TrendingUp,label: 'Placement Readiness Score' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={13} style={{ color: '#7C3AED' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--rp-fg-muted)' }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

<<<<<<< HEAD
          {/* Right: Results panel */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Error */}
            {apiError && (
              <div style={{ display: 'flex', gap: '12px', padding: '16px 18px', borderRadius: '14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '16px' }}>
                <XCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444', margin: 0 }}>Analysis Failed</p>
                  <p style={{ fontSize: '13px', color: 'var(--rp-fg-muted)', marginTop: '4px' }}>{apiError}</p>
                  <p style={{ fontSize: '12px', color: 'var(--rp-fg-muted)', marginTop: '8px' }}>
                    Make sure the backend is running: <code style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '4px' }}>uvicorn app.main:app --reload</code>
                  </p>
                </div>
              </div>
            )}

            {/* Loading state */}
            {analyzing && (
              <div className="analyzing-card" style={{ background: 'var(--rp-card)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '16px', padding: '48px 32px', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg,#7C3AED,#EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Sparkles size={28} color="#fff" />
                </div>
                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--rp-fg)', marginBottom: '8px' }}>Analysing your resume...</p>
                <p style={{ fontSize: '13px', color: 'var(--rp-fg-muted)', marginBottom: '24px' }}>
                  Extracting sections → Scoring ATS → Semantic similarity → Gemini AI insights
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {['Parsing PDF', 'Skill Gap', 'ATS Score', 'AI Analysis'].map((step, i) => (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                      <Loader2 size={11} style={{ color: '#7C3AED', animation: `spin 1.2s linear ${i * 0.2}s infinite` }} />
                      <span style={{ fontSize: '11px', color: '#c4b5fd' }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!analyzing && !analysisData && !apiError && (
              <div style={{ background: 'var(--rp-card)', border: '1px solid var(--rp-border)', borderRadius: '16px', padding: '64px 32px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(236,72,153,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <Sparkles size={36} style={{ color: '#7C3AED' }} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--rp-fg)', marginBottom: '10px' }}>AI Resume Analyser</h2>
                <p style={{ fontSize: '14px', color: 'var(--rp-fg-muted)', maxWidth: '420px', margin: '0 auto 28px', lineHeight: 1.7 }}>
                  Upload your resume PDF, select a target domain, and get a deep analysis with ATS score, domain match, missing skills, project relevance, and Gemini AI insights.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', maxWidth: '480px', margin: '0 auto' }}>
                  {[
                    { icon: Target,    label: 'ATS Score',        color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
                    { icon: Award,     label: 'Domain Match',     color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
                    { icon: TrendingUp,label: 'Readiness Score',  color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
                  ].map(({ icon: Icon, label, color, bg }) => (
                    <div key={label} style={{ padding: '16px', borderRadius: '12px', background: bg, border: `1px solid ${color}30`, textAlign: 'center' }}>
                      <Icon size={22} style={{ color, marginBottom: '8px' }} />
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--rp-fg)' }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {analysisData && !analyzing && <AnalysisResults data={analysisData} onReset={handleReset} />}
          </div>
        </div>
=======
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
>>>>>>> fc462d48ce69bd682d378efa519605f533f2b8e7
      )}
    </div>
  )
}

export default Resume