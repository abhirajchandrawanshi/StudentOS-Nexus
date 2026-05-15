import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts'
import {
  Flame, Code2, Brain, Target, TrendingUp,
  BookOpen, Mic, Calendar, ArrowRight, Zap, Clock
} from 'lucide-react'
import useAuthStore from '../store/authStore'
 
// ─── Mock Data (replace with API calls later) ─────────────────────
 
const STUDY_ACTIVITY = [
  { day: 'Mon', hours: 2.5 },
  { day: 'Tue', hours: 4 },
  { day: 'Wed', hours: 1.5 },
  { day: 'Thu', hours: 5 },
  { day: 'Fri', hours: 3 },
  { day: 'Sat', hours: 6 },
  { day: 'Sun', hours: 2 },
]
 
const DSA_TOPICS = [
  { topic: 'Arrays',     solved: 42, total: 50, color: '#6366f1' },
  { topic: 'Trees',      solved: 28, total: 45, color: '#8b5cf6' },
  { topic: 'Graphs',     solved: 12, total: 40, color: '#ec4899' },
  { topic: 'DP',         solved: 18, total: 50, color: '#f59e0b' },
  { topic: 'Strings',    solved: 35, total: 40, color: '#10b981' },
]
 
const RECOMMENDATIONS = [
  {
    id: 1,
    type: 'dsa',
    icon: Code2,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    title: 'Practice Graph BFS/DFS',
    desc: 'Your weakest topic — only 30% solved',
    action: 'Start practicing',
    path: '/app/dsa',
  },
  {
    id: 2,
    type: 'notes',
    icon: BookOpen,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    title: 'Revise OS concepts',
    desc: 'Exam in 5 days — flagged for revision',
    action: 'Open notes',
    path: '/app/notes',
  },
  {
    id: 3,
    type: 'interview',
    icon: Mic,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    title: 'Mock HR Interview',
    desc: 'You haven\'t practiced in 3 days',
    action: 'Start session',
    path: '/app/interviewer',
  },
]
 
const UPCOMING_TASKS = [
  { id: 1, title: 'DBMS Assignment',    due: 'Today, 11:59 PM',  priority: 'high' },
  { id: 2, title: 'DSA Contest — CF',   due: 'Tomorrow, 8:00 PM', priority: 'medium' },
  { id: 3, title: 'CN Unit 4 Revision', due: 'In 3 days',         priority: 'low' },
]
 
const PRIORITY_COLORS = {
  high:   'bg-red-500/15 text-red-400 border-red-500/20',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  low:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
}
 
// ─── Subcomponents ────────────────────────────────────────────────
 
