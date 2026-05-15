import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search, Menu, X, ChevronDown, User, Settings, LogOut } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import authService from '../../services/authService'
 
// ─── Map routes to page titles ────────────────────────────────────
const PAGE_TITLES = {
  '/app/dashboard':       'Dashboard',
  '/app/notes':           'AI Notes Engine',
  '/app/dsa':             'DSA Intelligence',
  '/app/interviewer':     'Mock Interviewer',
  '/app/resume':          'Resume Analyzer',
  '/app/recommendations': 'Recommendations',
  '/app/planner':         'Study Planner',
  '/app/productivity':    'Productivity Analytics',
  '/app/profile':         'Profile',
}
 
// ─── Mock notifications (replace with API later) ──────────────────
const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'New DSA problem recommended for you', time: '2m ago', unread: true },
  { id: 2, text: 'Study streak: 7 days! Keep going 🔥', time: '1h ago', unread: true },
  { id: 3, text: 'Resume analysis complete', time: '3h ago', unread: false },
]
 
const Navbar = ({ onMenuClick, sidebarCollapsed }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
 
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
 
  const notifRef = useRef(null)
  const userMenuRef = useRef(null)
 
  const pageTitle = PAGE_TITLES[location.pathname] || 'StudentOS Nexus'
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length
 
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'
 
  // ─── Close dropdowns on outside click ────────────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
 
  const handleLogout = async () => {
    await authService.logout()
    logout()
    navigate('/login')
  }
 
  return (
    <header className="h-14 bg-[#0d1526] border-b border-white/6 flex items-center justify-between px-5 shrink-0 z-20">
 
      {/* ── Left: page title ── */}
      <div className="flex items-center gap-3">
        <h1 className="text-white font-semibold text-base tracking-tight">{pageTitle}</h1>
      </div>
 
      {/* ── Right: actions ── */}
      <div className="flex items-center gap-1.5">
 
        {/* Search */}
        {searchOpen ? (
          <div className="flex items-center gap-2 bg-[#1a2235] border border-white/10 rounded-lg px-3 py-1.5">
            <Search size={14} className="text-slate-500 shrink-0" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, topics..."
              className="bg-transparent text-white text-sm outline-none w-48 placeholder:text-slate-600"
              onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
            />
            <button onClick={() => { setSearchOpen(false); setSearchQuery('') }}>
              <X size={14} className="text-slate-500 hover:text-slate-300 transition-colors" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all"
          >
            <Search size={16} />
          </button>
        )}
 
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((p) => !p); setUserMenuOpen(false) }}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
            )}
          </button>
 
          {/* Notifications dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-10 w-72 bg-[#111827] border border-white/8 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
                <span className="text-white text-sm font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="divide-y divide-white/5">
                {MOCK_NOTIFICATIONS.map((n) => (
                  <div key={n.id} className={`px-4 py-3 hover:bg-white/3 transition-colors cursor-pointer ${n.unread ? 'bg-indigo-500/5' : ''}`}>
                    <p className="text-slate-300 text-xs leading-relaxed">{n.text}</p>
                    <p className="text-slate-600 text-[11px] mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-white/6">
                <button className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
 
        {/* User menu */}
        <div className="relative ml-1" ref={userMenuRef}>
          <button
            onClick={() => { setUserMenuOpen((p) => !p); setNotifOpen(false) }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-white/5 transition-all"
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-white text-xs font-medium leading-tight truncate max-w-[100px]">
                {user?.name || 'Student'}
              </p>
              <p className="text-slate-500 text-[10px] leading-tight truncate max-w-[100px]">
                {user?.branch || 'Computer Science'}
              </p>
            </div>
            <ChevronDown size={13} className={`text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>
 
          {/* User dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 top-10 w-48 bg-[#111827] border border-white/8 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-3 py-2.5 border-b border-white/6">
                <p className="text-white text-xs font-medium truncate">{user?.name}</p>
                <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { navigate('/app/profile'); setUserMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-xs"
                >
                  <User size={14} /> Profile
                </button>
                <button
                  onClick={() => { navigate('/app/settings'); setUserMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-xs"
                >
                  <Settings size={14} /> Settings
                </button>
              </div>
              <div className="py-1 border-t border-white/6">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-xs"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
 
export default Navbar