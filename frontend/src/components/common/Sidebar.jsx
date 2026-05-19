import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Code2, Mic, Briefcase,
  Star, Calendar, BarChart2, Zap, User, Settings, LogOut,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import authService from '../../services/authService'

const NAV = [
  {
    section: 'MAIN',
    items: [
      { path: '/app/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/app/notes',           icon: FileText,         label: 'AI Notes' },
      { path: '/app/dsa',             icon: Code2,            label: 'DSA Engine' },
    ],
  },
  {
    section: 'CAREER',
    items: [
      { path: '/app/interviewer',     icon: Mic,       label: 'Interviewer' },
      { path: '/app/resume',          icon: Briefcase,  label: 'Resume' },
      { path: '/app/recommendations', icon: Star,       label: 'Recommendations' },
    ],
  },
  {
    section: 'PRODUCTIVITY',
    items: [
      { path: '/app/planner',      icon: Calendar,  label: 'Planner' },
      { path: '/app/productivity', icon: BarChart2,  label: 'Analytics' },
    ],
  },
]

const NavItem = ({ path, icon: Icon, label, collapsed }) => (
  <NavLink
    to={path}
    className={({ isActive }) =>
      `nav-item relative group ${isActive ? 'active' : ''}`
    }
    style={collapsed ? { justifyContent: 'center', padding: '10px 0' } : {}}
  >
    <Icon size={18} className="shrink-0" />
    {!collapsed && <span>{label}</span>}

    {/* Tooltip on collapse */}
    {collapsed && (
      <div
        className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs
                   whitespace-nowrap opacity-0 group-hover:opacity-100
                   pointer-events-none transition-opacity z-50"
        style={{
          background: 'var(--background-card)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        {label}
      </div>
    )}
  </NavLink>
)

const Sidebar = ({ collapsed }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const handleLogout = async () => {
    await authService.logout()
    logout()
    navigate('/login')
  }

  return (
    <aside
      className="flex flex-col shrink-0 overflow-hidden scrollbar-hide"
      style={{
        width: collapsed ? '64px' : '220px',
        background: 'var(--sidebar)',
        borderRight: '1px solid var(--sidebar-border)',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center py-6 shrink-0"
        style={{
          padding: collapsed ? '24px 0' : '24px 20px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: '12px',
          borderBottom: '1px solid var(--sidebar-border)',
        }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg,#7C3AED,#EC4899)',
          }}
        >
          <Zap size={18} color="#fff" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.2 }}>
              StudentOS
            </p>
            <p style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>Nexus</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{ padding: collapsed ? '16px 8px' : '16px 12px' }}
      >
        {NAV.map(({ section, items }) => (
          <div key={section} style={{ marginBottom: '24px' }}>
            {!collapsed && (
              <p style={{
                fontSize: '10px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--foreground-subtle)',
                padding: '0 8px', marginBottom: '6px',
              }}>
                {section}
              </p>
            )}
            {collapsed && (
              <div style={{ height: '1px', background: 'var(--border)', margin: '0 4px 12px' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {items.map(item => (
                <NavItem key={item.path} {...item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div
        style={{
          padding: collapsed ? '12px 8px' : '12px',
          borderTop: '1px solid var(--sidebar-border)',
          display: 'flex', flexDirection: 'column', gap: '2px',
        }}
      >
        <NavLink
          to="/app/profile"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={collapsed ? { justifyContent: 'center', padding: '10px 0' } : {}}
        >
          <User size={18} className="shrink-0" />
          {!collapsed && <span>Profile</span>}
        </NavLink>
        <NavLink
          to="/app/settings"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={collapsed ? { justifyContent: 'center', padding: '10px 0' } : {}}
        >
          <Settings size={18} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <button
          onClick={handleLogout}
          className="nav-item w-full"
          style={{
            ...(collapsed ? { justifyContent: 'center', padding: '10px 0' } : {}),
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
            e.currentTarget.style.color = '#ef4444'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = ''
          }}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar