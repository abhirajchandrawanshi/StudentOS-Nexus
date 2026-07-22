import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Circle,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

const STORAGE_KEY = 'studentos.todo.v2'

const PRIORITY_ORDER = {
  high: 3,
  medium: 2,
  low: 1,
}

const getInitialTasks = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const normalizeDate = (d) => {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  return date
}

const isOverdue = (task) => {
  if (task.completed || !task.dueDate) return false
  return normalizeDate(task.dueDate) < normalizeDate(new Date())
}

const isToday = (task) => {
  if (!task.dueDate) return false
  return normalizeDate(task.dueDate).getTime() === normalizeDate(new Date()).getTime()
}

const formatDue = (task) => {
  if (!task.dueDate) return 'No due date'
  const date = new Date(task.dueDate)
  const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return task.time ? `${dateLabel} at ${task.time}` : dateLabel
}

const priorityStyle = (priority) => {
  if (priority === 'high') {
    return {
      color: '#f87171',
      background: 'rgba(239,68,68,0.14)',
      border: '1px solid rgba(239,68,68,0.28)',
    }
  }
  if (priority === 'medium') {
    return {
      color: '#fbbf24',
      background: 'rgba(245,158,11,0.14)',
      border: '1px solid rgba(245,158,11,0.28)',
    }
  }
  return {
    color: '#34d399',
    background: 'rgba(16,185,129,0.14)',
    border: '1px solid rgba(16,185,129,0.28)',
  }
}

const parseAiTask = (text) => {
  const input = text.trim()
  if (!input) return null

  const lower = input.toLowerCase()

  let priority = 'medium'
  if (/\b(high|urgent|asap|critical)\b/.test(lower)) priority = 'high'
  if (/\b(low|later|whenever)\b/.test(lower)) priority = 'low'

  const now = new Date()
  let dueDate = ''

  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    dueDate = d.toISOString().split('T')[0]
  } else if (/\btoday\b/.test(lower)) {
    dueDate = now.toISOString().split('T')[0]
  } else {
    const dateMatch = lower.match(/\b(\d{4}-\d{2}-\d{2})\b/)
    if (dateMatch) {
      dueDate = dateMatch[1]
    }
  }

  const timeMatch = input.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i)
  let time = ''
  if (timeMatch) {
    const hrsRaw = Number(timeMatch[1])
    const minsRaw = timeMatch[2] ? Number(timeMatch[2]) : 0
    const meridiem = (timeMatch[3] || '').toLowerCase()

    let hrs24 = hrsRaw
    if (meridiem === 'pm' && hrs24 < 12) hrs24 += 12
    if (meridiem === 'am' && hrs24 === 12) hrs24 = 0

    if (hrs24 >= 0 && hrs24 < 24 && minsRaw >= 0 && minsRaw < 60) {
      const hh = `${hrs24}`.padStart(2, '0')
      const mm = `${minsRaw}`.padStart(2, '0')
      time = `${hh}:${mm}`
    }
  }

  const cleaned = input
    .replace(/\b(high|low|medium|urgent|asap|critical|today|tomorrow)\b/gi, '')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
    .replace(/\b\d{1,2}(?::\d{2})?\s*(am|pm)?\b/gi, '')
    .replace(/[,-]+/g, ' ')
    .trim()

  const title = cleaned.length > 2 ? cleaned : input

  return {
    id: crypto.randomUUID(),
    title,
    priority,
    dueDate,
    time,
    completed: false,
    createdAt: new Date().toISOString(),
  }
}

