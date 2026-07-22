import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Code2, Mic, Briefcase,
  Star, Calendar, BarChart2, Zap, User, Settings, LogOut, X,
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
      { path: '/app/interviewer',     icon: Mic,      label: 'Interviewer' },
      { path: '/app/resume',          icon: Briefcase, label: 'Resume' },
      { path: '/app/recommendations', icon: Star,      label: 'Recommendations' },
    ],
  },
  {
    section: 'PRODUCTIVITY',
    items: [
      { path: '/app/planner',      icon: Calendar, label: 'Planner' },
      { path: '/app/productivity', icon: BarChart2, label: 'Analytics' },
      { path: '/app/todo',          icon: Zap, label: 'Todo' },
    ],
  },
]

const NavItem = ({ path, icon: Icon, label, collapsed, onNavigate }) => (
  <NavLink
    to={path}
    onClick={onNavigate}
    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    style={{
      justifyContent: collapsed ? 'center' : 'flex-start',
      padding: collapsed ? '10px 0' : '10px 12px',
      position: 'relative',
    }}
  >
    <Icon size={18} style={{ flexShrink: 0 }} />
    {!collapsed && (
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{label}</span>
    )}
    {collapsed && (
      <div className="sidebar-tooltip" style={{
        position: 'absolute',
        left: 'calc(100% + 12px)',
        top: '50%',
        transform: 'translateY(-50%)',
        padding: '6px 12px',
        borderRadius: 8,
        fontSize: 12,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        background: 'var(--background-card)',
        border: '1px solid var(--border)',
        color: 'var(--foreground)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        opacity: 0,
        zIndex: 100,
      }}>
        {label}
      </div>
    )}
  </NavLink>
)

const BottomNavItem = ({ path, icon: Icon, label, collapsed, onNavigate }) => (
  <NavLink
    to={path}
    onClick={onNavigate}
    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    style={{
      justifyContent: collapsed ? 'center' : 'flex-start',
      padding: collapsed ? '10px 0' : '10px 12px',
      position: 'relative',
    }}
  >
    <Icon size={18} style={{ flexShrink: 0 }} />
    {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
    {collapsed && (
      <div className="sidebar-tooltip" style={{
        position: 'absolute',
        left: 'calc(100% + 12px)',
        top: '50%',
        transform: 'translateY(-50%)',
        padding: '6px 12px',
        borderRadius: 8,
        fontSize: 12,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        background: 'var(--background-card)',
        border: '1px solid var(--border)',
        color: 'var(--foreground)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        opacity: 0,
        zIndex: 100,
      }}>
        {label}
      </div>
    )}
  </NavLink>
)

const Sidebar = ({ collapsed, onNavigate, onClose, isMobile }) => {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    authService.logout()
    logout()
    navigate('/login')
  }

  return (
    <>
      <style>{`
        .nav-item:hover .sidebar-tooltip { opacity: 1 !important; }
        .logout-btn:hover { background: rgba(239,68,68,0.1) !important; color: #ef4444 !important; }
      `}</style>

      <aside style={{
        width:       collapsed ? '64px' : '220px',
        minWidth:    collapsed ? '64px' : '220px',
        maxWidth:    collapsed ? '64px' : '220px',
        height:      '100dvh',
        display:     'flex',
        flexDirection: 'column',
        flexShrink:  0,
        overflow:    'hidden',
        background:  'var(--sidebar)',
        borderRight: '1px solid var(--sidebar-border)',
        transition:  'width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1), max-width 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* ── Logo ── */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          gap:            12,
          padding:        collapsed ? '0 0 0 0' : '0 20px',
          paddingTop:     0,
          paddingBottom:  0,
          height:         56,
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom:   '1px solid var(--sidebar-border)',
          flexShrink:     0,
        }}>
          {/* icon */}
          <div style={{
            width: 36, height: 36,
            borderRadius: 10,
            flexShrink: 0,
            background: 'linear-gradient(135deg,#7C3AED,#EC4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={18} color="#fff" />
          </div>

          {/* text — fades out when collapsed */}
          <div style={{
            overflow:   'hidden',
            maxWidth:   collapsed ? '0px' : '200px',
            opacity:    collapsed ? 0 : 1,
            transition: 'max-width 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s',
            whiteSpace: 'nowrap',
            flex: 1,
          }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.2, margin: 0 }}>
              StudentOS
            </p>
            <p style={{ fontSize: 12, color: 'var(--foreground-muted)', margin: 0 }}>Nexus</p>
          </div>

          {/* Mobile close button */}
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 8,
                border: 'none', background: 'transparent',
                color: 'var(--foreground-muted)', cursor: 'pointer',
                transition: 'background 0.15s',
                flexShrink: 0,
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── Nav ── */}
        <nav style={{
          flex:       1,
          overflowY:  'auto',
          overflowX:  'hidden',
          padding:    collapsed ? '16px 8px' : '16px 12px',
          scrollbarWidth: 'none',
        }}>
          {NAV.map(({ section, items }) => (
            <div key={section} style={{ marginBottom: 24 }}>
              {!collapsed && (
                <p style={{
                  fontSize: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: 'var(--foreground-subtle)',
                  padding: '0 8px', marginBottom: 6,
                  whiteSpace: 'nowrap',
                }}>
                  {section}
                </p>
              )}
              {collapsed && (
                <div style={{ height: 1, background: 'var(--border)', margin: '0 4px 12px' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {items.map(item => (
                  <NavItem key={item.path} {...item} collapsed={collapsed} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Bottom ── */}
        <div style={{
          padding:       collapsed ? '12px 8px' : '12px',
          borderTop:     '1px solid var(--sidebar-border)',
          display:       'flex',
          flexDirection: 'column',
          gap:           2,
          flexShrink:    0,
        }}>
          <BottomNavItem path="/app/profile"  icon={User}     label="Profile"  collapsed={collapsed} onNavigate={onNavigate} />
          <BottomNavItem path="/app/settings" icon={Settings} label="Settings" collapsed={collapsed} onNavigate={onNavigate} />

          <button
            type="button"
            onClick={handleLogout}
            className="nav-item logout-btn"
            aria-label="Logout"
            style={{
              width: '100%',
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '10px 0' : '10px 12px',
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar