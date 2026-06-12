import { useState } from 'react'
import {
  Sparkles, Code2, BookOpen, Video, FileText,
  ExternalLink, ChevronRight, Target, TrendingUp,
  Brain, Filter, RefreshCw, CheckCircle2,
} from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

const PRIORITY_STYLE = {
  High:   { bg:'rgba(239,68,68,0.12)',  color:'#ef4444', border:'rgba(239,68,68,0.25)' },
  Medium: { bg:'rgba(245,158,11,0.12)', color:'#F59E0B', border:'rgba(245,158,11,0.25)' },
  Low:    { bg:'rgba(34,197,94,0.12)',  color:'#22C55E', border:'rgba(34,197,94,0.25)' },
}
const CAT_STYLE = {
  DSA:      { bg:'rgba(124,58,237,0.12)', color:'#a78bfa', border:'rgba(124,58,237,0.25)' },
  Interview:{ bg:'rgba(6,182,212,0.12)',  color:'#06B6D4', border:'rgba(6,182,212,0.25)' },
  Career:   { bg:'rgba(236,72,153,0.12)', color:'#EC4899', border:'rgba(236,72,153,0.25)' },
  System:   { bg:'rgba(34,197,94,0.12)',  color:'#22C55E', border:'rgba(34,197,94,0.25)' },
}

const ACTIONS = [
  { icon:Code2,    iconBg:'rgba(124,58,237,0.15)', iconColor:'#7C3AED', title:'Master Dynamic Programming',       desc:"You've solved 24 DP problems. Focus on advanced patterns to reach expert level.", priority:'High',   category:'DSA',      progress:68, progressColor:'linear-gradient(90deg,#7C3AED,#06B6D4)' },
  { icon:BookOpen, iconBg:'rgba(6,182,212,0.15)',  iconColor:'#06B6D4', title:'System Design Fundamentals',       desc:'Strengthen your system design skills for senior role interviews.',               priority:'Medium', category:'Interview', progress:45, progressColor:'linear-gradient(90deg,#EC4899,#7C3AED)' },
  { icon:FileText, iconBg:'rgba(236,72,153,0.15)', iconColor:'#EC4899', title:'Update Resume with Latest Projects',desc:'Add your recent full-stack project to showcase modern tech stack.',              priority:'High',   category:'Career' },
  { icon:Brain,    iconBg:'rgba(34,197,94,0.15)',  iconColor:'#22C55E', title:'Practice Behavioral Questions',    desc:'Prepare STAR method responses for common behavioral interview questions.',        priority:'Medium', category:'Interview', progress:30, progressColor:'#22C55E' },
]

const RESOURCES = [
  { icon:Code2,    iconBg:'rgba(124,58,237,0.15)', iconColor:'#7C3AED', title:'Blind 75 LeetCode Questions',   type:'Problem Set',  duration:'2–3 weeks', level:'Medium' },
  { icon:BookOpen, iconBg:'rgba(6,182,212,0.15)',  iconColor:'#06B6D4', title:'System Design Interview Guide', type:'Course',       duration:'4 hours',   level:'Advanced' },
  { icon:Video,    iconBg:'rgba(236,72,153,0.15)', iconColor:'#EC4899', title:'JavaScript Deep Dive',          type:'Video Series', duration:'6 hours',   level:'Intermediate' },
]

const SKILLS = [
  { label:'Dynamic Programming',   value:68, color:'#7C3AED' },
  { label:'System Design',          value:45, color:'#EC4899' },
  { label:'Behavioral Interviews',  value:30, color:'#22C55E' },
  { label:'Data Structures',        value:82, color:'#06B6D4' },
  { label:'Algorithms',             value:74, color:'#F59E0B' },
]

const ActionCard = ({ icon:Icon, iconBg, iconColor, title, desc, priority, category, progress, progressColor, showToast }) => {
  const [hovered, setHovered] = useState(false)
  const ps = PRIORITY_STYLE[priority] || PRIORITY_STYLE.Low
  const cs = CAT_STYLE[category] || CAT_STYLE.DSA
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'linear-gradient(135deg,rgba(124,58,237,0.07),rgba(236,72,153,0.03))' : 'var(--background-card)',
        border: `1px solid ${hovered ? 'rgba(124,58,237,0.45)' : 'var(--border)'}`,
        borderRadius:16, padding:'20px 22px',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition:'all 0.18s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14, gap:8, flexWrap:'wrap' }}>
        <div style={{ width:36, height:36, borderRadius:10, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={17} style={{ color:iconColor }}/>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20, background:ps.bg, color:ps.color, border:`1px solid ${ps.border}` }}>{priority} Priority</span>
          <span style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20, background:cs.bg, color:cs.color, border:`1px solid ${cs.border}` }}>{category}</span>
        </div>
      </div>
      <p style={{ fontSize:15, fontWeight:700, color:'var(--foreground)', margin:'0 0 6px' }}>{title}</p>
      <p style={{ fontSize:13, color:'var(--foreground-muted)', margin:'0 0 14px', lineHeight:1.6 }}>{desc}</p>
      {progress !== undefined && (
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:12, color:'var(--foreground-muted)' }}>Progress</span>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--foreground)' }}>{progress}%</span>
          </div>
          <div style={{ height:5, borderRadius:999, background:'var(--muted)', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:999, width:`${progress}%`, background:progressColor, transition:'width .6s ease' }}/>
          </div>
        </div>
      )}
      <button 
        onClick={() => showToast(`Starting recommendation: "${title}"`)}
        style={{
          background:'rgba(124,58,237,0.08)', border:'1px solid var(--border)', cursor:'pointer',
          display:'inline-flex', alignItems:'center', gap:6,
          fontSize:13, fontWeight:600, padding:'6px 14px', borderRadius:'8px',
          color: hovered ? 'var(--primary)' : 'var(--foreground-muted)',
          transition:'all 0.15s',
        }}
      >
        Start Now <ExternalLink size={13}/>
      </button>
    </div>
  )
}

const ResourceCard = ({ icon:Icon, iconBg, iconColor, title, type, duration, level, showToast }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => showToast(`Opening resource: "${title}"`)}
      style={{
        background:'var(--background-card)',
        border:`1px solid ${hovered ? 'rgba(124,58,237,0.45)' : 'var(--border)'}`,
        borderRadius:16, padding:'18px 20px',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition:'all 0.18s', cursor:'pointer',
      }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={17} style={{ color:iconColor }}/>
        </div>
        <ExternalLink size={14} style={{ color:'var(--foreground-subtle)', opacity: hovered ? 1 : 0, transition:'opacity 0.15s' }}/>
      </div>
      <p style={{ fontSize:14, fontWeight:600, color:'var(--foreground)', margin:'0 0 8px' }}>{title}</p>
      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
        <span style={{ fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:20, background:'rgba(124,58,237,0.1)', color:'#a78bfa', border:'1px solid rgba(124,58,237,0.2)' }}>{type}</span>
        <span style={{ fontSize:12, color:'var(--foreground-subtle)' }}>•</span>
        <span style={{ fontSize:12, color:'var(--foreground-muted)' }}>{duration}</span>
        <span style={{ fontSize:12, color:'var(--foreground-subtle)' }}>•</span>
        <span style={{ fontSize:12, color:'var(--foreground-muted)' }}>{level}</span>
      </div>
    </div>
  )
}