const SectionHeader = ({ icon: Icon, title, count, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
    <Icon size={18} style={{ color }} />
    <h3 style={{ margin: 0, fontSize: 30 ? 18 : 18, fontWeight: 700, color: 'var(--foreground)' }}>{title}</h3>
    <span
      style={{
        fontSize: 12,
        borderRadius: 999,
        padding: '1px 8px',
        color: 'var(--foreground-muted)',
        border: '1px solid var(--border)',
        background: 'rgba(148,163,184,0.08)',
      }}
    >
      {count}
    </span>
  </div>
)

const Todo = () => {
  const isMobile = useIsMobile()

  const [tasks, setTasks] = useState(() => getInitialTasks())
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [aiInput, setAiInput] = useState('')
  const [manualOpen, setManualOpen] = useState(false)
  const [manualTitle, setManualTitle] = useState('')
  const [manualDate, setManualDate] = useState('')
  const [manualTime, setManualTime] = useState('')
  const [manualPriority, setManualPriority] = useState('high')

  const saveTasks = (next) => {
    setTasks(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const addManualTask = () => {
    const title = manualTitle.trim()
    if (!title) return

    const nextTask = {
      id: crypto.randomUUID(),
      title,
      dueDate: manualDate,
      time: manualTime,
      priority: manualPriority,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    saveTasks([nextTask, ...tasks])
    setManualTitle('')
    setManualDate('')
    setManualTime('')
    setManualPriority('high')
    setManualOpen(false)
  }

  const addAiTask = () => {
    const parsed = parseAiTask(aiInput)
    if (!parsed) return
    saveTasks([parsed, ...tasks])
    setAiInput('')
  }

  const toggleTask = (id) => {
    const next = tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    saveTasks(next)
  }

  const removeTask = (id) => {
    saveTasks(tasks.filter((task) => task.id !== id))
  }

  const visibleTasks = useMemo(() => {
    const q = query.trim().toLowerCase()

    return tasks
      .filter((task) => {
        const matchesQuery = !q || task.title.toLowerCase().includes(q)
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
        return matchesQuery && matchesPriority
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1

        const scoreA = PRIORITY_ORDER[a.priority] + (isOverdue(a) ? 2 : 0) + (isToday(a) ? 1 : 0)
        const scoreB = PRIORITY_ORDER[b.priority] + (isOverdue(b) ? 2 : 0) + (isToday(b) ? 1 : 0)
        if (scoreA !== scoreB) return scoreB - scoreA

        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
        return aDate - bDate
      })
  }, [tasks, query, priorityFilter])

  const grouped = useMemo(() => {
    const overdue = visibleTasks.filter((task) => isOverdue(task))
    const today = visibleTasks.filter((task) => !isOverdue(task) && isToday(task))
    const upcoming = visibleTasks.filter((task) => !isOverdue(task) && !isToday(task))
    return { overdue, today, upcoming }
  }, [visibleTasks])

  const stats = useMemo(() => {
    const done = tasks.filter((task) => task.completed).length
    const total = tasks.length
    const high = tasks.filter((task) => task.priority === 'high' && !task.completed).length
    const medium = tasks.filter((task) => task.priority === 'medium' && !task.completed).length
    const low = tasks.filter((task) => task.priority === 'low' && !task.completed).length
    const percent = total ? Math.round((done / total) * 100) : 0
    return { done, total, high, medium, low, percent }
  }, [tasks])

  const boardStyle = {
    background: 'linear-gradient(180deg, rgba(22,17,39,0.92), rgba(18,14,31,0.92))',
    border: '1px solid rgba(124,58,237,0.16)',
    borderRadius: 18,
  }

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto' }}>
      <div
        className="responsive-sidebar"
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '390px 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <section style={{ ...boardStyle, padding: 28 }}>
          <h1 style={{ margin: 0, fontSize: 44 ? 40 : 40, lineHeight: 1.1, fontWeight: 800, color: '#F3EEFF' }}>
            Up late, aren't we?
          </h1>
          <p style={{ margin: '10px 0 24px', fontSize: 28 ? 14 : 14, color: '#9DA4C0' }}>
            Let's craft your day with AI.
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 22,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 66,
                height: 66,
                borderRadius: '50%',
                background: `conic-gradient(#8B5CF6 ${stats.percent * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                display: 'grid',
                placeItems: 'center',
              }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: '#1B1530',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#D7D1F6',
                  fontSize: 14,
                  fontWeight: 700,
                }}>
                  {stats.percent}%
                </div>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: 31 ? 15 : 15, color: '#E8E3FD', fontWeight: 700 }}>Task Completion</p>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: '#8F97B3' }}>
                  {stats.done} of {stats.total} tasks done
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: 'High', value: stats.high, color: '#f87171' },
                { label: 'Medium', value: stats.medium, color: '#fbbf24' },
                { label: 'Low', value: stats.low, color: '#34d399' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    padding: '10px 8px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, margin: '0 auto 6px' }} />
                  <p style={{ margin: 0, fontSize: 13, color: '#B5BAD0' }}>{item.label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 24 ? 20 : 20, color: '#ECE9FF', fontWeight: 700 }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p style={{ margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8, color: '#B58DFF', fontSize: 16 ? 14 : 14, fontWeight: 700 }}>
              <Sparkles size={15} /> Create Task with AI
            </p>
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Write naturally (e.g., 'Tomorrow interview at 10 AM high priority' or 'OS revise today 9pm')"
              style={{
                width: '100%',
                minHeight: 112,
                resize: 'vertical',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                color: '#ECE9FF',
                padding: 12,
                fontFamily: 'inherit',
                fontSize: 14,
                outline: 'none',
              }}
            />

            <button
              type="button"
              onClick={addAiTask}
              style={{
                width: '100%',
                marginTop: 10,
                height: 42,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                color: '#fff',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'linear-gradient(90deg, #8B5CF6, #EC4899)',
              }}
            >
              <Wand2 size={15} /> Generate
            </button>

            <p style={{ margin: '10px 0 0', color: '#A38ACD', fontSize: 12 }}>
              AI detects task title, date, time, and priority from your sentence.
            </p>
          </div>
        </section>

        <section style={{ ...boardStyle, padding: 24 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 140px auto',
            gap: 10,
            marginBottom: 16,
          }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', top: 12, left: 12, color: '#7F85A2' }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks..."
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#ECE9FF',
                  padding: '0 12px 0 38px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                height: 40,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#ECE9FF',
                padding: '0 12px',
                fontFamily: 'inherit',
              }}
            >
              <option value="all" style={{ color: '#111827' }}>All</option>
              <option value="high" style={{ color: '#111827' }}>High</option>
              <option value="medium" style={{ color: '#111827' }}>Medium</option>
              <option value="low" style={{ color: '#111827' }}>Low</option>
            </select>

            <button
              type="button"
              onClick={() => setManualOpen((v) => !v)}
              style={{
                height: 40,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#ECE9FF',
                fontFamily: 'inherit',
                fontWeight: 700,
                padding: '0 14px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Plus size={16} /> Manual Add
            </button>
          </div>

          {manualOpen && (
            <div style={{
              border: '1px solid rgba(124,58,237,0.28)',
              background: 'rgba(124,58,237,0.08)',
              borderRadius: 14,
              padding: 12,
              marginBottom: 14,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.8fr 1fr 1fr 1fr auto', gap: 8 }}>
                <input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Task title"
                  style={{
                    height: 38,
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#ECE9FF',
                    padding: '0 10px',
                    fontFamily: 'inherit',
                  }}
                />
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  style={{
                    height: 38,
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#ECE9FF',
                    padding: '0 10px',
                    fontFamily: 'inherit',
                  }}
                />
                <input
                  type="time"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  style={{
                    height: 38,
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#ECE9FF',
                    padding: '0 10px',
                    fontFamily: 'inherit',
                  }}
                />
                <select
                  value={manualPriority}
                  onChange={(e) => setManualPriority(e.target.value)}
                  style={{
                    height: 38,
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#ECE9FF',
                    padding: '0 10px',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="high" style={{ color: '#111827' }}>High</option>
                  <option value="medium" style={{ color: '#111827' }}>Medium</option>
                  <option value="low" style={{ color: '#111827' }}>Low</option>
                </select>
                <button
                  type="button"
                  onClick={addManualTask}
                  style={{
                    height: 38,
                    borderRadius: 10,
                    border: 'none',
                    background: '#8B5CF6',
                    color: '#fff',
                    fontWeight: 700,
                    padding: '0 12px',
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          <div style={{ maxHeight: isMobile ? 'unset' : '64vh', overflowY: 'auto', paddingRight: 4 }}>
            <SectionHeader icon={AlertTriangle} title="Overdue" count={grouped.overdue.length} color="#f87171" />
            <TaskList tasks={grouped.overdue} onToggle={toggleTask} onDelete={removeTask} />

            <SectionHeader icon={CalendarClock} title="Today" count={grouped.today.length} color="#a78bfa" />
            <TaskList tasks={grouped.today} onToggle={toggleTask} onDelete={removeTask} />

            <SectionHeader icon={Calendar} title="Upcoming" count={grouped.upcoming.length} color="#7dd3fc" />
            <TaskList tasks={grouped.upcoming} onToggle={toggleTask} onDelete={removeTask} />
          </div>
        </section>
      </div>
    </div>
  )
}

const TaskList = ({ tasks, onToggle, onDelete }) => {
  if (tasks.length === 0) {
    return (
      <div
        style={{
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 14,
          minHeight: 86,
          color: '#75809E',
          display: 'grid',
          placeItems: 'center',
          marginBottom: 18,
          fontSize: 15,
        }}
      >
        No tasks here yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '10px 12px',
          }}
        >
          <button
            type="button"
            onClick={() => onToggle(task.id)}
            aria-label={task.completed ? 'mark task pending' : 'mark task done'}
            style={{
              border: 'none',
              background: 'transparent',
              color: task.completed ? '#4ade80' : '#7F85A2',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: '0 0 4px',
                color: task.completed ? '#8190AD' : '#ECE9FF',
                textDecoration: task.completed ? 'line-through' : 'none',
                fontWeight: 600,
                fontSize: 15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {task.title}
            </p>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarClock size={13} /> {formatDue(task)}
            </p>
          </div>

          <span style={{ ...priorityStyle(task.priority), borderRadius: 8, fontSize: 11, fontWeight: 700, padding: '4px 8px' }}>
            {task.priority.toUpperCase()}
          </span>

          <button
            type="button"
            onClick={() => onDelete(task.id)}
            aria-label="delete task"
            style={{
              border: 'none',
              background: 'transparent',
              color: '#FCA5A5',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default Todo
