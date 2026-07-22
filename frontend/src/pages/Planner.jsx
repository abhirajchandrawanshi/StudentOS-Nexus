import { useState } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, Clock,
  CheckCircle2, Circle, Trash2, X,
} from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

// ── Constants ──────────────────────────────────────────────────────
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

// ── StatBar ────────────────────────────────────────────────────────
const StatBar = ({ label, value, display, color }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 7 }}>
      <span style={{ fontSize: 13, color:'var(--foreground-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color:'var(--foreground)' }}>{display}</span>
    </div>
    <div style={{ height: 5, borderRadius: 999, background:'var(--muted)', overflow:'hidden' }}>
      <div style={{ height:'100%', borderRadius: 999, width:`${value}%`, background: color, transition:'width .7s ease' }}/>
    </div>
  </div>
)

// ── Task Modal ─────────────────────────────────────────────────────
const TaskModal = ({ onClose, onAdd }) => {
  const [title, setTitle] = useState('')
  const [date,  setDate]  = useState('')
  const [time,  setTime]  = useState('')
  const [type,  setType]  = useState('Task')

  const inputStyle = {
    width:'100%', padding:'10px 14px', borderRadius: 10, fontSize: 13,
    background:'var(--background)', border:'1px solid var(--border)',
    color:'var(--foreground)', outline:'none', fontFamily:'inherit',
    transition:'border-color .15s',
  }

  return (
    <div
      style={{
        position:'fixed', inset: 0, zIndex: 200,
        background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div role="dialog" aria-modal="true" style={{
        background:'var(--background-card)', border:'1px solid var(--border)',
        borderRadius: 18, padding: 28, width:'100%', maxWidth: 400,
        boxShadow:'0 20px 60px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color:'var(--foreground)', margin: 0 }}>New Task</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--foreground-muted)', display:'flex', padding: 4 }}>
            <X size={18}/>
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
          <input
            style={inputStyle} placeholder="Task title"
            value={title} onChange={e => setTitle(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border)'}
          />
          <input
            style={inputStyle} type="date"
            value={date} onChange={e => setDate(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border)'}
          />
          <input
            style={inputStyle} type="time"
            value={time} onChange={e => setTime(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border)'}
          />
          {/* Type selector */}
          <div style={{ display:'flex', gap: 8 }}>
            {['Task','Event','Reminder'].map(t => (
              <button key={t} onClick={() => setType(t)} style={{
                flex: 1, padding:'8px 0', borderRadius: 10, fontSize: 12, fontWeight: 500,
                cursor:'pointer', border:'1px solid', transition:'all .15s',
                borderColor: type === t ? 'var(--primary)' : 'var(--border)',
                background:  type === t ? 'rgba(124,58,237,0.15)' : 'transparent',
                color:       type === t ? '#a78bfa' : 'var(--foreground-muted)',
              }}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', gap: 10, marginTop: 22 }}>
          <button onClick={onClose} style={{
            flex: 1, padding:'10px 0', borderRadius: 10, fontSize: 13, fontWeight: 500,
            cursor:'pointer', border:'1px solid var(--border)',
            background:'transparent', color:'var(--foreground-muted)', transition:'all .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background='var(--background-hover)'; e.currentTarget.style.color='var(--foreground)' }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--foreground-muted)' }}
          >Cancel</button>
          <button
            onClick={() => {
              if (!title.trim()) return
              onAdd({ title, date, time, type, done: false, id: Date.now() })
              onClose()
            }}
            style={{
              flex: 1, padding:'10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor:'pointer', border:'none',
              background:'var(--primary)', color:'#fff',
              boxShadow:'0 4px 14px rgba(124,58,237,0.35)', transition:'all .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background='#6d28d9'}
            onMouseLeave={e => e.currentTarget.style.background='var(--primary)'}
          >Add Task</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Planner ───────────────────────────────────────────────────
export default function Planner() {
  const today = new Date()
  const isMobile = useIsMobile()

  const [current,   setCurrent]   = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [showModal, setShowModal] = useState(false)
  const [tasks,     setTasks]     = useState([])

  const [events] = useState([
    { day: 18, dayAbbr:'Mon', title:'DBMS Exam',      time:'10:00 AM', color:'#7C3AED' },
    { day: 19, dayAbbr:'Tue', title:'Mock Interview', time:'3:00 PM',  color:'#EC4899' },
    { day: 20, dayAbbr:'Wed', title:'Resume Review',  time:'2:00 PM',  color:'#06B6D4' },
    { day: 22, dayAbbr:'Fri', title:'Coding Contest', time:'5:00 PM',  color:'#22C55E' },
  ])

  // Calendar math
  const { year, month } = current
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  )
  while (cells.length % 7 !== 0) cells.push(null)

  const prevMonth = () => setCurrent(c =>
    c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 }
  )
  const nextMonth = () => setCurrent(c =>
    c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 }
  )

  const isToday  = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  const eventDays = new Set(events.map(e => e.day))

  const toggleTask = (id) => setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t))
  const deleteTask = (id) => setTasks(p => p.filter(t => t.id !== id))

  const card = {
    background: 'var(--background-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
  }

  const iconBtn = {
    width: 44, height: 44, borderRadius: 9,
    display:'flex', alignItems:'center', justifyContent:'center',
    background:'var(--background)', border:'1px solid var(--border)',
    cursor:'pointer', color:'var(--foreground-muted)', transition:'all .15s',
  }

  return (
    <>
      {showModal && (
        <TaskModal onClose={() => setShowModal(false)} onAdd={t => setTasks(p => [...p, t])} />
      )}

      <div style={{ maxWidth: 1600, margin:'0 auto', display:'flex', flexDirection:'column', gap: 20 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color:'var(--foreground)', margin:'0 0 4px', letterSpacing:'-0.02em' }}>
              Planner
            </h1>
            <p style={{ fontSize: 14, color:'var(--foreground-muted)', margin: 0 }}>
              Organize your study schedule and tasks
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display:'inline-flex', alignItems:'center', gap: 6,
              padding:'10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              border:'none', cursor:'pointer',
              background:'var(--primary)', color:'#fff',
              boxShadow:'0 4px 14px rgba(124,58,237,0.35)', transition:'all .15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background='#6d28d9'}
            onMouseLeave={e => e.currentTarget.style.background='var(--primary)'}
          >
            <Plus size={16}/> {isMobile ? 'Add' : 'New Task'}
          </button>
        </div>

        {/* Main grid */}
        <div style={{
          display:'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 300px',
          gap: 20, alignItems:'start',
        }}>

          {/* ── Calendar ── */}
          <div style={{ ...card, padding: isMobile ? 16 : 24 }}>
            {/* Month nav */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color:'var(--foreground)', margin: 0 }}>
                {MONTHS[month]} {year}
              </h2>
              <div style={{ display:'flex', gap: 6 }}>
                {[{fn:prevMonth,Icon:ChevronLeft,label:'Previous month'},{fn:nextMonth,Icon:ChevronRight,label:'Next month'}].map(({fn,Icon,label},i) => (
                  <button key={i} onClick={fn} aria-label={label} style={iconBtn}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(124,58,237,0.12)'; e.currentTarget.style.color='var(--primary)'; e.currentTarget.style.borderColor='rgba(124,58,237,0.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.background='var(--background)'; e.currentTarget.style.color='var(--foreground-muted)'; e.currentTarget.style.borderColor='var(--border)' }}
                  >
                    <Icon size={16}/>
                  </button>
                ))}
              </div>
            </div>

            {/* Day headers */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom: 6 }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign:'center', fontSize: 11, fontWeight: 600, color:'var(--foreground-subtle)', paddingBottom: 10, letterSpacing:'.04em' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap: 3 }}>
              {cells.map((day, idx) => {
                const active   = isToday(day)
                const hasEvent = day && eventDays.has(day)
                return (
                  <div key={idx} style={{
                    height: isMobile ? 48 : 60,
                    borderRadius: 12,
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 4,
                    cursor: day ? 'pointer' : 'default',
                    background: active ? 'linear-gradient(135deg,#7C3AED,#6D28D9)' : 'transparent',
                    border: active ? 'none' : '1px solid transparent',
                    transition:'all .15s',
                  }}
                    onMouseEnter={e => { if (day && !active) e.currentTarget.style.background='rgba(124,58,237,0.1)' }}
                    onMouseLeave={e => { if (day && !active) e.currentTarget.style.background='transparent' }}
                  >
                    {day && (
                      <>
                        <span style={{
                          fontSize: isMobile ? 12 : 14,
                          fontWeight: active ? 700 : 400,
                          color: active ? '#fff' : 'var(--foreground)',
                          lineHeight: 1,
                        }}>{day}</span>
                        {hasEvent && (
                          <div style={{ display:'flex', gap: 2 }}>
                            {events.filter(e => e.day === day).slice(0,3).map((ev,i) => (
                              <span key={i} style={{ width: 4, height: 4, borderRadius:'50%', background: ev.color }}/>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Right panel ── */}
          <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>

            {/* Upcoming Events */}
            <div style={{ ...card, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color:'var(--foreground)', margin:'0 0 14px' }}>
                Upcoming Events
              </h3>
              <div style={{ display:'flex', flexDirection:'column', gap: 4 }}>
                {events.map((ev, i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap: 12,
                    padding:'10px 12px', borderRadius: 12,
                    background:'var(--background)', transition:'background .15s', cursor:'pointer',
                    border:'1px solid transparent',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(124,58,237,0.08)'; e.currentTarget.style.borderColor='rgba(124,58,237,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background='var(--background)'; e.currentTarget.style.borderColor='transparent' }}
                  >
                    <div style={{ textAlign:'center', flexShrink: 0, minWidth: 28 }}>
                      <p style={{ fontSize: 17, fontWeight: 700, color:'var(--foreground)', margin: 0, lineHeight: 1 }}>{ev.day}</p>
                      <p style={{ fontSize: 9, fontWeight: 600, color:'var(--foreground-subtle)', margin:'2px 0 0', textTransform:'uppercase', letterSpacing:'.05em' }}>{ev.dayAbbr}</p>
                    </div>
                    <div style={{ width: 3, height: 34, borderRadius: 999, background: ev.color, flexShrink: 0 }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color:'var(--foreground)', margin:'0 0 3px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ev.title}</p>
                      <p style={{ fontSize: 11, color:'var(--foreground-muted)', margin: 0, display:'flex', alignItems:'center', gap: 4 }}>
                        <Clock size={10}/> {ev.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Productivity Stats */}
            <div style={{ ...card, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color:'var(--foreground)', margin:'0 0 16px' }}>
                Productivity Stats
              </h3>
              <StatBar label="Tasks Completed" value={75} display="18/24" color="linear-gradient(90deg,#7C3AED,#EC4899)"/>
              <StatBar label="Focus Time Today" value={65} display="5.2h"  color="#EC4899"/>
              <StatBar label="Weekly Goal"       value={87} display="87%"   color="#22C55E"/>
            </div>

            {/* Task list */}
            {tasks.length > 0 && (
              <div style={{ ...card, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color:'var(--foreground)', margin:'0 0 14px' }}>
                  My Tasks
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, padding:'2px 8px', borderRadius: 20, background:'rgba(124,58,237,0.1)', color:'#a78bfa', border:'1px solid rgba(124,58,237,0.2)' }}>
                    {tasks.length}
                  </span>
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
                  {tasks.map(t => (
                    <div key={t.id} style={{
                      display:'flex', alignItems:'center', gap: 10,
                      padding:'10px 12px', borderRadius: 10,
                      background:'var(--background)', border:'1px solid var(--border)',
                      transition:'border-color .15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor='rgba(124,58,237,0.3)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
                    >
                      <button onClick={() => toggleTask(t.id)} aria-label={t.done ? `Mark ${t.title} incomplete` : `Mark ${t.title} complete`} style={{ background:'none', border:'none', cursor:'pointer', padding: 0, display:'flex', flexShrink: 0 }}>
                        {t.done
                          ? <CheckCircle2 size={17} style={{ color:'#22C55E' }}/>
                          : <Circle       size={17} style={{ color:'var(--foreground-subtle)' }}/>
                        }
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 13, fontWeight: 500, margin: 0,
                          color: t.done ? 'var(--foreground-subtle)' : 'var(--foreground)',
                          textDecoration: t.done ? 'line-through' : 'none',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                        }}>{t.title}</p>
                        {t.time && (
                          <p style={{ fontSize: 11, color:'var(--foreground-subtle)', margin:'2px 0 0', display:'flex', alignItems:'center', gap: 3 }}>
                            <Clock size={10}/> {t.time}
                          </p>
                        )}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, padding:'2px 7px', borderRadius: 20, background:'rgba(124,58,237,0.1)', color:'#a78bfa', border:'1px solid rgba(124,58,237,0.2)', flexShrink: 0 }}>
                        {t.type}
                      </span>
                      <button onClick={() => deleteTask(t.id)} style={{ background:'none', border:'none', cursor:'pointer', padding: 0, display:'flex', color:'var(--foreground-subtle)', opacity: 0.6, transition:'all .15s', flexShrink: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.color='#ef4444' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity='0.6'; e.currentTarget.style.color='var(--foreground-subtle)' }}
                      >
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty task state */}
            {tasks.length === 0 && (
              <div style={{ ...card, padding: 20, textAlign:'center' }}>
                <p style={{ fontSize: 13, color:'var(--foreground-muted)', margin: 0 }}>No tasks yet — use the button above to add one</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}