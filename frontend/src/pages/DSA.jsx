import { useEffect, useState } from 'react'
import { useBreakpoint } from '../hooks/useIsMobile'
import api from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
  LineChart, Line,
} from 'recharts'
import {
  Code2, Trophy, Flame, Target, BarChart2,
  AlertTriangle, ExternalLink, ChevronDown,
  ChevronRight, Zap, CheckCircle2, Circle,
  Play, Filter, LayoutList, BarChart as BarChartIcon,
} from 'lucide-react'

// ── Mock Data ──────────────────────────────────────────────────────
const STATS = {
  totalSolved: 247, easy: 98, medium: 119, hard: 30,
  streak: 12, ranking: 182340, acceptance: 63.4,
}

const RADAR_DATA = [
  { topic: 'Arrays',  score: 84 },
  { topic: 'Strings', score: 88 },
  { topic: 'Trees',   score: 62 },
  { topic: 'Graphs',  score: 30 },
  { topic: 'DP',      score: 36 },
  { topic: 'Heap',    score: 40 },
]

const WEEKLY = [
  { day: 'Mon', solved: 3 }, { day: 'Tue', solved: 7 },
  { day: 'Wed', solved: 2 }, { day: 'Thu', solved: 9 },
  { day: 'Fri', solved: 5 }, { day: 'Sat', solved: 11 },
  { day: 'Sun', solved: 4 },
]

const ALL_TOPICS = [
  { topic: 'Graphs',        solved: 12, total: 40, color: '#f43f5e',  difficulty: 'hard' },
  { topic: 'DP',            solved: 18, total: 50, color: '#f97316',  difficulty: 'hard' },
  { topic: 'Heap',          solved:  8, total: 20, color: '#fb923c',  difficulty: 'hard' },
  { topic: 'Trees',         solved: 28, total: 45, color: '#facc15',  difficulty: 'medium' },
  { topic: 'Binary Search', solved: 14, total: 20, color: '#4ade80',  difficulty: 'medium' },
  { topic: 'Linked List',   solved: 24, total: 30, color: '#34d399',  difficulty: 'medium' },
  { topic: 'Recursion',     solved: 20, total: 25, color: '#22d3ee',  difficulty: 'medium' },
  { topic: 'Sorting',       solved: 15, total: 18, color: '#38bdf8',  difficulty: 'easy' },
  { topic: 'Arrays',        solved: 42, total: 50, color: '#818cf8',  difficulty: 'easy' },
  { topic: 'Strings',       solved: 35, total: 40, color: '#a78bfa',  difficulty: 'easy' },
]

const WEAK_TOPICS = [
  { topic: 'Graphs',        pct: 30, reason: 'Only 12/40 solved. BFS/DFS fundamentals need work.' },
  { topic: 'Dynamic Prog.', pct: 36, reason: '18/50 solved. Focus on memoization patterns.' },
  { topic: 'Heap/Priority', pct: 40, reason: '8/20 solved. Practice heap construction problems.' },
]

