import { useState, useRef, useEffect } from 'react'
import {
  Upload, Sparkles, CheckCircle2, AlertCircle,
  Target, Search, Award, Code2, TrendingUp,
  Loader2, Briefcase, ChevronDown, FileText,
  XCircle, Check, BookOpen, UserCircle, Download, X, ArrowRight
} from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

const API_BASE_URL = 'http://localhost:8000'

const Resume = () => {
  const isMobile = useIsMobile()
  const [targetRole, setTargetRole] = useState('Frontend Developer')
  const [supportedDomains, setSupportedDomains] = useState([
    'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'Data Scientist', 'Cloud Engineer', 'DevOps Engineer', 'Product Manager'
  ])
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isRewriting, setIsRewriting] = useState(false)
  const [analysisData, setAnalysisData] = useState(null)
  const [toast, setToast] = useState('')
  const [fileToUpload, setFileToUpload] = useState(null)
  
  // Preview Modal States
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewContent, setPreviewContent] = useState('')

  const importRef = useRef(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  // Fetch supported domains on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/resume/domains`)
      .then(res => res.json())
      .then(data => {
        if (data.domains && data.domains.length > 0) {
          setSupportedDomains(data.domains)
          setTargetRole(data.domains[0])
        }
      })
      .catch(err => console.error('Failed to fetch domains:', err))
  }, [])

  const runAnalysis = async (role, file) => {
    if (!file) return
    setIsAnalyzing(true)
    showToast(`Analyzing ${file.name}...`)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('target_domain', role)

    try {
      const response = await fetch(`${API_BASE_URL}/resume/analyze`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Analysis failed')
      }

      const data = await response.json()
      setAnalysisData(data)
      showToast('Analysis complete!')
    } catch (error) {
      console.error(error)
      showToast(`Error: ${error.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleImport = (e) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      setFileToUpload(file)
      runAnalysis(targetRole, file)
    }
    e.target.value = '' // Reset input
  }

  const handleRewrite = async () => {
    if (!fileToUpload) return
    setIsRewriting(true)
    showToast('Applying AI suggestions... This may take a moment.')

    const formData = new FormData()
    formData.append('file', fileToUpload)
    formData.append('target_domain', targetRole)

    try {
      const response = await fetch(`${API_BASE_URL}/resume/rewrite`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Rewrite failed')
      }

      const markdownText = await response.text()
      
      // Show Preview Modal instead of instant download
      setPreviewContent(markdownText)
      setShowPreviewModal(true)

      showToast('Preview Ready!')
    } catch (error) {
      console.error(error)
      showToast(`Error: ${error.message}`)
    } finally {
      setIsRewriting(false)
    }
  }

  const downloadMarkdown = () => {
    const blob = new Blob([previewContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Improved_Resume_${targetRole.replace(/\s+/g, '_')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('Downloaded successfully!')
    setShowPreviewModal(false)
  }

  const card = {
    background: 'var(--background-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '24px'
  }

  // Helper for Score Ring
  const ScoreRing = ({ score, size = 120, strokeWidth = 10 }) => {
    const r = (size - strokeWidth) / 2
    const circ = 2 * Math.PI * r
    const dash = (score / 100) * circ
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(124,58,237,0.15)" strokeWidth={strokeWidth}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#scoreGradBig)" strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
          <defs>
            <linearGradient id="scoreGradBig" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7C3AED"/>
              <stop offset="100%" stopColor="#EC4899"/>
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: `${size/3.5}px`, fontWeight: 800, color: 'var(--foreground)', lineHeight: 1 }}>{Math.round(score)}</span>
          <span style={{ fontSize: `${size/8}px`, color: 'var(--foreground-muted)' }}>/ 100</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up" style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100%' }}>
      
      {/* ── Header Area ── */}
      <div style={{
        ...card, display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
              AI ATS Analyzer
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--foreground-muted)' }}>
              {fileToUpload ? `Analyzing: ${fileToUpload.name}` : 'Import your resume to get deep AI insights.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', alignItems: isMobile ? 'stretch' : 'center' }}>
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Briefcase size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--foreground-muted)' }} />
            <select
              value={targetRole}
              onChange={(e) => {
                setTargetRole(e.target.value)
                if (fileToUpload) runAnalysis(e.target.value, fileToUpload)
              }}
              disabled={isAnalyzing || isRewriting}
              style={{
                width: '100%', padding: '12px 36px', borderRadius: '12px',
                border: '1px solid var(--border)', background: 'var(--background)',
                color: 'var(--foreground)', fontSize: '14px', fontWeight: 500, appearance: 'none',
                cursor: isAnalyzing ? 'not-allowed' : 'pointer', outline: 'none',
                opacity: isAnalyzing ? 0.7 : 1
              }}
            >
              {supportedDomains.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--foreground-muted)', pointerEvents: 'none' }} />
          </div>

          <input ref={importRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleImport} />
          <button className="btn-primary" disabled={isAnalyzing || isRewriting} style={{ gap: '8px', padding: '12px 24px', opacity: (isAnalyzing || isRewriting) ? 0.7 : 1 }} onClick={() => importRef.current?.click()}>
            {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18}/>} 
            {isAnalyzing ? 'Analyzing...' : 'Import Resume'}
          </button>
        </div>
      </div>

      {/* ── Main Dashboard ── */}
      {!fileToUpload && !isAnalyzing && !analysisData && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 20px', ...card }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(124,58,237,0.05)', border: '1px dashed rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <Upload size={28} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '12px' }}>Upload your resume to begin</h2>
          <p style={{ maxWidth: '500px', fontSize: '14px', color: 'var(--foreground-muted)', lineHeight: 1.6, marginBottom: '32px' }}>
            Our AI-powered ATS analyzer will review your resume against the selected target role, calculate your shortlist probability, and provide actionable feedback on keywords, formatting, and project relevance.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', maxWidth: '800px', width: '100%', textAlign: 'left' }}>
            {[
              { icon: Target, title: 'ATS Compatibility', desc: 'Checks formatting and parsing rules.' },
              { icon: Search, title: 'Keyword Gaps', desc: 'Identifies missing domain skills.' },
              { icon: Sparkles, title: 'AI Narrative', desc: 'Evaluates your overall story.' }
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ padding: '16px', borderRadius: '12px', background: 'var(--background)' }}>
                <Icon size={18} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>{title}</h3>
                <p style={{ fontSize: '12px', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(isAnalyzing || analysisData) && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Hero Card */}
            <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #7C3AED, #EC4899)' }} />
              
              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <ScoreRing score={isAnalyzing ? 0 : analysisData.ats_score} size={140} strokeWidth={12} />
                {isAnalyzing && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background-card)', borderRadius: '50%' }}>
                    <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)' }} />
                  </div>
                )}
              </div>
              
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '8px' }}>
                {isAnalyzing ? 'Calculating Score...' : `${Math.round(analysisData.domain_match_pct)}% Match Rate`}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', background: 'rgba(124,58,237,0.1)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '24px' }}>
                <Target size={16} /> Target: {targetRole}
              </div>

              <div style={{ background: 'var(--background)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'left', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Sparkles size={16} style={{ color: 'var(--secondary)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Gemini AI Narrative</span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--foreground-muted)', lineHeight: 1.6 }}>
                  {isAnalyzing ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Loader2 size={14} className="animate-spin" /> Generating narrative...
                    </span>
                  ) : analysisData.gemini_insights?.ai_summary}
                </p>
              </div>

              {!isAnalyzing && (
                <button
                  onClick={handleRewrite}
                  disabled={isRewriting}
                  style={{
                    marginTop: '24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '14px', borderRadius: '12px', background: 'var(--primary)', color: '#fff',
                    fontSize: '14px', fontWeight: 600, cursor: isRewriting ? 'not-allowed' : 'pointer', border: 'none',
                    opacity: isRewriting ? 0.8 : 1, transition: 'opacity 0.2s'
                  }}
                >
                  {isRewriting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {isRewriting ? 'Rewriting with Gemini AI...' : 'Preview Improved Rewrite'}
                </button>
              )}
            </div>

            {/* Keyword Density */}
            <div style={{ ...card }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={18} style={{ color: 'var(--primary)' }} /> Keyword Analysis
              </h3>
              
              {isAnalyzing ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'var(--foreground-muted)' }}><Loader2 className="animate-spin" /></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={14} /> Keywords Found
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {analysisData.keyword_analysis?.found_keywords?.map(kw => (
                        <span key={kw} style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
                          {kw}
                        </span>
                      ))}
                      {(!analysisData.keyword_analysis?.found_keywords || analysisData.keyword_analysis.found_keywords.length === 0) && (
                        <span style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>None found.</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <XCircle size={14} /> Missing Required Skills
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {analysisData.missing_skills?.map(kw => (
                        <span key={kw} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
                          {kw}
                        </span>
                      ))}
                      {(!analysisData.missing_skills || analysisData.missing_skills.length === 0) && (
                        <span style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>Great! You hit all core domain skills.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Actionable Feedback (Before / After) */}
            <div style={{ ...card, flex: 1 }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} style={{ color: 'var(--secondary)' }} /> Realistic Suggestions
              </h3>
              
              {isAnalyzing ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'var(--foreground-muted)' }}><Loader2 className="animate-spin" /></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {analysisData.gemini_insights?.top_improvements?.map((imp, idx) => (
                    <div key={idx} style={{ padding: '16px', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#ef4444', marginBottom: '4px', letterSpacing: '0.05em' }}>Instead of this</div>
                        <div style={{ fontSize: '14px', color: 'var(--foreground)', textDecoration: 'line-through', opacity: 0.7 }}>
                          "{imp.original_text || imp}"
                        </div>
                      </div>
                      
                      {imp.suggested_text && (
                        <div style={{ marginBottom: '12px', paddingLeft: '12px', borderLeft: '3px solid #22c55e' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#22c55e', marginBottom: '4px', letterSpacing: '0.05em' }}>Do this</div>
                          <div style={{ fontSize: '14px', color: 'var(--foreground)', fontWeight: 500 }}>
                            "{imp.suggested_text}"
                          </div>
                        </div>
                      )}

                      {imp.reasoning && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', background: 'rgba(245,158,11,0.05)', padding: '10px', borderRadius: '8px' }}>
                          <AlertCircle size={14} color="#F59E0B" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', color: 'var(--foreground-muted)', lineHeight: 1.5 }}>{imp.reasoning}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!analysisData.gemini_insights?.top_improvements || analysisData.gemini_insights.top_improvements.length === 0) && (
                    <p style={{ fontSize: '13px', color: 'var(--foreground-muted)' }}>No major phrasing improvements found!</p>
                  )}
                </div>
              )}
            </div>

            {/* ATS Format Breakdown */}
            <div style={{ ...card }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} /> ATS Mechanics Breakdown
              </h3>
              {isAnalyzing ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0', color: 'var(--foreground-muted)' }}><Loader2 className="animate-spin" /></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Keyword Score', value: analysisData.ats_breakdown?.keyword_score },
                    { label: 'Format Score', value: analysisData.ats_breakdown?.format_score },
                    { label: 'Section Completeness', value: analysisData.ats_breakdown?.section_completeness_score },
                    { label: 'Action Verbs Usage', value: analysisData.ats_breakdown?.action_verbs_score }
                  ].map((check, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--background)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '14px', color: 'var(--foreground)' }}>{check.label}</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: (check.value >= 80) ? '#22c55e' : (check.value >= 50) ? '#f59e0b' : '#ef4444' }}>
                        {Math.round(check.value || 0)}/100
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {showPreviewModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
          <div style={{
            background: 'var(--background-card)', width: '100%', maxWidth: '800px', maxHeight: '90vh',
            borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'fadeUp 0.3s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(124,58,237,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)' }}>AI Rewritten Preview</h3>
              </div>
              <button onClick={() => setShowPreviewModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--foreground-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body (Text Content) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--background)', position: 'relative' }}>
              <pre style={{ 
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit',
                fontSize: '14px', color: 'var(--foreground)', lineHeight: 1.7, margin: 0 
              }}>
                {previewContent}
              </pre>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowPreviewModal(false)} 
                style={{ padding: '10px 20px', borderRadius: '10px', background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={downloadMarkdown}
                style={{ padding: '10px 20px', borderRadius: '10px', background: 'var(--primary)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} /> Download Copy (.md)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', background: 'var(--background-card)',
          border: '1px solid var(--primary)', color: 'var(--foreground)', padding: '12px 20px',
          borderRadius: '8px', boxShadow: '0 4px 20px rgba(124, 58, 237, 0.25)', zIndex: 99999,
          display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeUp 0.2s ease-out'
        }}>
          <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>{toast}</span>
        </div>
      )}
    </div>
  )
}

export default Resume