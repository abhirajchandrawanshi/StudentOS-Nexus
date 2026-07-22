import { useState } from 'react'
import {
  TrendingUp, TrendingDown, Clock, Code2,
  Trophy, Target, Flame, Brain,
} from 'lucide-react'

import { useBreakpoint } from '../hooks/useIsMobile'

const WEEKLY = [
  { label:'Mon', v:6 }, { label:'Tue', v:7 }, { label:'Wed', v:5 },
  { label:'Thu', v:9 }, { label:'Fri', v:7 }, { label:'Sat', v:10 }, { label:'Sun', v:7 },
]
const TREND = [
  { label:'Jan', v:72 }, { label:'Feb', v:78 },
  { label:'Mar', v:80 }, { label:'Apr', v:85 }, { label:'May', v:92 },
]
const BREAKDOWN = [
  { label:'DSA Practice',   pct:45, color:'#7C3AED' },
  { label:'Interview Prep', pct:25, color:'#EC4899' },
  { label:'Projects',       pct:20, color:'#06B6D4' },
  { label:'Theory',         pct:10, color:'#22C55E' },
]
const SKILLS = [
  { label:'Dynamic Programming', value:92 },
  { label:'System Design',       value:85 },
  { label:'Binary Trees',        value:78 },
  { label:'Graphs',              value:72 },
]
const ACHIEVEMENTS = [
  { icon:Flame,      iconBg:'rgba(245,158,11,0.15)', iconColor:'#F59E0B', label:'100 Problems Streak' },
  { icon:Trophy,     iconBg:'rgba(6,182,212,0.15)',  iconColor:'#06B6D4', label:'Interview Master' },
  { icon:TrendingUp, iconBg:'rgba(34,197,94,0.15)',  iconColor:'#22C55E', label:'Early Bird' },
  { icon:Brain,      iconBg:'rgba(124,58,237,0.15)', iconColor:'#7C3AED', label:'DP Champion' },
]

const StatCard = ({ icon:Icon, iconBg, iconColor, value, label, change, positive }) => (
  <div style={{
    background:'var(--background-card)', border:'1px solid var(--border)',
    borderRadius:16, padding:'20px 22px', minWidth:0,
  }}>
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
      <div style={{ width:36, height:36, borderRadius:10, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={17} style={{ color:iconColor }}/>
      </div>
      <span style={{ fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:3, color: positive ? '#22C55E' : '#EF4444' }}>
        {positive ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}{change}
      </span>
    </div>
    <p style={{ fontSize:26, fontWeight:700, color:'var(--foreground)', margin:'0 0 4px', lineHeight:1 }}>{value}</p>
    <p style={{ fontSize:12, color:'var(--foreground-muted)', margin:0 }}>{label}</p>
  </div>
)

const BarChart = ({ data }) => {
  const [hovered, setHovered] = useState(null)
  const W=520, H=170, PAD={top:20,right:8,bottom:34,left:32}
  const iW = W-PAD.left-PAD.right, iH = H-PAD.top-PAD.bottom
  const max = Math.max(...data.map(d=>d.v))
  const bW  = iW / data.length
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible', display:'block' }}>
      <defs>
        {data.map((_,i) => (
          <linearGradient key={i} id={`bg${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={hovered===i ? '#a78bfa' : '#7C3AED'} stopOpacity="1"/>
            <stop offset="100%" stopColor={hovered===i ? '#7C3AED' : '#4C1D95'} stopOpacity="0.5"/>
          </linearGradient>
        ))}
      </defs>
      {[0,3,6,9,12].map(t => {
        const y = PAD.top + iH - (t/max)*iH
        return (
          <g key={t}>
            <line x1={PAD.left} x2={PAD.left+iW} y1={y} y2={y} stroke="var(--border)" strokeWidth="1"/>
            <text x={PAD.left-6} y={y+4} textAnchor="end" fontSize="9" fill="var(--foreground-subtle)">{t}</text>
          </g>
        )
      })}
      {data.map((d,i) => {
        const bh=( d.v/max)*iH, x=PAD.left+i*bW+bW*0.18
        const y=PAD.top+iH-bh, bw=bW*0.64, isH=hovered===i
        return (
          <g key={i} onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)} style={{cursor:'pointer'}}>
            <rect x={PAD.left+i*bW} y={PAD.top} width={bW} height={iH} fill="transparent"/>
            <rect x={x} y={isH?y-4:y} width={bw} height={isH?bh+4:bh} rx="5" fill={`url(#bg${i})`}/>
            {isH && (
              <g>
                <rect x={x+bw/2-14} y={y-22} width={28} height={16} rx="4" fill="#7C3AED"/>
                <text x={x+bw/2} y={y-10} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{d.v}h</text>
              </g>
            )}
            <text x={x+bw/2} y={PAD.top+iH+16} textAnchor="middle" fontSize="10" fill={isH?'#a78bfa':'var(--foreground-subtle)'}>{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

const LineChart = ({ data }) => {
  const [hovered, setHovered] = useState(null)
  const W=520, H=170, PAD={top:20,right:20,bottom:34,left:36}
  const iW=W-PAD.left-PAD.right, iH=H-PAD.top-PAD.bottom
  const pts = data.map((d,i) => ({
    x: PAD.left+(i/(data.length-1))*iW,
    y: PAD.top+iH-(d.v/100)*iH,
    label:d.label, v:d.v,
  }))
  const pathD = pts.map((p,i)=>`${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${PAD.top+iH} L ${pts[0].x} ${PAD.top+iH} Z`
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible', display:'block' }}>
      <defs>
        <linearGradient id="la" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#EC4899" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#EC4899" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0,25,50,75,100].map(t => {
        const y = PAD.top+iH-(t/100)*iH
        return (
          <g key={t}>
            <line x1={PAD.left} x2={PAD.left+iW} y1={y} y2={y} stroke="var(--border)" strokeWidth="1"/>
            <text x={PAD.left-6} y={y+4} textAnchor="end" fontSize="9" fill="var(--foreground-subtle)">{t}</text>
          </g>
        )
      })}
      <path d={areaD} fill="url(#la)"/>
      <path d={pathD} fill="none" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i) => {
        const isH=hovered===i
        return (
          <g key={i} onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)} style={{cursor:'pointer'}}>
            <rect x={p.x-22} y={PAD.top} width={44} height={iH} fill="transparent"/>
            <circle cx={p.x} cy={p.y} r={isH?7:5} fill="#EC4899" stroke="var(--background-card)" strokeWidth="2.5"/>
            {isH && (
              <g>
                <rect x={p.x-16} y={p.y-26} width={32} height={18} rx="4" fill="#EC4899"/>
                <text x={p.x} y={p.y-13} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{p.v}%</text>
              </g>
            )}
            <text x={p.x} y={PAD.top+iH+16} textAnchor="middle" fontSize="10" fill={isH?'#EC4899':'var(--foreground-subtle)'}>{p.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

const Donut = ({ slices }) => {
  const [hov, setHov] = useState(null)
  const SIZE=120, cx=60, cy=60, R=40, stroke=14
  const arcs = slices.map((s, i) => {
    const start = slices.slice(0, i).reduce((sum, item) => sum + item.pct, 0)
    return { ...s, start, i }
  })
  const arc = (pct,start,expand) => {
    const gap=2.5
    const a1=((start+gap/2)/100)*2*Math.PI-Math.PI/2
    const a2=((start+pct-gap/2)/100)*2*Math.PI-Math.PI/2
    const r=expand?R+4:R
    const x1=cx+r*Math.cos(a1),y1=cy+r*Math.sin(a1)
    const x2=cx+r*Math.cos(a2),y2=cy+r*Math.sin(a2)
    return `M ${x1} ${y1} A ${r} ${r} 0 ${pct>50?1:0} 1 ${x2} ${y2}`
  }
  const active = hov!==null ? slices[hov] : null
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{flexShrink:0,display:'block'}}>
      {arcs.map(s=>(
        <path key={s.i} d={arc(s.pct,s.start,hov===s.i)}
          fill="none" stroke={s.color}
          strokeWidth={hov===s.i?stroke+4:stroke}
          style={{cursor:'pointer',transition:'stroke-width 0.15s'}}
          onMouseEnter={()=>setHov(s.i)} onMouseLeave={()=>setHov(null)}
        />
      ))}
      <text x={cx} y={cy-5} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--foreground)">
        {active ? `${active.pct}%` : '100%'}
      </text>
      <text x={cx} y={cy+11} textAnchor="middle" fontSize="8" fill="var(--foreground-muted)">
        {active ? active.label.split(' ')[0] : 'Total'}
      </text>
    </svg>
  )
}

export default function Analytics() {
  const bp = useBreakpoint(); const isMobile = bp === 'mobile'; const isTablet = bp === 'tablet';
  const card = { background:'var(--background-card)', border:'1px solid var(--border)', borderRadius:16 }

  return (
    <div className="fade-up" style={{ maxWidth:1600, margin:'0 auto', display:'flex', flexDirection:'column', gap:18 }}>

      <div>
        <h1 style={{ fontSize:isMobile?20:26, fontWeight:700, color:'var(--foreground)', margin:'0 0 4px', letterSpacing:'-0.02em' }}>Analytics</h1>
        <p style={{ fontSize:14, color:'var(--foreground-muted)', margin:0 }}>Track your progress and performance metrics</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:12 }}>
        <StatCard icon={Target} iconBg="rgba(124,58,237,0.15)" iconColor="#7C3AED" value="92%"   label="Overall Performance"  change="+12%" positive/>
        <StatCard icon={Clock}  iconBg="rgba(236,72,153,0.15)" iconColor="#EC4899" value="37.2h" label="Study Hours This Week"  change="+8%"  positive/>
        <StatCard icon={Code2}  iconBg="rgba(6,182,212,0.15)"  iconColor="#06B6D4" value="83"    label="Problems Solved"        change="-3%"  positive={false}/>
        <StatCard icon={Trophy} iconBg="rgba(34,197,94,0.15)"  iconColor="#22C55E" value="18"    label="Achievements Earned"    change="+15%" positive/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:isTablet?'1fr':'1fr 1fr', gap:14 }}>
        <div style={{...card, padding:'20px 22px'}}>
          <h2 style={{ fontSize:14, fontWeight:700, color:'var(--foreground)', margin:'0 0 14px' }}>Weekly Activity</h2>
          <BarChart data={WEEKLY}/>
        </div>
        <div style={{...card, padding:'20px 22px'}}>
          <h2 style={{ fontSize:14, fontWeight:700, color:'var(--foreground)', margin:'0 0 14px' }}>Performance Trend</h2>
          <LineChart data={TREND}/>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':isTablet?'1fr 1fr':'1fr 1fr 1fr', gap:14, alignItems:'start' }}>

        <div style={{...card, padding:'20px 22px'}}>
          <h2 style={{ fontSize:14, fontWeight:700, color:'var(--foreground)', margin:'0 0 18px' }}>Top Skills</h2>
          {SKILLS.map(({label,value}) => (
            <div key={label} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:13, color:'var(--foreground)' }}>{label}</span>
                <span style={{ fontSize:13, fontWeight:600, color:'var(--primary)' }}>{value}%</span>
              </div>
              <div style={{ height:5, borderRadius:999, background:'var(--muted)', overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:999, width:`${value}%`, background:'linear-gradient(90deg,#7C3AED,#a78bfa)', transition:'width .7s ease' }}/>
              </div>
            </div>
          ))}
        </div>

        <div style={{...card, padding:'20px 22px'}}>
          <h2 style={{ fontSize:14, fontWeight:700, color:'var(--foreground)', margin:'0 0 18px' }}>Study Breakdown</h2>
          <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', alignItems:'center', gap: 20 }}>
            <Donut slices={BREAKDOWN}/>
            <div style={{ flex:1, minWidth:0, width: isMobile ? '100%' : 'auto' }}>
              {BREAKDOWN.map(s => (
                <div key={s.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:11 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:s.color, flexShrink:0, display:'inline-block' }}/>
                    <span style={{ fontSize:12, color:'var(--foreground-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--foreground)', flexShrink:0, marginLeft:6 }}>{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{...card, padding:'20px 22px'}}>
          <h2 style={{ fontSize:14, fontWeight:700, color:'var(--foreground)', margin:'0 0 14px' }}>Recent Achievements</h2>
          {ACHIEVEMENTS.map(({icon:Icon,iconBg,iconColor,label},i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'11px 14px', borderRadius:12, marginBottom:8,
              background:'var(--background)', border:'1px solid var(--border)',
              cursor:'pointer', transition:'all .15s',
            }}
              onMouseEnter={e=>{ e.currentTarget.style.background='rgba(124,58,237,0.08)'; e.currentTarget.style.borderColor='rgba(124,58,237,0.25)' }}
              onMouseLeave={e=>{ e.currentTarget.style.background='var(--background)'; e.currentTarget.style.borderColor='var(--border)' }}
            >
              <div style={{ width:34, height:34, borderRadius:10, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={16} style={{ color:iconColor }}/>
              </div>
              <span style={{ fontSize:13, fontWeight:500, color:'var(--foreground)' }}>{label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}