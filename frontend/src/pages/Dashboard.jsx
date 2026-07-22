import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBreakpoint } from '../hooks/useIsMobile'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
} from 'recharts'
import {
  Zap, Target, Award, TrendingUp,
  CheckCircle2, Circle, Code2, Calendar,
  Brain, ArrowRight,
} from 'lucide-react'
import useAuthStore from '../store/authStore'

// ── Mock Data ──────────────────────────────────────────────────────
const WEEKLY_DATA = [
  { day: 'Mon', hours: 3.2 },
  { day: 'Tue', hours: 5.1 },
  { day: 'Wed', hours: 4.3 },
  { day: 'Thu', hours: 6.2 },
  { day: 'Fri', hours: 4.8 },
  { day: 'Sat', hours: 7.5 },
  { day: 'Sun', hours: 6.1 },
]

const DSA_DONUT = [
  { name: 'Completed', value: 68, fill: '#7C3AED' },
  { name: 'Remaining', value: 32, fill: '#2A1F3D' },
]

const FOCUS_RADIAL = [{ name: 'Focus', value: 87, fill: '#EC4899' }]

const READINESS_BARS = [
  { label: 'Technical Skills', pct: 92, color: '#7C3AED' },
  { label: 'Problem Solving',  pct: 85, color: '#7C3AED' },
  { label: 'Communication',    pct: 78, color: '#EC4899' },
  { label: 'System Design',    pct: 68, color: '#EC4899' },
]

const UPCOMING = [
  { label: 'DBMS Exam',      time: 'Tomorrow, 10:00 AM', color: '#7C3AED' },
  { label: 'Mock Interview', time: 'May 19, 3:00 PM',    color: '#EC4899' },
  { label: 'Resume Review',  time: 'May 20, 2:00 PM',    color: '#06B6D4' },
]

const RECENT = [
  { icon: CheckCircle2, color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   text: 'Completed Binary Search module',      time: '2 hours ago' },
  { icon: TrendingUp,   color: '#7C3AED', bg: 'rgba(124,58,237,0.12)',  text: 'Placement readiness increased by 8%', time: '5 hours ago' },
  { icon: Brain,        color: '#EC4899', bg: 'rgba(236,72,153,0.12)',  text: 'AI generated study plan for DBMS',    time: 'Yesterday' },
]

const INIT_GOALS = [
  { id: 1, label: 'Revise Trees',   done: true },
  { id: 2, label: '2 DP Problems',  done: true },
  { id: 3, label: 'Mock Interview', done: false },
  { id: 4, label: 'Update Resume',  done: false },
]

// ── Tooltip ────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--background-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '8px 14px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
    }}>
      <p style={{ fontSize: '12px', color: 'var(--foreground-muted)', marginBottom: '2px' }}>{label}</p>
      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{payload[0].value}h</p>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const bp = useBreakpoint(); const isMobile = bp === 'mobile'; const isTablet = bp === 'tablet';
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const name = user?.name?.split(' ')[0] || 'Alex'
  const [goals, setGoals] = useState(INIT_GOALS)
  const doneCount = goals.filter(g => g.done).length
  const toggleGoal = (id) => setGoals(g => g.map(x => x.id === id ? { ...x, done: !x.done } : x))

  // Card base style
  const card = {
    background: 'var(--background-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
  }

  return (
    <div className="fade-up" style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ══ HERO SECTION ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 280px' : '1fr 340px', gap: '24px' }}>

        {/* Left hero */}
        <div style={{ ...card, padding: isMobile ? '16px' : '32px', position: 'relative', overflow: 'hidden' }}>
          {/* glows */}
          <div style={{ position:'absolute', top:0, right:0, width:'320px', height:'320px', background:'rgba(124,58,237,0.07)', filter:'blur(80px)', borderRadius:'50%', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:0, left:0, width:'240px', height:'240px', background:'rgba(236,72,153,0.05)', filter:'blur(80px)', borderRadius:'50%', pointerEvents:'none' }}/>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: isMobile ? '16px' : '32px', position:'relative' }}>
            <div>
              <h2 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight:700, color:'var(--foreground)', marginBottom:'6px', letterSpacing:'-0.02em' }}>
                Welcome back, {name}
              </h2>
              <p style={{ fontSize:'15px', color:'var(--foreground-muted)' }}>
                Your productivity is on fire this week
              </p>
            </div>
            <div style={{
              display:'flex', alignItems:'center', gap:'8px',
              padding:'8px 16px', borderRadius:'12px',
              background:'rgba(124,58,237,0.1)',
              border:'1px solid rgba(124,58,237,0.2)',
              flexShrink: 0,
            }}>
              <TrendingUp size={16} style={{ color:'var(--primary)' }} />
              <span style={{ fontSize:'14px', fontWeight:700, color:'var(--primary)' }}>+23%</span>
            </div>
          </div>

          {/* 4 stat mini-cards */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:'16px', marginBottom:'28px', position:'relative' }}>
            {[
              { icon:Zap,        iconColor:'#7C3AED', bg:'rgba(124,58,237,0.1)', val:'87%', label:'Focus Score' },
              { icon:Target,     iconColor:'#EC4899', bg:'rgba(236,72,153,0.1)', val:'24',  label:'DSA Solved' },
              { icon:Award,      iconColor:'#06B6D4', bg:'rgba(6,182,212,0.1)',  val:'92%', label:'Placement Ready' },
              { icon:TrendingUp, iconColor:'#22C55E', bg:'rgba(34,197,94,0.1)',  val:'37h', label:'This Week' },
            ].map(({ icon:Icon, iconColor, bg, val, label }, idx) => (
              <div key={label} className={`stagger-${idx + 1}`} style={{
                background:'rgba(255,255,255,0.03)',
                border:'1px solid var(--border)',
                borderRadius:'14px',
                padding:'20px',
              }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'14px' }}>
                  <Icon size={18} style={{ color:iconColor }} />
                </div>
                <p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight:700, color:'var(--foreground)', marginBottom:'4px', letterSpacing:'-0.02em', lineHeight:1 }}>
                  {val}
                </p>
                <p style={{ fontSize:'12px', color:'var(--foreground-muted)' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{
            background:'rgba(255,255,255,0.03)',
            border:'1px solid var(--border)',
            borderRadius:'14px',
            padding:'20px 24px',
            position:'relative',
            minWidth: 0,
            overflow: 'hidden',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
              <span style={{ fontSize:'15px', fontWeight:600, color:'var(--foreground)' }}>Weekly Activity</span>
              <span style={{ fontSize:'13px', color:'var(--foreground-muted)' }}>Last 7 days</span>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={WEEKLY_DATA} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip content={<ChartTip />} cursor={{ stroke:'rgba(124,58,237,0.15)', strokeWidth:1 }}/>
                <Area type="monotone" dataKey="hours"
                  stroke="#7C3AED" strokeWidth={2.5}
                  fill="url(#aG)" dot={false}
                  activeDot={{ fill:'#7C3AED', r:5, strokeWidth:2, stroke:'var(--background-card)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

          {/* AI Insights */}
          <div style={{ ...card, padding:'24px', flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
              <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'linear-gradient(135deg,#7C3AED,#EC4899)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Zap size={20} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize:'15px', fontWeight:600, color:'var(--foreground)' }}>AI Insights</p>
                <p style={{ fontSize:'12px', color:'var(--foreground-muted)' }}>Personalized for you</p>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {[
                { dot:'#7C3AED', title:'Revise DBMS tonight',   sub:'Based on your exam schedule', path:'/app/notes' },
                { dot:'#EC4899', title:'Solve 2 DP problems',   sub:'To maintain your streak', path:'/app/dsa' },
              ].map(({ dot, title, sub, path }) => (
                <div key={title} onClick={() => navigate(path)} style={{
                  padding:'14px 16px', borderRadius:'12px', cursor:'pointer',
                  background:'rgba(255,255,255,0.03)',
                  border:'1px solid var(--border)',
                  transition:'border-color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='rgba(124,58,237,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
                >
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                    <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:dot, marginTop:'5px', flexShrink:0 }}/>
                    <div>
                      <p style={{ fontSize:'13px', color:'var(--foreground)', marginBottom:'3px' }}>{title}</p>
                      <p style={{ fontSize:'12px', color:'var(--foreground-muted)' }}>{sub}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{
                padding:'14px 16px', borderRadius:'12px',
                background:'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(236,72,153,0.08))',
                border:'1px solid rgba(124,58,237,0.25)',
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                  <TrendingUp size={15} style={{ color:'var(--primary)', marginTop:2, flexShrink:0 }}/>
                  <div>
                    <p style={{ fontSize:'13px', fontWeight:500, color:'var(--foreground)', marginBottom:'3px' }}>
                      Placement readiness +8%
                    </p>
                    <p style={{ fontSize:'12px', color:'var(--foreground-muted)' }}>Great progress this week!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ ...card, padding:'24px' }}>
            <p style={{ fontSize:'15px', fontWeight:600, color:'var(--foreground)', marginBottom:'14px' }}>Quick Actions</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {[
                { label: 'Start AI Interview', path: '/app/interviewer' },
                { label: 'Analyze Resume',     path: '/app/resume' },
                { label: 'Generate Roadmap',   path: '/app/recommendations' },
              ].map(({ label, path }) => (
                <button key={label} onClick={() => navigate(path)} style={{
                  width:'100%', padding:'12px 16px', borderRadius:'12px', textAlign:'left',
                  background:'rgba(255,255,255,0.03)',
                  border:'1px solid var(--border)',
                  color:'var(--foreground)', fontSize:'13px', fontWeight:500,
                  cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between',
                  transition:'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(124,58,237,0.4)'; e.currentTarget.style.background='var(--background-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='rgba(255,255,255,0.03)' }}
                >
                  {label}
                  <ArrowRight size={14} style={{ color:'var(--foreground-muted)' }}/>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ WIDGETS ROW ══ */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:'24px' }}>

        {/* DSA Progress */}
        <div style={{ ...card, padding:'24px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
            <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'rgba(124,58,237,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Code2 size={20} style={{ color:'var(--primary)' }}/>
            </div>
            <div>
              <p style={{ fontSize:'15px', fontWeight:600, color:'var(--foreground)' }}>DSA Progress</p>
              <p style={{ fontSize:'12px', color:'var(--foreground-muted)' }}>450 problems</p>
            </div>
          </div>
          <div style={{ position:'relative', height:'140px', marginBottom:'16px' }}>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={DSA_DONUT} cx="50%" cy="50%" innerRadius={48} outerRadius={64} paddingAngle={3} dataKey="value">
                  {DSA_DONUT.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <p style={{ fontSize: isMobile ? '26px' : '32px', fontWeight:700, color:'var(--foreground)', lineHeight:1 }}>68%</p>
              <p style={{ fontSize:'12px', color:'var(--foreground-muted)', marginTop:'4px' }}>Complete</p>
            </div>
          </div>
          {[['Easy','142/180'],['Medium','98/200'],['Hard','24/70']].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
              <span style={{ fontSize:'14px', color:'var(--foreground-muted)' }}>{l}</span>
              <span style={{ fontSize:'14px', fontWeight:500, color:'var(--foreground)' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Upcoming */}
        <div style={{ ...card, padding:'24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
            <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'rgba(236,72,153,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Calendar size={20} style={{ color:'var(--secondary)' }}/>
            </div>
            <div>
              <p style={{ fontSize:'15px', fontWeight:600, color:'var(--foreground)' }}>Upcoming</p>
              <p style={{ fontSize:'12px', color:'var(--foreground-muted)' }}>Next 3 days</p>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            {UPCOMING.map(({ label, time, color }) => (
              <div key={label} style={{ display:'flex', alignItems:'flex-start', gap:'14px' }}>
                <div style={{ width:'3px', height:'44px', borderRadius:'2px', background:color, flexShrink:0, marginTop:'2px' }}/>
                <div>
                  <p style={{ fontSize:'14px', fontWeight:500, color:'var(--foreground)', marginBottom:'4px' }}>{label}</p>
                  <p style={{ fontSize:'12px', color:'var(--foreground-muted)' }}>{time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Focus Time */}
        <div style={{ ...card, padding:'24px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
            <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'rgba(6,182,212,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Brain size={20} style={{ color:'var(--accent)' }}/>
            </div>
            <div>
              <p style={{ fontSize:'15px', fontWeight:600, color:'var(--foreground)' }}>Focus Time</p>
              <p style={{ fontSize:'12px', color:'var(--foreground-muted)' }}>Deep work sessions</p>
            </div>
          </div>
          <div style={{ position:'relative', height:'140px', marginBottom:'16px' }}>
            <ResponsiveContainer width="100%" height={140}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="68%" outerRadius="100%"
                data={FOCUS_RADIAL} startAngle={90} endAngle={-270}>
                <RadialBar background={{ fill:'#2A1F3D' }} dataKey="value" cornerRadius={10}/>
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <p style={{ fontSize: isMobile ? '26px' : '32px', fontWeight:700, color:'var(--foreground)', lineHeight:1 }}>87%</p>
              <p style={{ fontSize:'12px', color:'var(--foreground-muted)', marginTop:'4px' }}>Score</p>
            </div>
          </div>
          {[['Today','4.2h'],['Average','5.3h'],['Best','7.5h']].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
              <span style={{ fontSize:'14px', color:'var(--foreground-muted)' }}>{l}</span>
              <span style={{ fontSize:'14px', fontWeight:500, color:'var(--foreground)' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Today's Goals */}
        <div style={{ ...card, padding:'24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
            <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'rgba(34,197,94,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <TrendingUp size={20} style={{ color:'var(--success)' }}/>
            </div>
            <div>
              <p style={{ fontSize:'15px', fontWeight:600, color:'var(--foreground)' }}>Today's Goals</p>
              <p style={{ fontSize:'12px', color:'var(--foreground-muted)' }}>{doneCount} of {goals.length} completed</p>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {goals.map(goal => (
              <button key={goal.id} onClick={() => toggleGoal(goal.id)} role="checkbox" aria-checked={goal.done} style={{
                display:'flex', alignItems:'center', gap:'12px',
                padding:'12px 14px', borderRadius:'12px',
                background:'rgba(255,255,255,0.03)',
                border:'1px solid var(--border)',
                cursor:'pointer', textAlign:'left', width:'100%',
                transition:'border-color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor='rgba(124,58,237,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
              >
                {goal.done
                  ? <CheckCircle2 size={18} style={{ color:'var(--primary)', flexShrink:0 }}/>
                  : <Circle       size={18} style={{ color:'var(--foreground-muted)', flexShrink:0 }}/>
                }
                <span style={{
                  fontSize:'13px',
                  color: goal.done ? 'var(--foreground-muted)' : 'var(--foreground)',
                  textDecoration: goal.done ? 'line-through' : 'none',
                }}>
                  {goal.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ BOTTOM ROW ══ */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'24px' }}>

        {/* Interview Readiness */}
        <div style={{ ...card, padding: isMobile ? '16px' : '28px' }}>
          <p style={{ fontSize:'17px', fontWeight:600, color:'var(--foreground)', marginBottom:'24px' }}>
            Interview Readiness
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            {READINESS_BARS.map(({ label, pct, color }) => (
              <div key={label}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                  <span style={{ fontSize:'14px', color:'var(--foreground-muted)' }}>{label}</span>
                  <span style={{ fontSize:'14px', fontWeight:500, color:'var(--foreground)' }}>{pct}%</span>
                </div>
                <div style={{ height:'6px', borderRadius:'3px', background:'var(--muted)', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:'3px', transition:'width 0.7s ease' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ ...card, padding: isMobile ? '16px' : '28px' }}>
          <p style={{ fontSize:'17px', fontWeight:600, color:'var(--foreground)', marginBottom:'24px' }}>
            Recent Activity
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
            {RECENT.map(({ icon:Icon, color, bg, text, time }, idx) => (
              <div key={idx} style={{
                display:'flex', alignItems:'flex-start', gap:'14px',
                paddingBottom: idx < RECENT.length-1 ? '20px' : '0',
                borderBottom: idx < RECENT.length-1 ? '1px solid var(--border)' : 'none',
                marginBottom: idx < RECENT.length-1 ? '20px' : '0',
              }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={16} style={{ color }}/>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:'14px', color:'var(--foreground)', marginBottom:'4px' }}>{text}</p>
                  <p style={{ fontSize:'12px', color:'var(--foreground-muted)' }}>{time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard