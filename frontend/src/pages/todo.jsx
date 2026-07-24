import { useMemo, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import {
  AlertTriangle,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Circle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react'
// ===== NEW FEATURE: Recharts line chart for weekly consistency trend =====
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useIsMobile } from '../hooks/useIsMobile'

const API_URL = "http://127.0.0.1:8000/todo";

const PRIORITY_ORDER = {
  high: 3,
  medium: 2,
  low: 1,
}

const PRIORITY_OPTIONS = ['high', 'medium', 'low']

const STATUS_OPTIONS = ['Todo', 'Pending', 'In Progress', 'Completed', 'Blocked']

const STATUS_STYLES = {
  Todo: { color: '#7dd3fc', background: 'rgba(125,211,252,0.14)', border: '1px solid rgba(125,211,252,0.28)' },
  Pending: { color: '#fbbf24', background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.28)' },
  'In Progress': { color: '#a78bfa', background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.28)' },
  Completed: { color: '#34d399', background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.28)' },
  Blocked: { color: '#f87171', background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.28)' },
}

const DEFAULT_CATEGORY_OPTIONS = ['General', 'Study', 'Work', 'Interview', 'Health', 'Personal']

const DATE_FILTERS = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'completed', label: 'Completed' },
]

// ===== NEW FEATURE: recurring task options =====
const REPEAT_TYPE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'interval', label: 'Every N Days' },
]

const TIMES_PER_DAY_OPTIONS = [1, 2, 3]

// ===== NEW FEATURE: mock last-7-days consistency data for the line chart. =====
// Used as a fallback while a real analytics endpoint isn't wired up yet.
const MOCK_WEEKLY_CONSISTENCY = [
  { day: 'Mon', score: 72 },
  { day: 'Tue', score: 80 },
  { day: 'Wed', score: 85 },
  { day: 'Thu', score: 83 },
  { day: 'Fri', score: 91 },
  { day: 'Sat', score: 88 },
  { day: 'Sun', score: 95 },
]
const ANALYTICS_API = "http://127.0.0.1:8000/todo/analytics";

/* ------------------------------------------------------------------ */
/* API <-> UI mapping                                                  */
/* Backend uses snake_case. The component only ever touches camelCase. */
/* All conversion happens in these two functions.                      */
/* ------------------------------------------------------------------ */

const mapApiTaskToTask = (apiTask) => ({
  id: apiTask.id,
  title: apiTask.title ?? '',
  description: apiTask.description ?? '',
  category: apiTask.category ?? 'General',
  priority: (apiTask.priority || 'medium').toLowerCase(),
  completed: Boolean(apiTask.completed),
  status: apiTask.status || 'Todo',
  progress: apiTask.progress ?? 0,
  dueDate: apiTask.due_date || '',
  dueTime: apiTask.due_time || '',
  estimatedMinutes: apiTask.estimated_minutes ?? null,
  actualMinutes: apiTask.actual_minutes ?? null,
  reminderMinutesBefore: apiTask.reminder_minutes_before ?? null,
  aiGenerated: Boolean(apiTask.ai_generated),
  completedAt: apiTask.completed_at || null,
  createdAt: apiTask.created_at || null,
  updatedAt: apiTask.updated_at || null,
  // ===== NEW FEATURE: recurring task fields =====
  isRecurring: Boolean(apiTask.is_recurring),
  repeatType: apiTask.repeat_type || 'none',
  repeatInterval: apiTask.repeat_interval ?? null,
  timesPerDay: apiTask.times_per_day ?? 1,
})

const mapTaskToApiPayload = (task) => ({
  title: task.title,
  description: task.description ?? '',
  category: task.category ?? 'General',
  priority: task.priority,
  completed: Boolean(task.completed),
  status: task.status || 'Todo',
  progress: task.progress ?? 0,
  due_date: task.dueDate || null,
  due_time: task.dueTime || null,
  estimated_minutes: task.estimatedMinutes ?? null,
  actual_minutes: task.actualMinutes ?? null,
  reminder_minutes_before: task.reminderMinutesBefore ?? null,
  ai_generated: Boolean(task.aiGenerated),
  completed_at: task.completedAt ?? null,
  // ===== NEW FEATURE: recurring task fields sent to backend =====
  is_recurring: Boolean(task.isRecurring),
  repeat_type: task.isRecurring ? (task.repeatType || 'none') : 'none',
  repeat_interval: task.isRecurring && task.repeatType === 'interval' ? (task.repeatInterval ?? 1) : null,
  times_per_day: task.isRecurring ? (task.timesPerDay ?? 1) : 1,
})

/* ------------------------------------------------------------------ */
/* Status rules                                                        */
/* Changing status drives progress/completed/completedAt automatically.*/
/* Blocked intentionally leaves progress untouched.                    */
/* ------------------------------------------------------------------ */

const getStatusEffects = (status, currentProgress) => {
  switch (status) {
    case 'Todo':
      return { status, progress: 0, completed: false, completedAt: null }
    case 'Pending':
      return { status, progress: 10, completed: false, completedAt: null }
    case 'In Progress':
      return { status, progress: 50, completed: false, completedAt: null }
    case 'Completed':
      return { status, progress: 100, completed: true, completedAt: new Date().toISOString() }
    case 'Blocked':
      return { status, progress: currentProgress ?? 0, completed: false, completedAt: null }
    default:
      return { status: 'Todo', progress: 0, completed: false, completedAt: null }
  }
}

// ===== NEW FEATURE: human-readable label for the recurring badge =====
const getRecurringBadgeLabel = (task) => {
  if (!task.isRecurring) return null
  if (task.repeatType === 'daily') return '🔁 Daily'
  if (task.repeatType === 'weekly') return '🔁 Weekly'
  if (task.repeatType === 'interval') {
    const n = task.repeatInterval || 1
    return `🔁 Every ${n} Day${n > 1 ? 's' : ''}`
  }
  return '🔁 Recurring'
}

/* ------------------------------------------------------------------ */
/* Date helpers                                                        */
/* dueDate is a plain "YYYY-MM-DD" string. Feeding that straight into  */
/* `new Date(str)` parses it as UTC midnight, which then renders as    */
/* the previous day in any timezone behind UTC. parseDateOnly() below  */
/* builds the Date in local time instead, so comparisons and labels    */
/* are always correct regardless of the viewer's timezone.             */
/* ------------------------------------------------------------------ */

const parseDateOnly = (dateStr) => {
  if (!dateStr) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return date
}

const startOfToday = () => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

const isOverdue = (task) => {
  if (task.completed || !task.dueDate) return false

  let due

  if (task.dueTime) {
    due = new Date(`${task.dueDate}T${task.dueTime}`)
  } else {
    due = new Date(task.dueDate)
    due.setHours(23, 59, 59, 999)
  }

  return due < new Date()
}

const isToday = (task) => {
  if (!task.dueDate || isOverdue(task)) return false

  const today = new Date()
  const due = new Date(task.dueDate)

  return (
    due.getFullYear() === today.getFullYear() &&
    due.getMonth() === today.getMonth() &&
    due.getDate() === today.getDate()
  )
}

const isUpcoming = (task) => {
  const due = parseDateOnly(task.dueDate)
  return Boolean(due) && due > startOfToday() && !task.completed
}

const formatDueTime = (dueTime) => {
  if (!dueTime) return ''
  const [hoursStr, minutesStr] = dueTime.split(':')
  const hours = Number(hoursStr)
  const minutes = Number(minutesStr)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return ''

  const reference = new Date()
  reference.setHours(hours, minutes, 0, 0)
  return reference.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// "Jul 24, 2026" or "Jul 24, 2026 • 10:30 PM" when a due time is set.
const formatDue = (task) => {
  const due = parseDateOnly(task.dueDate)
  if (!due) return 'No due date'

  const dateLabel = due.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const timeLabel = formatDueTime(task.dueTime)
  return timeLabel ? `${dateLabel} • ${timeLabel}` : dateLabel
}

/* ------------------------------------------------------------------ */
/* AI natural-language parser                                          */
/* ------------------------------------------------------------------ */

const toIsoDate = (date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
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
    dueDate = toIsoDate(d)
  } else if (/\btoday\b/.test(lower)) {
    dueDate = toIsoDate(now)
  } else {
    const dateMatch = lower.match(/\b(\d{4}-\d{2}-\d{2})\b/)
    if (dateMatch) {
      dueDate = dateMatch[1]
    }
  }

  const timeMatch = input.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i)
  let dueTime = ''
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
      dueTime = `${hh}:${mm}`
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
    title,
    priority,
    dueDate,
    dueTime,
  }
}

/* ------------------------------------------------------------------ */
/* Presentational helpers                                              */
/* ------------------------------------------------------------------ */

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

const statusStyle = (status) => STATUS_STYLES[status] || STATUS_STYLES.Todo