export default function Recommendations() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [toast, setToast] = useState('')
  const isMobile = useIsMobile()
  const filters = ['All','DSA','Interview','Career','System']
  const visible = activeFilter === 'All' ? ACTIONS : ACTIONS.filter(a => a.category === activeFilter)
  const card = { background:'var(--background-card)', border:'1px solid var(--border)', borderRadius:16 }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  return (
    <div className="fade-up" style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight:700, color:'var(--foreground)', margin:'0 0 4px', letterSpacing:'-0.02em' }}>Recommendations</h1>
          <p style={{ fontSize:14, color:'var(--foreground-muted)', margin:0 }}>AI-curated actions personalized to your progress</p>
        </div>
        <button 
          onClick={() => showToast('AI recommendations updated!')}
          style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:10,
            fontSize:13, fontWeight:500, cursor:'pointer', border:'1px solid var(--border)',
            background:'var(--background-card)', color:'var(--foreground-muted)', transition:'all .15s', flexShrink:0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(124,58,237,0.4)'; e.currentTarget.style.color='var(--foreground)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--foreground-muted)' }}
        ><RefreshCw size={14}/> Refresh</button>
      </div>

      {/* AI Banner */}
      <div style={{
        ...card, padding: isMobile ? '18px 20px' : '22px 28px',
        background:'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(236,72,153,0.06),rgba(6,182,212,0.04))',
        borderColor:'rgba(124,58,237,0.3)',
        display:'flex', alignItems:'center', gap:18, flexWrap:'wrap',
      }}>
        <div style={{ width:48, height:48, borderRadius:14, flexShrink:0, background:'linear-gradient(135deg,#7C3AED,#EC4899)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Sparkles size={22} color="#fff"/>
        </div>
        <div style={{ flex:1, minWidth:200 }}>
          <p style={{ fontSize:15, fontWeight:700, color:'var(--foreground)', margin:'0 0 4px' }}>AI-Powered Learning Path</p>
          <p style={{ fontSize:13, color:'var(--foreground-muted)', margin:0, lineHeight:1.6 }}>Based on your performance and upcoming interviews, here's your personalized roadmap to success.</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button 
            onClick={() => showToast('Opening personalized learning roadmap...')}
            style={{ padding:'9px 16px', borderRadius:10, fontSize:13, fontWeight:600, border:'none', cursor:'pointer', background:'var(--primary)', color:'#fff', boxShadow:'0 4px 14px rgba(124,58,237,0.35)', transition:'all .15s' }}
            onMouseEnter={e => e.currentTarget.style.background='#6d28d9'}
            onMouseLeave={e => e.currentTarget.style.background='var(--primary)'}
          >View Full Roadmap</button>
          <button 
            onClick={() => showToast('Customizing roadmap parameters...')}
            style={{ padding:'9px 16px', borderRadius:10, fontSize:13, fontWeight:500, border:'1px solid var(--border)', cursor:'pointer', background:'transparent', color:'var(--foreground-muted)', transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='var(--background-hover)'; e.currentTarget.style.color='var(--foreground)' }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--foreground-muted)' }}
          >Customize</button>
        </div>
      </div>

      {/* Priority Actions */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <TrendingUp size={17} style={{ color:'var(--primary)' }}/>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--foreground)', margin:0 }}>Priority Actions</h2>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <Filter size={13} style={{ color:'var(--foreground-subtle)' }}/>
            {filters.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)} aria-pressed={activeFilter === f} style={{
                padding:'5px 12px', borderRadius:20, fontSize:12, fontWeight:500, cursor:'pointer', border:'1px solid', transition:'all .15s',
                borderColor: activeFilter===f ? 'var(--primary)' : 'var(--border)',
                background:  activeFilter===f ? 'rgba(124,58,237,0.15)' : 'transparent',
                color:       activeFilter===f ? '#a78bfa' : 'var(--foreground-muted)',
              }}>{f}</button>
            ))}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>
          {visible.map((a,i) => <ActionCard key={i} {...a} showToast={showToast}/>)}
          {visible.length === 0 && (
            <div style={{ gridColumn:'1 / -1', textAlign:'center', padding:'40px 0', color:'var(--foreground-muted)', fontSize:14 }}>
              No actions in this category right now.
            </div>
          )}
        </div>
      </div>

      {/* Resources */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <BookOpen size={17} style={{ color:'var(--accent)' }}/>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--foreground)', margin:0 }}>Suggested Resources</h2>
          </div>
          <button 
            onClick={() => showToast('Opening additional study resources...')}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'var(--primary)', fontWeight:500, display:'flex', alignItems:'center', gap:4 }}
          >
            View all <ChevronRight size={13}/>
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap:14 }}>
          {RESOURCES.map((r,i) => <ResourceCard key={i} {...r} showToast={showToast}/>)}
        </div>
      </div>

      {/* Skill Gap */}
      <div style={{ ...card, padding:'22px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <Target size={17} style={{ color:'var(--secondary)' }}/>
          <h2 style={{ fontSize:15, fontWeight:700, color:'var(--foreground)', margin:0 }}>Skill Gap Analysis</h2>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {SKILLS.map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:13, fontWeight:500, color:'var(--foreground)' }}>{label}</span>
                <span style={{ fontSize:13, fontWeight:600, color }}>{value}%</span>
              </div>
              <div style={{ height:6, borderRadius:999, background:'var(--muted)', overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:999, width:`${value}%`, background:color, transition:'width .7s ease' }}/>
              </div>
            </div>
          ))}
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