// Stat card
const StatCard = ({ icon: Icon, label, value, sub, color, bgColor }) => (
  <div className="bg-[#0d1526] border border-white/6 rounded-xl p-4 flex items-start gap-4">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bgColor}`}>
      <Icon size={18} className={color} />
    </div>
    <div className="min-w-0">
      <p className="text-slate-500 text-xs font-medium mb-0.5">{label}</p>
      <p className="text-white text-xl font-semibold leading-tight">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
    </div>
  </div>
)
 
// Section header
const SectionHeader = ({ title, action, path }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-white font-semibold text-sm">{title}</h2>
    {action && (
      <button className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 transition-colors">
        {action} <ArrowRight size={12} />
      </button>
    )}
  </div>
)
 
// Custom tooltip for area chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1a2235] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-slate-400 text-xs">{label}</p>
        <p className="text-white text-sm font-semibold">{payload[0].value}h studied</p>
      </div>
    )
  }
  return null
}
 
// DSA topic bar
const TopicBar = ({ topic, solved, total, color }) => {
  const pct = Math.round((solved / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-xs w-14 shrink-0">{topic}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-slate-500 text-xs w-16 text-right shrink-0">
        {solved}/{total}
      </span>
    </div>
  )
}
 
// ─── Main Dashboard ───────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuthStore()
  const firstName = user?.name?.split(' ')[0] || 'Student'
 
  // Greeting based on time
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' : 'Good evening'
 
  return (
    <div className="max-w-7xl mx-auto space-y-6">
 
      {/* ── Header greeting ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-2xl font-semibold">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Here's your academic snapshot for today
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0d1526] border border-white/6 rounded-lg px-3 py-2">
          <Clock size={13} className="text-slate-500" />
          <span className="text-slate-400 text-xs">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', day: 'numeric', month: 'short'
            })}
          </span>
        </div>
      </div>
 
      {/* ── Stat cards row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Flame}
          label="Study Streak"
          value="12 days"
          sub="Personal best: 18"
          color="text-orange-400"
          bgColor="bg-orange-500/10"
        />
        <StatCard
          icon={Code2}
          label="LeetCode Solved"
          value="247"
          sub="↑ 8 this week"
          color="text-indigo-400"
          bgColor="bg-indigo-500/10"
        />
        <StatCard
          icon={Target}
          label="Placement Readiness"
          value="74%"
          sub="↑ 3% from last week"
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
        />
        <StatCard
          icon={Brain}
          label="Focus Score"
          value="8.2 / 10"
          sub="Above average"
          color="text-purple-400"
          bgColor="bg-purple-500/10"
        />
      </div>
 
      {/* ── Middle row: chart + DSA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 
        {/* Study activity chart — 2/3 width */}
        <div className="lg:col-span-2 bg-[#0d1526] border border-white/6 rounded-xl p-5">
          <SectionHeader title="Study activity — this week" action="Full report" />
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={STUDY_ACTIVITY} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}h`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#studyGrad)"
                dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
                activeDot={{ fill: '#818cf8', r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
 
        {/* DSA topic breakdown — 1/3 width */}
        <div className="bg-[#0d1526] border border-white/6 rounded-xl p-5">
          <SectionHeader title="DSA progress" action="View all" />
          <div className="space-y-4 mt-2">
            {DSA_TOPICS.map((t) => (
              <TopicBar key={t.topic} {...t} />
            ))}
          </div>
          {/* Summary */}
          <div className="mt-5 pt-4 border-t border-white/6 flex items-center justify-between">
            <span className="text-slate-500 text-xs">Total solved</span>
            <span className="text-white text-sm font-semibold">
              135 <span className="text-slate-600 font-normal">/ 225</span>
            </span>
          </div>
        </div>
      </div>
 
      {/* ── Bottom row: recommendations + tasks ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 
        {/* AI Recommendations */}
        <div className="bg-[#0d1526] border border-white/6 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={15} className="text-indigo-400" />
            <h2 className="text-white font-semibold text-sm">AI Recommendations</h2>
          </div>
          <div className="space-y-3">
            {RECOMMENDATIONS.map((rec) => {
              const Icon = rec.icon
              return (
                <div
                  key={rec.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${rec.bg} ${rec.border} group cursor-pointer hover:opacity-90 transition-opacity`}
                >
                  <div className={`w-8 h-8 rounded-lg ${rec.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={15} className={rec.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium leading-tight">{rec.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{rec.desc}</p>
                  </div>
                  <ArrowRight size={14} className={`${rec.color} shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
              )
            })}
          </div>
        </div>
 
        {/* Upcoming tasks */}
        <div className="bg-[#0d1526] border border-white/6 rounded-xl p-5">
          <SectionHeader title="Upcoming tasks" action="Open planner" />
          <div className="space-y-3">
            {UPCOMING_TASKS.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-white/2 hover:bg-white/4 rounded-lg transition-colors cursor-pointer"
              >
                {/* Checkbox placeholder */}
                <div className="w-4 h-4 rounded border border-white/15 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{task.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                    <Clock size={10} /> {task.due}
                  </p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${PRIORITY_COLORS[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
 
          {/* Quick add task */}
          <button className="w-full mt-3 py-2 border border-dashed border-white/10 rounded-lg text-slate-600 text-xs hover:border-indigo-500/30 hover:text-indigo-400 transition-all">
            + Add task
          </button>
        </div>
      </div>
 
    </div>
  )
}
 
export default Dashboard