const RECOMMENDATIONS = [
  { id: 1, title: 'Number of Islands',   tag: 'Graphs', diff: 'Medium', reason: 'Classic BFS/DFS — your weakest area',        url: 'https://leetcode.com/problems/number-of-islands/' },
  { id: 2, title: 'Coin Change',         tag: 'DP',     diff: 'Medium', reason: 'Core DP pattern — memoization practice',      url: 'https://leetcode.com/problems/coin-change/' },
  { id: 3, title: 'Kth Largest Element', tag: 'Heap',   diff: 'Medium', reason: 'Heap fundamentals — frequently asked',        url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/' },
  { id: 4, title: 'Course Schedule',     tag: 'Graphs', diff: 'Medium', reason: 'Topological sort — high placement frequency', url: 'https://leetcode.com/problems/course-schedule/' },
]

const getDashboardStats = (profileData) => {
  const stats = profileData?.stats || {}
  const submissionDays = Object.keys(profileData?.submissionCalendar || {}).filter(key => Number(profileData.submissionCalendar[key]) > 0).length
  return {
    totalSolved: Number(stats.all || 0),
    easy: Number(stats.easy || 0),
    medium: Number(stats.medium || 0),
    hard: Number(stats.hard || 0),
    activeDays: submissionDays || (profileData?.recentSubmissions?.length ? Math.min(30, profileData.recentSubmissions.length) : 0),
    ranking: profileData?.ranking || 0,
    acceptance: profileData?.acceptanceRate ?? null,
    contestRating: profileData?.contest?.rating || 0,
  }
}

const buildSubmissionSeries = (calendar = {}, monthlyTrend = []) => {
  const entries = Object.entries(calendar || {})
    .map(([timestamp, count]) => ({
      ts: Number(timestamp) * 1000,
      count: Number(count || 0),
    }))
    .filter(item => Number.isFinite(item.ts))
    .sort((a, b) => a.ts - b.ts)
    .slice(-30)

  if (entries.length) {
    return entries.map(item => ({
      label: new Date(item.ts).toLocaleDateString('en-IN', { month:'short', day:'numeric' }),
      solved: item.count,
    }))
  }

  return (monthlyTrend || []).map(item => ({
    label: item.month,
    solved: Number(item.easy || 0) + Number(item.medium || 0) + Number(item.hard || 0),
  }))
}

const formatTopicName = (topic) => topic === 'DP' ? 'Dynamic Programming' : topic

// ── Problem Sheet Data ─────────────────────────────────────────────
const PROBLEMS = [
  { id: 1,   title: 'Two Sum',                                     diff: 'Easy',   topic: 'Array',  acceptance: 49.2, status: 'solved' },
  { id: 3,   title: 'Longest Substring Without Repeating Chars',   diff: 'Medium', topic: 'String', acceptance: 33.8, status: 'solved' },
  { id: 4,   title: 'Median of Two Sorted Arrays',                 diff: 'Hard',   topic: 'Array',  acceptance: 35.3, status: 'attempted' },
  { id: 102, title: 'Binary Tree Level Order Traversal',           diff: 'Medium', topic: 'Tree',   acceptance: 61.7, status: 'unsolved' },
  { id: 20,  title: 'Valid Parentheses',                           diff: 'Easy',   topic: 'Stack',  acceptance: 40.1, status: 'solved' },
  { id: 70,  title: 'Climbing Stairs',                             diff: 'Easy',   topic: 'DP',     acceptance: 51.2, status: 'solved' },
  { id: 198, title: 'House Robber',                                diff: 'Medium', topic: 'DP',     acceptance: 49.8, status: 'attempted' },
  { id: 200, title: 'Number of Islands',                           diff: 'Medium', topic: 'Graph',  acceptance: 57.4, status: 'unsolved' },
  { id: 322, title: 'Coin Change',                                 diff: 'Medium', topic: 'DP',     acceptance: 41.5, status: 'unsolved' },
  { id: 33,  title: 'Search in Rotated Sorted Array',              diff: 'Medium', topic: 'Array',  acceptance: 38.4, status: 'solved' },
  { id: 121, title: 'Best Time to Buy and Sell Stock',             diff: 'Easy',   topic: 'Array',  acceptance: 54.1, status: 'solved' },
  { id: 206, title: 'Reverse Linked List',                         diff: 'Easy',   topic: 'Linked List', acceptance: 72.8, status: 'solved' },
  { id: 104, title: 'Maximum Depth of Binary Tree',                diff: 'Easy',   topic: 'Tree',   acceptance: 73.5, status: 'solved' },
  { id: 297, title: 'Serialize and Deserialize Binary Tree',       diff: 'Hard',   topic: 'Tree',   acceptance: 55.2, status: 'unsolved' },
  { id: 23,  title: 'Merge k Sorted Lists',                        diff: 'Hard',   topic: 'Heap',   acceptance: 47.8, status: 'unsolved' },
  { id: 76,  title: 'Minimum Window Substring',                    diff: 'Hard',   topic: 'String', acceptance: 40.9, status: 'attempted' },
  { id: 56,  title: 'Merge Intervals',                             diff: 'Medium', topic: 'Array',  acceptance: 45.7, status: 'solved' },
  { id: 15,  title: 'Three Sum',                                   diff: 'Medium', topic: 'Array',  acceptance: 31.8, status: 'solved' },
  { id: 141, title: 'Linked List Cycle',                           diff: 'Easy',   topic: 'Linked List', acceptance: 45.8, status: 'solved' },
  { id: 98,  title: 'Validate Binary Search Tree',                 diff: 'Medium', topic: 'Tree',   acceptance: 30.8, status: 'unsolved' },
]

const TOPIC_FILTERS = ['All', 'Array', 'DP', 'Tree', 'Graph', 'String', 'Linked List', 'Heap', 'Stack']

const DIFF_STYLE = {
  Easy:   { color: '#4ade80' },
  Medium: { color: '#fbbf24' },
  Hard:   { color: '#f87171' },
}

const TAG_STYLE = {
  Graphs: { bg: 'rgba(244,63,94,0.12)',  color: '#fb7185', border: 'rgba(244,63,94,0.25)' },
  DP:     { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: 'rgba(249,115,22,0.25)' },
  Heap:   { bg: 'rgba(250,204,21,0.12)', color: '#facc15', border: 'rgba(250,204,21,0.25)' },
  Trees:  { bg: 'rgba(34,197,94,0.12)',  color: '#4ade80', border: 'rgba(34,197,94,0.25)' },
}

// ── Tooltips ───────────────────────────────────────────────────────
const BarTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--background-card)', border:'1px solid var(--border)', borderRadius:'10px', padding:'8px 12px', boxShadow:'0 8px 30px rgba(0,0,0,0.4)' }}>
      <p style={{ fontSize:'12px', color:'var(--foreground-muted)', marginBottom:'3px' }}>{label}</p>
      <p style={{ fontSize:'14px', fontWeight:600, color:'var(--foreground)' }}>{payload[0].value} solved</p>
    </div>
  )
}

// ── Readiness Ring ─────────────────────────────────────────────────
const ReadinessRing = ({ value = 74 }) => {
  const r = 52, circ = 2 * Math.PI * r, dash = (value / 100) * circ
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
      <div style={{ position:'relative', width:'120px', height:'120px' }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(124,58,237,0.12)" strokeWidth="11"/>
          <circle cx="60" cy="60" r={r} fill="none" stroke="url(#rg)" strokeWidth="11"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 60 60)"
            style={{ transition:'stroke-dasharray 1s ease' }}
          />
          <defs>
            <linearGradient id="rg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7C3AED"/>
              <stop offset="100%" stopColor="#EC4899"/>
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:'26px', fontWeight:700, color:'var(--foreground)', letterSpacing:'-0.02em' }}>{value}%</span>
        </div>
      </div>
      <p style={{ fontSize:'13px', fontWeight:500, color:'var(--foreground-muted)' }}>Placement Readiness</p>
    </div>
  )
}

// ── Problem Sheet ──────────────────────────────────────────────────
const ProblemSheet = ({ profileData }) => {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const recentProblems = (profileData?.recentSubmissions || []).map((item, index) => ({
    id: index + 1,
    title: item.title || `Submission ${index + 1}`,
    diff: 'Medium',
    topic: 'Recent Activity',
    acceptance: 0,
    status: item.status?.toLowerCase() === 'accepted' ? 'solved' : 'attempted',
  }))
  const [problems, setProblems] = useState(recentProblems.length ? recentProblems : PROBLEMS)
  const [topicFilter,  setTopicFilter]  = useState('All')
  const [diffFilter,   setDiffFilter]   = useState('All')
  const [activeId,     setActiveId]     = useState(null)

  useEffect(() => {
    setProblems(recentProblems.length ? recentProblems : PROBLEMS)
  }, [profileData])

  const filtered = problems.filter(p => {
    const topicOk = topicFilter === 'All' || p.topic === topicFilter
    const diffOk  = diffFilter  === 'All' || p.diff  === diffFilter
    return topicOk && diffOk
  })

  const solved   = problems.filter(p => p.status === 'solved').length
  const attempted= problems.filter(p => p.status === 'attempted').length

  const handleToggleProblemStatus = (id) => {
    setProblems(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, status: p.status === 'solved' ? 'unsolved' : 'solved' }
      }
      return p
    }))
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

      {/* Stats strip */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:'12px' }}>
        {[
          { label:'Total',     val: problems.length, color:'var(--foreground)' },
          { label:'Solved',    val: solved,           color:'#4ade80' },
          { label:'Attempted', val: attempted,        color:'#7C3AED' },
          { label:'Unsolved',  val: problems.length - solved - attempted, color:'var(--foreground-muted)' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{
            background:'var(--background-card)', border:'1px solid var(--border)',
            borderRadius:'12px', padding:'16px 18px',
          }}>
            <p style={{ fontSize:'24px', fontWeight:700, color, marginBottom:'4px', letterSpacing:'-0.02em' }}>{val}</p>
            <p style={{ fontSize:'12px', color:'var(--foreground-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background:'var(--background-card)', border:'1px solid var(--border)',
        borderRadius:'14px', padding:'14px 16px',
        display:'flex', alignItems:'center', justifyContent: 'space-between', flexWrap:'wrap', gap:'10px',
      }}>
        {/* Topic pills */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
          {TOPIC_FILTERS.map(f => (
            <button key={f} onClick={() => setTopicFilter(f)} aria-pressed={topicFilter === f} style={{
              padding:'8px 16px', borderRadius:'20px', border:'1px solid',
              fontSize:'12px', fontWeight:500, cursor:'pointer', transition:'all 0.12s',
              background: topicFilter === f ? 'var(--primary)' : 'transparent',
              color:       topicFilter === f ? '#fff' : 'var(--foreground-muted)',
              borderColor: topicFilter === f ? 'var(--primary)' : 'var(--border)',
            }}>
              {f}
            </button>
          ))}
        </div>
        {/* Difficulty filter */}
        <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
          <Filter size={13} style={{ color:'var(--foreground-muted)' }}/>
          {['All','Easy','Medium','Hard'].map(d => (
            <button key={d} onClick={() => setDiffFilter(d)} aria-pressed={diffFilter === d} style={{
              padding:'8px 16px', borderRadius:'20px', border:'1px solid',
              fontSize:'12px', fontWeight:500, cursor:'pointer', transition:'all 0.12s',
              background: diffFilter === d ? (d === 'Easy' ? 'rgba(74,222,128,0.15)' : d === 'Medium' ? 'rgba(251,191,36,0.15)' : d === 'Hard' ? 'rgba(248,113,113,0.15)' : 'var(--primary)') : 'transparent',
              color:       diffFilter === d ? (d === 'Easy' ? '#4ade80' : d === 'Medium' ? '#fbbf24' : d === 'Hard' ? '#f87171' : '#fff') : 'var(--foreground-muted)',
              borderColor: diffFilter === d ? (d === 'Easy' ? 'rgba(74,222,128,0.3)' : d === 'Medium' ? 'rgba(251,191,36,0.3)' : d === 'Hard' ? 'rgba(248,113,113,0.3)' : 'var(--primary)') : 'var(--border)',
            }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Problem list */}
      <div style={{ background:'var(--background-card)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
        {filtered.map((p, idx) => {
          const isActive = activeId === p.id
          const diffColor = DIFF_STYLE[p.diff]?.color || 'var(--foreground-muted)'
          return (
            <div key={p.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div
                onClick={() => setActiveId(isActive ? null : p.id)}
                style={{
                  display:'flex', alignItems:'center', gap:'14px',
                  padding:'16px 20px', cursor:'pointer', transition:'background 0.12s',
                  background: isActive ? 'rgba(124,58,237,0.1)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--background-hover)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                {/* Status icon */}
                <div style={{ width:'20px', display:'flex', justifyContent:'center' }}>
                  {p.status === 'solved'
                    ? <CheckCircle2 size={17} style={{ color:'#4ade80', flexShrink:0 }}/>
                    : p.status === 'attempted'
                      ? <Play size={14} style={{ color:'#7C3AED', flexShrink:0 }}/>
                      : <Circle size={17} style={{ color:'var(--foreground-subtle)', flexShrink:0 }}/>
                  }
                </div>

                {/* Title + meta */}
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'14px', fontWeight:600, color: isActive ? 'var(--primary)' : 'var(--foreground)', marginBottom:'4px', lineHeight:1.3 }}>
                    {p.title}
                  </p>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                    <span style={{ fontSize:'12px', fontWeight:600, color: diffColor }}>{p.diff}</span>
                    <span style={{ fontSize:'12px', color:'var(--foreground-subtle)' }}>•</span>
                    <span style={{ fontSize:'12px', color:'var(--foreground-muted)' }}>{p.topic}</span>
                    <span style={{ fontSize:'12px', color:'var(--foreground-subtle)' }}>•</span>
                    <span style={{ fontSize:'12px', color:'var(--foreground-muted)' }}>{p.acceptance}% acceptance</span>
                  </div>
                </div>

                {/* Problem number */}
                <span style={{ fontSize:'12px', color:'var(--foreground-subtle)', flexShrink:0 }}>#{p.id}</span>

                {/* Chevron */}
                {isActive ? (
                  <ChevronDown size={16} style={{ color: 'var(--primary)', flexShrink:0 }}/>
                ) : (
                  <ChevronRight size={16} style={{ color: 'var(--foreground-subtle)', flexShrink:0 }}/>
                )}
              </div>

              {/* Expanded details */}
              {isActive && (
                <div style={{
                  padding: '12px 20px 20px 54px',
                  background: 'rgba(124,58,237,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <p style={{ fontSize: '13px', color: 'var(--foreground-muted)', lineHeight: 1.5, margin: 0 }}>
                    <strong>AI Practice Strategy:</strong> Focus on optimizing space complexity. Start with a brute-force approach, then refine it using the optimal patterns. Common follow-up questions include handling streaming data.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleProblemStatus(p.id) }}
                      style={{
                        padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)',
                        background: 'var(--background-card)', color: 'var(--foreground)',
                        fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--background-hover)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--background-card)' }}
                    >
                      {p.status === 'solved' ? 'Mark Unsolved' : 'Mark Solved'}
                    </button>
                    <a
                      href={`https://leetcode.com/problems/${p.title.toLowerCase().replace(/ /g, '-')}/`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--primary)',
                        background: 'var(--primary)', color: '#fff', textDecoration: 'none',
                        fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
                    >
                      Solve on LeetCode <ExternalLink size={12}/>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer count */}
      <p style={{ fontSize:'13px', color:'var(--foreground-muted)', textAlign:'center' }}>
        Showing {filtered.length} of {problems.length} problems
      </p>
    </div>
  )
}

// ── Analytics Tab ──────────────────────────────────────────────────
const AnalyticsTab = ({ profileData, analyticsData, loading, error }) => {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'
  const [filter, setFilter] = useState('All')
  const [sort,   setSort]   = useState('Weakest')

  const card = { background:'var(--background-card)', border:'1px solid var(--border)', borderRadius:'16px' }
  const dashboardStats = getDashboardStats(profileData || {})
  const hasData = Boolean(profileData || analyticsData)
  const topicSource = analyticsData?.topicMastery?.length ? analyticsData.topicMastery : profileData?.topics
  const topicCards = (topicSource || []).map((item) => ({
    topic: formatTopicName(item.name || item.topic || item.tagName || 'Topic'),
    solved: Number(item.solved || item.problemsSolved || 0),
    total: Number(item.total || 40),
    color: item.color || '#7C3AED',
    percentage: Number(item.percentage ?? (item.total ? (item.solved / item.total) * 100 : 0)),
    difficulty: ['Dynamic Programming', 'Graphs', 'Backtracking'].includes(formatTopicName(item.name || item.topic)) ? 'hard' : ['Trees', 'Binary Search', 'Linked List'].includes(formatTopicName(item.name || item.topic)) ? 'medium' : 'easy',
  }))

  const difficultyBreakdown = analyticsData?.difficultyBreakdown?.length
    ? analyticsData.difficultyBreakdown
    : [
        { difficulty:'Easy', count:dashboardStats.easy, color:'#4ade80' },
        { difficulty:'Medium', count:dashboardStats.medium, color:'#fbbf24' },
        { difficulty:'Hard', count:dashboardStats.hard, color:'#f87171' },
      ]
  const totalDifficulty = difficultyBreakdown.reduce((sum, item) => sum + Number(item.count || 0), 0)
  const pieData = difficultyBreakdown.map(item => ({ name:item.difficulty, value:Number(item.count || 0), color:item.color }))
  const weeklyData = (analyticsData?.weeklyActivity || WEEKLY).map(item => ({ day:item.date || item.day, solved:Number(item.count ?? item.solved ?? 0) }))
  const activityLine = buildSubmissionSeries(profileData?.submissionCalendar, analyticsData?.monthlyTrend)
  const heatmapEntries = Object.entries(analyticsData?.heatmapData || {}).slice(0, 28)

  const rankedTopics = analyticsData?.topicAnalytics?.rankedTopics || topicCards
  const strongestTopics = (analyticsData?.topicAnalytics?.strongestTopics || rankedTopics.slice(0, 3)).map(item => ({ ...item, topic: formatTopicName(item.topic || item.name) }))
  const weakTopics = (analyticsData?.topicAnalytics?.weakestTopics || [...topicCards].sort((a, b) => a.percentage - b.percentage).slice(0, 3))
    .map(item => ({ ...item, topic: formatTopicName(item.topic || item.name), pct: Math.round(item.percentage ?? (item.total ? (item.solved / item.total) * 100 : 0)) }))
  const mostPracticedTopic = [...topicCards].sort((a, b) => b.solved - a.solved)[0]
  const leastPracticedTopic = [...topicCards].sort((a, b) => a.solved - b.solved)[0]
  const mostSolvedDifficulty = [...difficultyBreakdown].sort((a, b) => Number(b.count || 0) - Number(a.count || 0))[0]?.difficulty || 'N/A'

  const filteredTopics = topicCards
    .filter(t => filter === 'All' || t.difficulty === filter.toLowerCase())
    .sort((a, b) => sort === 'Weakest' ? a.percentage - b.percentage : b.solved - a.solved)

  const recommendationItems = ((analyticsData?.recommendations?.length ? analyticsData.recommendations : profileData?.recommendations) || []).map((item) => ({
    id: item.id || Math.random(),
    title: item.title || item.problem || 'Recommendation',
    tag: item.type || item.tag || 'Focus',
    diff: item.action || item.diff || 'Practice',
    reason: item.desc || item.reason || 'Focus on this weak area to improve your profile.',
    url: item.path || item.url || 'https://leetcode.com',
  }))

  if (loading) {
    return (
      <div style={{ ...card, padding:'28px', color:'var(--foreground-muted)' }}>
        Loading LeetCode analytics...
      </div>
    )
  }

  if (!hasData) {
    return (
      <div style={{ ...card, padding:'28px', display:'flex', flexDirection:'column', gap:'8px' }}>
        <p style={{ fontSize:'16px', fontWeight:700, color:'var(--foreground)', margin:0 }}>Search a LeetCode username to view analytics</p>
        <p style={{ fontSize:'13px', color:'var(--foreground-muted)', margin:0 }}>The dashboard will show difficulty stats, topic charts, activity trends, and readiness insights.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...card, padding:'22px', borderColor:'rgba(248,113,113,0.35)' }}>
        <p style={{ color:'#f87171', fontSize:'13px', margin:0 }}>{error}</p>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap:'16px' }}>
        {[
          { icon:Trophy,    iconColor:'#fbbf24', bg:'rgba(251,191,36,0.1)',  label:'Total Solved',    value:dashboardStats.totalSolved,                          sub:`Easy ${dashboardStats.easy} · Med ${dashboardStats.medium} · Hard ${dashboardStats.hard}` },
          { icon:Flame,     iconColor:'#f97316', bg:'rgba(249,115,22,0.1)',  label:'Active Days',     value:dashboardStats.activeDays,                            sub:'From submission calendar' },
          { icon:Target,    iconColor:'#4ade80', bg:'rgba(34,197,94,0.1)',   label:'Acceptance Rate', value:dashboardStats.acceptance === null ? 'N/A' : `${dashboardStats.acceptance}%`, sub:dashboardStats.acceptance === null ? 'Not provided by profile API' : 'From LeetCode data' },
          { icon:BarChart2, iconColor:'#a78bfa', bg:'rgba(124,58,237,0.1)', label:'Global Ranking',  value:dashboardStats.ranking ? `#${dashboardStats.ranking.toLocaleString('en-IN')}` : 'N/A',  sub:dashboardStats.ranking ? 'Live ranking from LeetCode' : 'No ranking available' },
          { icon:Code2,     iconColor:'#38bdf8', bg:'rgba(56,189,248,0.1)',  label:'Contest Rating',  value:dashboardStats.contestRating || 'N/A',                  sub:dashboardStats.contestRating ? 'Contest profile' : 'No contest data' },
        ].map(({ icon:Icon, iconColor, bg, label, value, sub }) => (
          <div key={label} style={{ ...card, padding:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={18} style={{ color:iconColor }}/>
              </div>
              <p style={{ fontSize:'13px', color:'var(--foreground-muted)', fontWeight:500 }}>{label}</p>
            </div>
            <p style={{ fontSize:'26px', fontWeight:700, color:'var(--foreground)', letterSpacing:'-0.02em', marginBottom:'4px' }}>{value}</p>
            <p style={{ fontSize:'12px', color:'var(--foreground-subtle)' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '1fr 1fr 1fr', gap:'16px' }}>
        {/* Difficulty + Pie */}
        <div style={{ ...card, padding:'22px' }}>
          <p style={{ fontSize:'15px', fontWeight:600, color:'var(--foreground)', marginBottom:'18px' }}>Difficulty distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>
                {pieData.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}
              </Pie>
              <Tooltip content={<BarTip/>}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginBottom:'22px' }}>
            {difficultyBreakdown.map(({ difficulty, count, color }) => {
              const pct = totalDifficulty ? Math.round((Number(count || 0) / totalDifficulty) * 100) : 0
              return (
              <div key={difficulty}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                  <span style={{ fontSize:'13px', color:'var(--foreground-muted)' }}>{difficulty}</span>
                  <span style={{ fontSize:'13px', fontWeight:500, color:'var(--foreground)' }}>{count} solved</span>
                </div>
                <div style={{ height:'6px', borderRadius:'3px', background:'var(--muted)', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:'3px', transition:'width .7s ease' }}/>
                </div>
              </div>
              )
            })}
          </div>
          <p style={{ fontSize:'14px', fontWeight:600, color:'var(--foreground)', marginBottom:'12px' }}>This week</p>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={weeklyData} margin={{ top:0, right:0, left:-28, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="day" tick={{ fill:'var(--foreground-muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'var(--foreground-muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<BarTip/>} cursor={{ fill:'rgba(124,58,237,0.06)' }}/>
              <Bar dataKey="solved" radius={[4,4,0,0]}>
                {weeklyData.map((_,i) => <Cell key={i} fill={i===5?'#7C3AED':'rgba(124,58,237,0.2)'}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Topic Bar */}
        <div style={{ ...card, padding:'22px' }}>
          <p style={{ fontSize:'15px', fontWeight:600, color:'var(--foreground)', marginBottom:'4px' }}>Topic-wise solved questions</p>
          <p style={{ fontSize:'13px', color:'var(--foreground-muted)', marginBottom:'8px' }}>Problems solved across DSA topics</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topicCards} margin={{ top:10, right:0, left:-24, bottom:36 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="topic" interval={0} angle={-28} textAnchor="end" tick={{ fill:'var(--foreground-muted)', fontSize:10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'var(--foreground-muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<BarTip/>} cursor={{ fill:'rgba(124,58,237,0.06)' }}/>
              <Bar dataKey="solved" radius={[4,4,0,0]}>
                {topicCards.map((item) => <Cell key={item.topic} fill={item.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ring + Weak */}
        <div style={{ ...card, padding:'22px', display:'flex', flexDirection:'column', gap:'20px' }}>
          <ReadinessRing value={Math.round(analyticsData?.placementReadiness ?? profileData?.placementReadiness ?? 0)}/>
          <div style={{ height:'1px', background:'var(--border)' }}/>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
              <AlertTriangle size={16} style={{ color:'#fbbf24' }}/>
              <p style={{ fontSize:'14px', fontWeight:600, color:'var(--foreground)' }}>Progress insights</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {[
                { label:'Strongest topic', value:strongestTopics[0]?.topic || 'N/A' },
                { label:'Needs improvement', value:weakTopics[0]?.topic || 'N/A' },
                { label:'Most practiced', value:mostPracticedTopic?.topic || 'N/A' },
                { label:'Least practiced', value:leastPracticedTopic?.topic || 'N/A' },
                { label:'Most solved difficulty', value:mostSolvedDifficulty },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding:'12px 14px', borderRadius:'12px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                    <span style={{ fontSize:'12px', color:'var(--foreground-muted)' }}>{label}</span>
                    <span style={{ fontSize:'13px', fontWeight:600, color:'#fbbf24' }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'16px' }}>
        <div style={{ ...card, padding:'22px' }}>
          <p style={{ fontSize:'15px', fontWeight:600, color:'var(--foreground)', marginBottom:'4px' }}>Submission activity over time</p>
          <p style={{ fontSize:'13px', color:'var(--foreground-muted)', marginBottom:'8px' }}>Recent coding activity from calendar or trend data</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={activityLine.length ? activityLine : weeklyData} margin={{ top:10, right:12, left:-22, bottom:24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey={activityLine.length ? 'label' : 'day'} tick={{ fill:'var(--foreground-muted)', fontSize:10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'var(--foreground-muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<BarTip/>}/>
              <Line type="monotone" dataKey="solved" stroke="#38bdf8" strokeWidth={2.5} dot={{ r:3, fill:'#38bdf8' }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...card, padding:'22px' }}>
          <p style={{ fontSize:'15px', fontWeight:600, color:'var(--foreground)', marginBottom:'4px' }}>Coding consistency</p>
          <p style={{ fontSize:'13px', color:'var(--foreground-muted)', marginBottom:'16px' }}>Daily activity intensity</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, minmax(18px, 1fr))', gap:'7px' }}>
            {heatmapEntries.length ? heatmapEntries.map(([key, value]) => {
              const opacity = Math.max(0.08, Number(value || 0) / 9)
              return <div key={key} title={`${value} activity`} style={{ aspectRatio:'1', borderRadius:'6px', background:`rgba(34,197,94,${opacity})`, border:'1px solid rgba(34,197,94,0.12)' }}/>
            }) : Array.from({ length:28 }).map((_, index) => (
              <div key={index} style={{ aspectRatio:'1', borderRadius:'6px', background:'var(--muted)', border:'1px solid var(--border)' }}/>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'16px' }}>
        {/* Topics table */}
        <div style={{ ...card, padding:'22px' }}>
          <div style={{
            display:'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent:'space-between',
            gap: isMobile ? '12px' : '16px',
            marginBottom:'16px'
          }}>
            <p style={{ fontSize:'15px', fontWeight:600, color:'var(--foreground)' }}>All topics</p>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', width: isMobile ? '100%' : 'auto' }}>
              <div style={{ display:'flex', gap:'4px', background:'var(--background)', padding:'3px', borderRadius:'8px', border:'1px solid var(--border)' }}>
                {['All','Easy','Medium','Hard'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding:'6px 12px', borderRadius:'6px', border:'none', cursor:'pointer',
                    fontSize:'12px', fontWeight:500, transition:'all 0.12s',
                    background: filter === f ? 'var(--primary)' : 'transparent',
                    color: filter === f ? '#fff' : 'var(--foreground-muted)',
                  }}>{f}</button>
                ))}
              </div>
              <div style={{ position:'relative' }}>
                <select value={sort} onChange={e => setSort(e.target.value)} style={{
                  appearance:'none', padding:'5px 28px 5px 10px',
                  borderRadius:'8px', border:'1px solid var(--border)',
                  background:'var(--background)', color:'var(--foreground-muted)',
                  fontSize:'12px', cursor:'pointer', outline:'none',
                }}>
                  <option value="Weakest">Sort: Weakest</option>
                  <option value="Most solved">Sort: Most solved</option>
                </select>
                <ChevronDown size={12} style={{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', color:'var(--foreground-muted)', pointerEvents:'none' }}/>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', maxHeight:'320px', overflowY:'auto' }} className="scrollbar-hide">
            {filteredTopics.map(({ topic, solved, total, color, percentage }) => {
              const pct = Math.round(percentage || 0)
              return (
                <div key={topic} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:color, flexShrink:0 }}/>
                  <span style={{ fontSize:'13px', color:'var(--foreground-muted)', width:'130px', flexShrink:0 }}>{topic}</span>
                  <div style={{ flex:1, height:'5px', background:'var(--muted)', borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:'3px', transition:'width .5s ease' }}/>
                  </div>
                  <span style={{ fontSize:'12px', color:'var(--foreground-muted)', width:'36px', textAlign:'right', flexShrink:0 }}>{solved}/{total}</span>
                  <span style={{ fontSize:'11px', fontWeight:600, width:'36px', textAlign:'right', flexShrink:0, color: pct>=70?'#4ade80':pct>=40?'#fbbf24':'#f87171' }}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recommended */}
        <div style={{ ...card, padding:'22px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
            <Zap size={16} style={{ color:'var(--primary)' }}/>
            <p style={{ fontSize:'15px', fontWeight:600, color:'var(--foreground)' }}>AI Recommended Problems</p>
          </div>
          <p style={{ fontSize:'13px', color:'var(--foreground-muted)', marginBottom:'16px' }}>Based on your weak topics and placement frequency</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {(recommendationItems.length ? recommendationItems : RECOMMENDATIONS).map(({ id, title, tag, diff, reason, url }) => {
              const ds = { Easy:{bg:'rgba(34,197,94,0.12)',color:'#4ade80',border:'rgba(34,197,94,0.25)'}, Medium:{bg:'rgba(245,158,11,0.12)',color:'#fbbf24',border:'rgba(245,158,11,0.25)'}, Hard:{bg:'rgba(239,68,68,0.12)',color:'#f87171',border:'rgba(239,68,68,0.25)'} }[diff]
              const ts = TAG_STYLE[tag] || { bg:'rgba(124,58,237,0.1)', color:'#a78bfa', border:'rgba(124,58,237,0.2)' }
              return (
                <a key={id} href={url} target="_blank" rel="noreferrer" style={{
                  display:'flex', alignItems:'flex-start', gap:'12px',
                  padding:'14px 16px', borderRadius:'12px', cursor:'pointer', textDecoration:'none',
                  background:'var(--background)', border:'1px solid var(--border)', transition:'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(124,58,237,0.4)'; e.currentTarget.style.background='var(--background-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--background)' }}
                >
                  <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'rgba(124,58,237,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Code2 size={15} style={{ color:'var(--primary)' }}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                      <p style={{ fontSize:'13px', fontWeight:600, color:'var(--foreground)' }}>{title}</p>
                      <ExternalLink size={11} style={{ color:'var(--foreground-subtle)', flexShrink:0 }}/>
                    </div>
                    <p style={{ fontSize:'12px', color:'var(--foreground-muted)', marginBottom:'8px', lineHeight:1.4 }}>{reason}</p>
                    <div style={{ display:'flex', gap:'6px' }}>
                      <span style={{ fontSize:'11px', fontWeight:500, padding:'2px 8px', borderRadius:'6px', background:ts.bg, color:ts.color, border:`1px solid ${ts.border}` }}>{tag}</span>
                      <span style={{ fontSize:'11px', fontWeight:500, padding:'2px 8px', borderRadius:'6px', background:ds.bg, color:ds.color, border:`1px solid ${ds.border}` }}>{diff}</span>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main DSA Page ──────────────────────────────────────────────────
const DSA = () => {
  const [activeTab, setActiveTab] = useState('analytics')
  const [usernameInput, setUsernameInput] = useState('')
  const [profileData, setProfileData] = useState(null)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'

  const handleSearch = async (event) => {
    event?.preventDefault()
    const username = usernameInput.trim()

    if (!username) {
      setError('Please enter a LeetCode username.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const [profileResponse, analyticsResponse] = await Promise.all([
        api.get(`/dsa/profile/${encodeURIComponent(username)}`),
        api.get(`/dsa/analytics/${encodeURIComponent(username)}`),
      ])
      setProfileData(profileResponse.data)
      setAnalyticsData(analyticsResponse.data)
      setUsernameInput(profileResponse.data.username || username)
    } catch (err) {
      setProfileData(null)
      setAnalyticsData(null)
      setError(err?.response?.data?.detail || 'Unable to fetch LeetCode profile right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-up" style={{ maxWidth:'1600px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'20px' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems: isMobile ? 'stretch' : 'flex-start', justifyContent:'space-between', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight:700, color:'var(--foreground)', marginBottom:'4px', letterSpacing:'-0.02em' }}>
            DSA Intelligence Engine
          </h1>
          <p style={{ fontSize:'14px', color:'var(--foreground-muted)' }}>
            AI-powered analysis of your coding performance
          </p>
        </div>
        <a href="https://leetcode.com" target="_blank" rel="noreferrer" style={{
          display:'flex', alignItems:'center', gap:'8px', padding:'10px 18px', borderRadius:'12px',
          textDecoration:'none', background:'var(--background-card)', border:'1px solid var(--border)',
          color:'var(--foreground-muted)', fontSize:'13px', fontWeight:500, transition:'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(124,58,237,0.4)'; e.currentTarget.style.color='var(--foreground)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--foreground-muted)' }}
        >
          <Code2 size={15} style={{ color:'var(--primary)' }}/>
          LeetCode Profile
          <ExternalLink size={13}/>
        </a>
      </div>

      <form onSubmit={handleSearch} style={{ display:'flex', flexWrap:'wrap', gap:'10px', alignItems:'center', background:'var(--background-card)', border:'1px solid var(--border)', borderRadius:'14px', padding:'12px 14px' }}>
        <input
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
          placeholder="Enter LeetCode username"
          style={{ flex:'1 1 220px', minWidth:'220px', border:'1px solid var(--border)', borderRadius:'10px', padding:'10px 12px', background:'var(--background)', color:'var(--foreground)' }}
        />
        <button type="submit" disabled={loading} style={{ padding:'10px 16px', borderRadius:'10px', border:'none', background:'var(--primary)', color:'#fff', cursor:'pointer', fontWeight:600 }}>
          {loading ? 'Fetching…' : 'Search'}
        </button>
      </form>

      {error ? <p style={{ color:'#f87171', fontSize:'13px' }}>{error}</p> : null}
      {profileData ? (
        <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', alignItems:'center', color:'var(--foreground-muted)', fontSize:'13px' }}>
          <span>Showing live data for <strong>{profileData.username}</strong></span>
          <span>• {profileData.stats?.all ?? 0} solved</span>
          <span>• Contest rating {profileData.contest?.rating ?? 0}</span>
        </div>
      ) : null}

      {/* Tab switcher */}
      <div role="tablist" style={{
        display:'flex', gap:'4px', background:'var(--background-card)',
        border:'1px solid var(--border)', borderRadius:'14px',
        padding:'5px', width:'fit-content',
      }}>
        {[
          { id:'analytics', icon:BarChartIcon, label:'Analytics' },
          { id:'problems',  icon:LayoutList,   label:'Problem Sheet' },
        ].map(({ id, icon:Icon, label }) => (
          <button key={id} onClick={() => setActiveTab(id)} role="tab" aria-selected={activeTab === id} style={{
            display:'flex', alignItems:'center', gap:'8px',
            padding:'9px 20px', borderRadius:'10px', border:'none', cursor:'pointer',
            fontSize:'13px', fontWeight:600, transition:'all 0.15s',
            background: activeTab === id ? 'var(--primary)' : 'transparent',
            color:       activeTab === id ? '#fff' : 'var(--foreground-muted)',
            boxShadow:   activeTab === id ? '0 4px 14px rgba(124,58,237,0.3)' : 'none',
          }}>
            <Icon size={15}/>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'analytics' ? <AnalyticsTab profileData={profileData} analyticsData={analyticsData} loading={loading} error={error} /> : <ProblemSheet profileData={profileData} />}
    </div>
  )
}

export default DSA