// ===== NEW FEATURE: badge style for the recurring indicator =====
const recurringBadgeStyle = {
  color: '#a78bfa',
  background: 'rgba(139,92,246,0.14)',
  border: '1px solid rgba(139,92,246,0.28)',
}

// ===== NEW FEATURE: badge style for the "times per day" indicator =====
const timesPerDayBadgeStyle = {
  color: '#7dd3fc',
  background: 'rgba(125,211,252,0.14)',
  border: '1px solid rgba(125,211,252,0.28)',
}

const badgeBaseStyle = {
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 700,
  padding: '4px 8px',
  whiteSpace: 'nowrap',
}

const selectStyle = {
  height: 40,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: '#ECE9FF',
  padding: '0 12px',
  fontFamily: 'inherit',
}

const inputStyle = {
  height: 38,
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)',
  color: '#ECE9FF',
  padding: '0 10px',
  fontFamily: 'inherit',
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

const StatTile = ({ label, value, color }) => (
  <div
    style={{
      borderRadius: 12,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.05)',
      padding: '10px 8px',
      textAlign: 'center',
    }}
  >
    <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, margin: '0 auto 6px' }} />
    <p style={{ margin: 0, fontSize: 13, color: '#B5BAD0' }}>{label}</p>
    <p style={{ margin: '2px 0 0', fontSize: 24 ? 20 : 20, color: '#ECE9FF', fontWeight: 700 }}>{value}</p>
  </div>
)

const ProgressBar = ({ progress }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
    <div style={{ flex: 1, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <div
        style={{
          width: `${Math.min(100, Math.max(0, progress || 0))}%`,
          height: '100%',
          borderRadius: 999,
          background: 'linear-gradient(90deg, #8B5CF6, #EC4899)',
        }}
      />
    </div>
    <span style={{ fontSize: 11, color: '#8F97B3', minWidth: 30, textAlign: 'right' }}>{progress || 0}%</span>
  </div>
)

/* Small "⏱ 60 min  🔔 15 min before" line shown under the due date. */
/* Renders nothing at all if neither value exists on the task.        */
const TaskMetaLine = ({ estimatedMinutes, reminderMinutesBefore }) => {
  if (!estimatedMinutes && !reminderMinutesBefore) return null

  return (
    <p
      style={{
        margin: '2px 0 0',
        color: '#8F97B3',
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {estimatedMinutes ? <span>⏱ {estimatedMinutes} min</span> : null}
      {reminderMinutesBefore ? <span>🔔 {reminderMinutesBefore} min before</span> : null}
    </p>
  )
}

const TaskList = ({ tasks, onToggle, onDelete, onEdit, onStatusChange }) => {
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

          {/* ===== NEW FEATURE: quick-delete trash icon shown beside the complete toggle once a task is done ===== */}
          {task.completed ? (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              aria-label="delete completed task"
              title="Delete completed task"
              style={{
                border: 'none',
                background: 'transparent',
                color: '#FCA5A5',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                opacity: 0.8,
              }}
            >
              <Trash2 size={14} />
            </button>
          ) : null}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                  maxWidth: '100%',
                }}
              >
                {task.title}
              </p>
              <span style={{ fontSize: 11, color: '#8F97B3', marginBottom: 4 }}>{task.category}</span>

              {/* ===== NEW FEATURE: recurring badge (Daily / Weekly / Every N Days) ===== */}
              {task.isRecurring ? (
                <span style={{ ...badgeBaseStyle, ...recurringBadgeStyle, marginBottom: 4 }}>
                  {getRecurringBadgeLabel(task)}
                </span>
              ) : null}

              {/* ===== NEW FEATURE: "Nx/day" badge when a recurring task runs more than once a day ===== */}
              {task.isRecurring && task.timesPerDay > 1 ? (
                <span style={{ ...badgeBaseStyle, ...timesPerDayBadgeStyle, marginBottom: 4 }}>
                  {task.timesPerDay}x/day
                </span>
              ) : null}
            </div>

            {task.description ? (
              <p
                style={{
                  margin: '0 0 4px',
                  color: '#8F97B3',
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {task.description}
              </p>
            ) : null}

            <p style={{ margin: 0, color: '#94A3B8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarClock size={13} /> {formatDue(task)}
            </p>

            <TaskMetaLine
              estimatedMinutes={task.estimatedMinutes}
              reminderMinutesBefore={task.reminderMinutesBefore}
            />

            <ProgressBar progress={task.progress} />
          </div>

          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            style={{
              ...statusStyle(task.status),
              ...badgeBaseStyle,
              cursor: 'pointer',
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option} style={{ color: '#111827' }}>
                {option}
              </option>
            ))}
          </select>

          <span style={{ ...priorityStyle(task.priority), ...badgeBaseStyle }}>
            {task.priority.toUpperCase()}
          </span>

          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label="edit task"
            style={{
              border: 'none',
              background: 'transparent',
              color: '#B58DFF',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Pencil size={16} />
          </button>

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

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'General',
  customCategory: '',
  priority: 'medium',
  status: 'Todo',
  dueDate: '',
  dueTime: '',
  estimatedMinutes: '',
  reminderMinutesBefore: '',
  // ===== NEW FEATURE: recurring defaults =====
  isRecurring: false,
  repeatType: 'none',
  repeatInterval: '',
  timesPerDay: 1,
}

const EditTaskModal = ({ task, categoryOptions, onSave, onClose }) => {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (!task) return
    const isKnownCategory = categoryOptions.includes(task.category)
    setForm({
      title: task.title || '',
      description: task.description || '',
      category: isKnownCategory ? task.category : 'Custom',
      customCategory: isKnownCategory ? '' : task.category || '',
      priority: task.priority || 'medium',
      status: task.status || 'Todo',
      dueDate: task.dueDate || '',
      dueTime: task.dueTime || '',
      estimatedMinutes: task.estimatedMinutes ?? '',
      reminderMinutesBefore: task.reminderMinutesBefore ?? '',
      // ===== NEW FEATURE: pre-fill recurring fields when editing an existing task =====
      isRecurring: Boolean(task.isRecurring),
      repeatType: task.repeatType || 'none',
      repeatInterval: task.repeatInterval ?? '',
      timesPerDay: task.timesPerDay ?? 1,
    })
  }, [task, categoryOptions])

  if (!task) return null

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSave = () => {
    const title = form.title.trim()
    if (!title) return

    const category = form.category === 'Custom' ? form.customCategory.trim() || 'General' : form.category

    onSave(task.id, {
      title,
      description: form.description,
      category,
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate || null,
      dueTime: form.dueTime || null,
      estimatedMinutes: form.estimatedMinutes === '' ? null : Number(form.estimatedMinutes),
      reminderMinutesBefore: form.reminderMinutesBefore === '' ? null : Number(form.reminderMinutesBefore),
      // ===== NEW FEATURE: recurring fields included in the save payload =====
      isRecurring: form.isRecurring,
      repeatType: form.isRecurring ? form.repeatType : 'none',
      repeatInterval:
        form.isRecurring && form.repeatType === 'interval'
          ? Number(form.repeatInterval) || 1
          : null,
      timesPerDay: form.isRecurring ? Number(form.timesPerDay) || 1 : 1,
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,6,16,0.6)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, rgba(26,20,45,0.98), rgba(18,14,31,0.98))',
          border: '1px solid rgba(124,58,237,0.24)',
          borderRadius: 18,
          padding: 22,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#F3EEFF' }}>Edit Task</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="close edit task"
            style={{ border: 'none', background: 'transparent', color: '#9DA4C0', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Task title"
            style={{ ...inputStyle, width: '100%' }}
          />

          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Description"
            style={{
              ...inputStyle,
              height: 84,
              paddingTop: 8,
              resize: 'vertical',
              width: '100%',
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <select value={form.category} onChange={(e) => updateField('category', e.target.value)} style={selectStyle}>
              {categoryOptions.map((option) => (
                <option key={option} value={option} style={{ color: '#111827' }}>
                  {option}
                </option>
              ))}
              <option value="Custom" style={{ color: '#111827' }}>Custom…</option>
            </select>

            <select value={form.priority} onChange={(e) => updateField('priority', e.target.value)} style={selectStyle}>
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option} value={option} style={{ color: '#111827' }}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {form.category === 'Custom' && (
            <input
              value={form.customCategory}
              onChange={(e) => updateField('customCategory', e.target.value)}
              placeholder="Custom category name"
              style={{ ...inputStyle, width: '100%' }}
            />
          )}

          <select value={form.status} onChange={(e) => updateField('status', e.target.value)} style={selectStyle}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option} style={{ color: '#111827' }}>
                {option}
              </option>
            ))}
          </select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input type="date" value={form.dueDate} onChange={(e) => updateField('dueDate', e.target.value)} style={inputStyle} />
            <input type="time" value={form.dueTime} onChange={(e) => updateField('dueTime', e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input
              type="number"
              min="0"
              value={form.estimatedMinutes}
              onChange={(e) => updateField('estimatedMinutes', e.target.value)}
              placeholder="Estimated minutes"
              style={inputStyle}
            />
            <input
              type="number"
              min="0"
              value={form.reminderMinutesBefore}
              onChange={(e) => updateField('reminderMinutesBefore', e.target.value)}
              placeholder="Remind before (min)"
              style={inputStyle}
            />
          </div>

          {/* ===== NEW FEATURE: recurring task controls ===== */}
          <div
            style={{
              border: '1px solid rgba(124,58,237,0.2)',
              background: 'rgba(124,58,237,0.06)',
              borderRadius: 12,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                color: '#ECE9FF',
              }}
            >
              Recurring Task
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isRecurring: e.target.checked,
                    repeatType: e.target.checked ? (prev.repeatType === 'none' ? 'daily' : prev.repeatType) : 'none',
                  }))
                }
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
            </label>

            {form.isRecurring ? (
              <>
                <select
                  value={form.repeatType}
                  onChange={(e) => updateField('repeatType', e.target.value)}
                  style={selectStyle}
                >
                  {REPEAT_TYPE_OPTIONS.filter((option) => option.value !== 'none').map((option) => (
                    <option key={option.value} value={option.value} style={{ color: '#111827' }}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {form.repeatType === 'interval' ? (
                  <input
                    type="number"
                    min="1"
                    value={form.repeatInterval}
                    onChange={(e) => updateField('repeatInterval', e.target.value)}
                    placeholder="Repeat every N days"
                    style={{ ...inputStyle, width: '100%' }}
                  />
                ) : null}

                <select
                  value={form.timesPerDay}
                  onChange={(e) => updateField('timesPerDay', Number(e.target.value))}
                  style={selectStyle}
                >
                  {TIMES_PER_DAY_OPTIONS.map((option) => (
                    <option key={option} value={option} style={{ color: '#111827' }}>
                      {option}x per day
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#ECE9FF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(90deg, #8B5CF6, #EC4899)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

const Todo = () => {
  const isMobile = useIsMobile()

  const [tasks, setTasks] = useState([])
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [aiInput, setAiInput] = useState('')
  const [manualOpen, setManualOpen] = useState(false)
  const [manualTitle, setManualTitle] = useState('')
  const [manualDescription, setManualDescription] = useState('')
  const [manualDate, setManualDate] = useState('')
  const [manualTime, setManualTime] = useState('')
  const [manualPriority, setManualPriority] = useState('high')
  const [manualCategory, setManualCategory] = useState('General')
  const [manualStatus, setManualStatus] = useState('Todo')
  const [manualEstimatedMinutes, setManualEstimatedMinutes] = useState('')
  const [manualReminderMinutesBefore, setManualReminderMinutesBefore] = useState('')
  // ===== NEW FEATURE: manual-add recurring state =====
  const [manualIsRecurring, setManualIsRecurring] = useState(false)
  const [manualRepeatType, setManualRepeatType] = useState('daily')
  const [manualRepeatInterval, setManualRepeatInterval] = useState('')
  const [manualTimesPerDay, setManualTimesPerDay] = useState(1)
  const [editingTask, setEditingTask] = useState(null)

  const loadTasks = useCallback(async () => {
    try {
      const response = await axios.get(API_URL)
      setTasks(response.data.map(mapApiTaskToTask))
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }, [])
  const loadWeeklyAnalytics = useCallback(async () => {
  try {
    const response = await axios.get(`${ANALYTICS_API}/weekly`);
    setWeeklyTrend(response.data);
  } catch (err) {
    console.error("Analytics Error:", err);
    setWeeklyTrend(MOCK_WEEKLY_CONSISTENCY);
  }
}, []);

  useEffect(() => {
    loadTasks()
    loadWeeklyAnalytics()
  }, [loadTasks, loadWeeklyAnalytics])

  const createTask = async (taskDraft) => {
    try {
      await axios.post(API_URL, mapTaskToApiPayload(taskDraft))
      await loadTasks()
      return true
    } catch (error) {
      console.error('Error creating task:', error)
      return false
    }
  }

  const addManualTask = async () => {
    const title = manualTitle.trim()
    if (!title) return

    const statusEffects = getStatusEffects(manualStatus, 0)

    const created = await createTask({
      title,
      description: manualDescription,
      category: manualCategory || 'General',
      priority: manualPriority,
      completed: statusEffects.completed,
      status: statusEffects.status,
      progress: statusEffects.progress,
      dueDate: manualDate || null,
      dueTime: manualTime || null,
      estimatedMinutes: manualEstimatedMinutes === '' ? null : Number(manualEstimatedMinutes),
      actualMinutes: null,
      reminderMinutesBefore: manualReminderMinutesBefore === '' ? null : Number(manualReminderMinutesBefore),
      aiGenerated: false,
      completedAt: statusEffects.completedAt,
      // ===== NEW FEATURE: recurring fields on manual add =====
      isRecurring: manualIsRecurring,
      repeatType: manualIsRecurring ? manualRepeatType : 'none',
      repeatInterval:
        manualIsRecurring && manualRepeatType === 'interval'
          ? Number(manualRepeatInterval) || 1
          : null,
      timesPerDay: manualIsRecurring ? Number(manualTimesPerDay) || 1 : 1,
    })

    if (created) {
      setManualTitle('')
      setManualDescription('')
      setManualDate('')
      setManualTime('')
      setManualPriority('high')
      setManualCategory('General')
      setManualStatus('Todo')
      setManualEstimatedMinutes('')
      setManualReminderMinutesBefore('')
      // ===== NEW FEATURE: reset recurring fields after successful add =====
      setManualIsRecurring(false)
      setManualRepeatType('daily')
      setManualRepeatInterval('')
      setManualTimesPerDay(1)
      setManualOpen(false)
    }
  }

  const addAiTask = async () => {
    const parsed = parseAiTask(aiInput)
    if (!parsed) return

    const created = await createTask({
      title: parsed.title,
      description: '',
      category: 'General',
      priority: parsed.priority,
      completed: false,
      status: 'Todo',
      progress: 0,
      dueDate: parsed.dueDate || null,
      dueTime: parsed.dueTime || null,
      estimatedMinutes: null,
      actualMinutes: null,
      reminderMinutesBefore: null,
      aiGenerated: true,
      completedAt: null,
      // ===== NEW FEATURE: AI-created tasks default to non-recurring =====
      isRecurring: false,
      repeatType: 'none',
      repeatInterval: null,
      timesPerDay: 1,
    })

    if (created) {
      setAiInput('')
    }
  }

  const updateTask = useCallback(
    async (id, changes) => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return

      const updated = { ...task, ...changes }

      try {
        await axios.put(`${API_URL}/${id}`, mapTaskToApiPayload(updated))
        await loadTasks()
      } catch (error) {
        console.error('Error updating task:', error)
      }
    },
    [tasks, loadTasks]
  )

  const toggleTask = useCallback(
    (id) => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return

      const nextStatus = task.completed ? 'Todo' : 'Completed'
      updateTask(id, getStatusEffects(nextStatus, task.progress))
    },
    [tasks, updateTask]
  )

  const changeTaskStatus = useCallback(
    (id, nextStatus) => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return
      updateTask(id, getStatusEffects(nextStatus, task.progress))
    },
    [tasks, updateTask]
  )

  const saveEditedTask = useCallback(
    async (id, changes) => {
      await updateTask(id, changes)
      setEditingTask(null)
    },
    [updateTask]
  )

  const removeTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`)
      await loadTasks()
    } catch (error) {
      console.error('Error removing task:', error)
    }
  }

  const categoryOptions = useMemo(() => {
    const fromTasks = tasks.map((task) => task.category).filter(Boolean)
    return Array.from(new Set([...DEFAULT_CATEGORY_OPTIONS, ...fromTasks]))
  }, [tasks])

  const matchesDateFilter = useCallback((task, filter) => {
    if (filter === 'all') return true
    if (filter === 'today') return isToday(task) && !task.completed
    if (filter === 'upcoming') return isUpcoming(task)
    if (filter === 'overdue') return isOverdue(task)
    if (filter === 'completed') return task.completed
    return true
  }, [])

  const visibleTasks = useMemo(() => {
    const q = query.trim().toLowerCase()

    return tasks
      .filter((task) => {
        const haystack = [task.title, task.description, task.category, task.priority, task.status]
          .join(' ')
          .toLowerCase()
        const matchesQuery = !q || haystack.includes(q)
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter
        const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter
        const matchesDate = matchesDateFilter(task, dateFilter)
        return matchesQuery && matchesPriority && matchesStatus && matchesCategory && matchesDate
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1

        const scoreA = PRIORITY_ORDER[a.priority] + (isOverdue(a) ? 2 : 0) + (isToday(a) ? 1 : 0)
        const scoreB = PRIORITY_ORDER[b.priority] + (isOverdue(b) ? 2 : 0) + (isToday(b) ? 1 : 0)
        if (scoreA !== scoreB) return scoreB - scoreA

        const aDate = parseDateOnly(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER
        const bDate = parseDateOnly(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER
        return aDate - bDate
      })
  }, [tasks, query, priorityFilter, statusFilter, categoryFilter, dateFilter, matchesDateFilter])

  const grouped = useMemo(() => {
    const overdue = visibleTasks.filter((task) => isOverdue(task))
    const today = visibleTasks.filter((task) => !isOverdue(task) && isToday(task))
    const upcoming = visibleTasks.filter((task) => !isOverdue(task) && !isToday(task))
    return { overdue, today, upcoming }
  }, [visibleTasks])

  const stats = useMemo(() => {
    const total = tasks.length
    const countByStatus = (status) => tasks.filter((task) => task.status === status).length

    const high = tasks.filter((task) => task.priority === 'high' && !task.completed).length
    const medium = tasks.filter((task) => task.priority === 'medium' && !task.completed).length
    const low = tasks.filter((task) => task.priority === 'low' && !task.completed).length

    const overdueCount = tasks.filter((task) => isOverdue(task)).length
    const todayCount = tasks.filter((task) => isToday(task) && !task.completed).length
    const upcomingCount = tasks.filter((task) => isUpcoming(task)).length

    const percent = total
      ? Math.round(tasks.reduce((sum, task) => sum + (task.progress || 0), 0) / total)
      : 0

    const done = countByStatus('Completed')

    // ===== NEW FEATURE: Consistency Score = completed / total * 100 =====
    const consistencyScore = total ? Math.round((done / total) * 100) : 0

    return {
      total,
      done,
      pending: countByStatus('Pending'),
      inProgress: countByStatus('In Progress'),
      blocked: countByStatus('Blocked'),
      high,
      medium,
      low,
      percent,
      overdueCount,
      todayCount,
      upcomingCount,
      consistencyScore,
    }
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
              <StatTile label="High" value={stats.high} color="#f87171" />
              <StatTile label="Medium" value={stats.medium} color="#fbbf24" />
              <StatTile label="Low" value={stats.low} color="#34d399" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
              <StatTile label="Completed" value={stats.done} color="#34d399" />
              <StatTile label="Pending" value={stats.pending} color="#fbbf24" />
              <StatTile label="In Progress" value={stats.inProgress} color="#a78bfa" />
              <StatTile label="Blocked" value={stats.blocked} color="#f87171" />
              <StatTile label="Overdue" value={stats.overdueCount} color="#f87171" />
              <StatTile label="Today" value={stats.todayCount} color="#7dd3fc" />
              <StatTile label="Upcoming" value={stats.upcomingCount} color="#7dd3fc" />
              <StatTile label="Total" value={stats.total} color="#B58DFF" />
              {/* ===== NEW FEATURE: Consistency Score tile (completed / total * 100) ===== */}
              <StatTile label="Consistency" value={`${stats.consistencyScore}%`} color="#EC4899" />
            </div>

            {/* ===== NEW FEATURE: last 7 days completion trend line chart ===== */}
            <div style={{ marginTop: 18 }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#E8E3FD' }}>
                Last 7 Days Trend
              </p>
              <div style={{ width: '100%', height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#8F97B3', fontSize: 11 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#8F97B3', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={34}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1B1530',
                        border: '1px solid rgba(124,58,237,0.28)',
                        borderRadius: 8,
                        color: '#ECE9FF',
                        fontSize: 12,
                      }}
                      formatter={(value) => [`${value}%`, 'Completion']}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#EC4899' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
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
            marginBottom: 10,
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
              style={selectStyle}
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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: 10,
              marginBottom: 16,
            }}
          >
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
              <option value="all" style={{ color: '#111827' }}>All Statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option} style={{ color: '#111827' }}>
                  {option}
                </option>
              ))}
            </select>

            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={selectStyle}>
              <option value="all" style={{ color: '#111827' }}>All Categories</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option} style={{ color: '#111827' }}>
                  {option}
                </option>
              ))}
            </select>

            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={selectStyle}>
              {DATE_FILTERS.map((option) => (
                <option key={option.value} value={option.value} style={{ color: '#111827' }}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {manualOpen && (
            <div style={{
              border: '1px solid rgba(124,58,237,0.28)',
              background: 'rgba(124,58,237,0.08)',
              borderRadius: 14,
              padding: 12,
              marginBottom: 14,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr 1fr 1fr 1fr auto', gap: 8 }}>
                <input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Task title"
                  style={{ ...inputStyle, width: '100%' }}
                />
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="time"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  style={inputStyle}
                />
                <select
                  value={manualPriority}
                  onChange={(e) => setManualPriority(e.target.value)}
                  style={inputStyle}
                >
                  <option value="high" style={{ color: '#111827' }}>High</option>
                  <option value="medium" style={{ color: '#111827' }}>Medium</option>
                  <option value="low" style={{ color: '#111827' }}>Low</option>
                </select>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  style={inputStyle}
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option} style={{ color: '#111827' }}>
                      {option}
                    </option>
                  ))}
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

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
                <textarea
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="Description (optional)"
                  style={{
                    ...inputStyle,
                    height: 38,
                    minHeight: 38,
                    paddingTop: 8,
                    resize: 'vertical',
                    width: '100%',
                  }}
                />
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value)}
                  style={inputStyle}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option} style={{ color: '#111827' }}>
                      {option}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  value={manualEstimatedMinutes}
                  onChange={(e) => setManualEstimatedMinutes(e.target.value)}
                  placeholder="Estimated minutes"
                  style={inputStyle}
                />
                <input
                  type="number"
                  min="0"
                  value={manualReminderMinutesBefore}
                  onChange={(e) => setManualReminderMinutesBefore(e.target.value)}
                  placeholder="Remind before (min)"
                  style={inputStyle}
                />
              </div>

              {/* ===== NEW FEATURE: manual-add recurring controls ===== */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr 1fr 1fr',
                  gap: 8,
                  marginTop: 8,
                  alignItems: 'center',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#ECE9FF',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={manualIsRecurring}
                    onChange={(e) => setManualIsRecurring(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  Recurring
                </label>

                <select
                  value={manualRepeatType}
                  onChange={(e) => setManualRepeatType(e.target.value)}
                  disabled={!manualIsRecurring}
                  style={{ ...inputStyle, opacity: manualIsRecurring ? 1 : 0.5 }}
                >
                  {REPEAT_TYPE_OPTIONS.filter((option) => option.value !== 'none').map((option) => (
                    <option key={option.value} value={option.value} style={{ color: '#111827' }}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {manualIsRecurring && manualRepeatType === 'interval' ? (
                  <input
                    type="number"
                    min="1"
                    value={manualRepeatInterval}
                    onChange={(e) => setManualRepeatInterval(e.target.value)}
                    placeholder="Every N days"
                    style={inputStyle}
                  />
                ) : (
                  <div />
                )}

                <select
                  value={manualTimesPerDay}
                  onChange={(e) => setManualTimesPerDay(Number(e.target.value))}
                  disabled={!manualIsRecurring}
                  style={{ ...inputStyle, opacity: manualIsRecurring ? 1 : 0.5 }}
                >
                  {TIMES_PER_DAY_OPTIONS.map((option) => (
                    <option key={option} value={option} style={{ color: '#111827' }}>
                      {option}x per day
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div style={{ maxHeight: isMobile ? 'unset' : '64vh', overflowY: 'auto', paddingRight: 4 }}>
            <SectionHeader icon={AlertTriangle} title="Overdue" count={grouped.overdue.length} color="#f87171" />
            <TaskList
              tasks={grouped.overdue}
              onToggle={toggleTask}
              onDelete={removeTask}
              onEdit={setEditingTask}
              onStatusChange={changeTaskStatus}
            />

            <SectionHeader icon={CalendarClock} title="Today" count={grouped.today.length} color="#a78bfa" />
            <TaskList
              tasks={grouped.today}
              onToggle={toggleTask}
              onDelete={removeTask}
              onEdit={setEditingTask}
              onStatusChange={changeTaskStatus}
            />

            <SectionHeader icon={Calendar} title="Upcoming" count={grouped.upcoming.length} color="#7dd3fc" />
            <TaskList
              tasks={grouped.upcoming}
              onToggle={toggleTask}
              onDelete={removeTask}
              onEdit={setEditingTask}
              onStatusChange={changeTaskStatus}
            />
          </div>
        </section>
      </div>

      <EditTaskModal
        task={editingTask}
        categoryOptions={categoryOptions}
        onSave={saveEditedTask}
        onClose={() => setEditingTask(null)}
      />
    </div>
  )
}

export default Todo
