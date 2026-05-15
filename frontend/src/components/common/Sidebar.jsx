import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Code2, Mic, Briefcase,
  Star, Calendar, BarChart2, BookOpen, ChevronLeft,
  ChevronRight, LogOut, Settings, User,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import authService from '../../services/authService'
 
// ─── Nav config ───────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { path: '/',       icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/notes',           icon: FileText,         label: 'AI Notes' },
      { path: '/dsa',             icon: Code2,            label: 'DSA Engine' },
    ],
  },
  {
    label: 'Career',
    items: [
      { path: '/interviewer',     icon: Mic,              label: 'Interviewer' },
      { path: '/resume',          icon: Briefcase,        label: 'Resume' },
      { path: '/recommendations', icon: Star,             label: 'Recommendations' },
    ],
  },
  {
    label: 'Productivity',
    items: [
      { path: '/planner',         icon: Calendar,         label: 'Planner' },
      { path: '/productivity',    icon: BarChart2,        label: 'Analytics' },
    ],
  },
]
 
// ─── Single nav item ──────────────────────────────────────────────
const NavItem = ({ path, icon: Icon, label, collapsed }) => (
  <NavLink
    to={path}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group relative
       ${isActive
         ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
         : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
       }`
    }
  >
    <Icon size={17} className="shrink-0" />
 
    {/* Label — hidden when collapsed */}
    {!collapsed && (
      <span className="truncate font-medium">{label}</span>
    )}
 
    {/* Tooltip when collapsed */}
    {collapsed && (
      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1e2a45] border border-white/10 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
        {label}
      </div>
    )}
  </NavLink>
)
 
// ─── Sidebar ──────────────────────────────────────────────────────
const Sidebar = ({ collapsed, onToggle }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
 
  const handleLogout = async () => {
    await authService.logout()
    logout()
    navigate('/login')
  }
 
  // Get initials from user name
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'
 
  return (
    <aside
      className={`relative flex flex-col bg-[#0d1526] border-r border-white/6 transition-all duration-300 shrink-0
        ${collapsed ? 'w-[60px]' : 'w-[220px]'}`}
    >
      {/* ── Logo ── */}
      <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-white/6 ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <BookOpen size={15} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white text-sm font-semibold leading-tight tracking-tight">StudentOS</p>
            <p className="text-indigo-400 text-xs font-medium">Nexus</p>
          </div>
        )}
      </div>
 
      {/* ── Nav sections ── */}
      <nav className="flex-1 px-2 py-4 space-y-5 overflow-y-auto overflow-x-hidden">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {/* Section label — hidden when collapsed */}
            {!collapsed && (
              <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.path} {...item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>
 
      {/* ── Bottom section — user + settings + logout ── */}
      <div className="px-2 py-3 border-t border-white/6 space-y-0.5">
 
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group relative border
             ${isActive
               ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/20'
               : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-transparent'
             }`
          }
        >
          {/* Avatar */}
          <div className="w-[22px] h-[22px] rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {initials}
          </div>
          {!collapsed && <span className="truncate font-medium">Profile</span>}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1e2a45] border border-white/10 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
              Profile
            </div>
          )}
        </NavLink>
 
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group relative border border-transparent"
        >
          <LogOut size={17} className="shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1e2a45] border border-white/10 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
              Logout
            </div>
          )}
        </button>
      </div>
 
      {/* ── Collapse toggle button ── */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-[72px] w-6 h-6 bg-[#1a2540] border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 transition-all z-10 shadow-lg"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
 
export default Sidebar