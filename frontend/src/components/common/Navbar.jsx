import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu, Search, Bell, Sun, Moon,
  User, Settings, LogOut, Flame,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import authService from '../../services/authService'

const NOTIFS = [
  { id: 1, text: 'Graph BFS/DFS recommended for you', time: '2m ago',  unread: true },
  { id: 2, text: '12-day study streak — keep going 🔥', time: '1h ago', unread: true },
  { id: 3, text: 'Resume analysis complete',            time: '3h ago', unread: false },
]

const Navbar = ({ onToggleSidebar, sidebarCollapsed, isMobile }) => {
  const navigate = useNavigate()
  const { user, logout }       = useAuthStore()
  const { theme, toggleTheme } = useUIStore()

  const [notifOpen,     setNotifOpen]     = useState(false)
  const [userOpen,      setUserOpen]      = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [notifs,        setNotifs]        = useState(NOTIFS)

  const notifRef = useRef(null)
  const userRef  = useRef(null)

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const unread   = notifs.filter(n => n.unread).length

  useEffect(() => {
    const fn = e => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (userRef.current  && !userRef.current.contains(e.target))  setUserOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const handleLogout = () => {
    authService.logout()
    logout()
    navigate('/login')
  }

  const handleNotifClick = (n) => {
    setNotifs(prev => prev.map(notif => notif.id === n.id ? { ...notif, unread: false } : notif))
    setNotifOpen(false)
    if (n.id === 1) navigate('/app/dsa')
    if (n.id === 3) navigate('/app/resume')
  }

  const handleMarkAllRead = () => {
    setNotifs(prev => prev.map(notif => ({ ...notif, unread: false })))
  }

  const dropdown = {
    position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 50,
    background: 'var(--background-card)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
    minWidth: '200px',
  }

  const iconBtn = (extraStyle = {}) => ({
    width: '36px', height: '36px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '10px', cursor: 'pointer', border: 'none',
    background: 'transparent', color: 'var(--foreground-muted)',
    transition: 'all 0.15s', flexShrink: 0,
    ...extraStyle,
  })

  return (
    <header style={{
      height:       '56px',
      display:      'flex',
      alignItems:   'center',
      gap:          isMobile ? '8px' : '12px',
      padding:      isMobile ? '0 12px' : '0 20px',
      position:     'relative',
      background:   'var(--background)',
      borderBottom: '1px solid var(--border)',
      flexShrink:   0,
      zIndex:       20,
    }}>

      {/* ── Hamburger ── */}
      <button
        type="button"
        onClick={onToggleSidebar}
        style={iconBtn()}
        aria-label={isMobile ? (sidebarCollapsed ? 'Open navigation menu' : 'Close navigation menu') : (sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--background-hover)'; e.currentTarget.style.color = 'var(--foreground)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--foreground-muted)' }}
      >
        <Menu size={19} />
      </button>

      {/* ── Search bar ── */}
      <div style={{
        flex:         1,
        maxWidth:     isMobile ? '100%' : '520px',
        height:       '38px',
        display:      'flex',
        alignItems:   'center',
        gap:          '10px',
        padding:      '0 14px',
        borderRadius: '10px',
        background:   'var(--background-card)',
        border:       `1px solid ${searchFocused ? 'rgba(124,58,237,0.6)' : 'var(--border)'}`,
        boxShadow:    searchFocused ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
        transition:   'all 0.15s',
        cursor:       'text',
      }}>
        <Search size={15} style={{ color: 'var(--foreground-muted)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder={isMobile ? 'Search...' : 'Ask anything...'}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          aria-label="Search"
          style={{
            flex: 1, background: 'transparent',
            border: 'none', outline: 'none',
            fontSize: '14px', color: 'var(--foreground)',
            fontFamily: 'inherit',
          }}
        />
        {/* Ctrl+K — desktop only */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {['Ctrl', 'K'].map(k => (
              <kbd key={k} style={{
                padding: '2px 6px', borderRadius: '5px', fontSize: '11px',
                fontFamily: 'monospace', color: 'var(--foreground-subtle)',
                background: 'var(--muted)', border: '1px solid var(--border)',
              }}>
                {k}
              </kbd>
            ))}
          </div>
        )}
      </div>

      {/* ── Spacer ── */}
      {!isMobile && <div style={{ flex: 1 }} />}

      {/* ── Right actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '6px' }}>

        {/* Streak pill — desktop only */}
        {!isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '10px',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.25)',
          }}>
            <Flame size={14} style={{ color: '#F59E0B' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#F59E0B' }}>
              12 day streak
            </span>
          </div>
        )}

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            type="button"
            onClick={() => { setNotifOpen(p => !p); setUserOpen(false) }}
            style={{ ...iconBtn(), position: 'relative' }}
            aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--background-hover)'; e.currentTarget.style.color = 'var(--foreground)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--foreground-muted)' }}
          >
            <Bell size={17} />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: '7px', right: '7px',
                width: '7px', height: '7px', borderRadius: '50%',
                background: '#EC4899',
                border: '1.5px solid var(--background)',
              }} />
            )}
          </button>

          {notifOpen && (
            <div style={{
              ...dropdown,
              width: isMobile ? 'calc(100vw - 32px)' : '280px',
              right: isMobile ? '-60px' : 0,
              maxWidth: '320px',
            }} className="fade-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Notifications</span>
                {unread > 0 && (
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: 'rgba(236,72,153,0.12)', color: '#EC4899', border: '1px solid rgba(236,72,153,0.25)' }}>
                    {unread} new
                  </span>
                )}
              </div>
              {notifs.map(n => (
                <div key={n.id} onClick={() => handleNotifClick(n)} style={{
                  padding: '12px 16px', cursor: 'pointer', transition: 'background 0.12s',
                  background: n.unread ? 'rgba(124,58,237,0.05)' : 'transparent',
                  borderBottom: '1px solid var(--border)',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--background-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.unread ? 'rgba(124,58,237,0.05)' : 'transparent'}
                >
                  <p style={{ fontSize: '13px', color: 'var(--foreground-muted)', marginBottom: '4px' }}>{n.text}</p>
                  <p style={{ fontSize: '11px', color: 'var(--foreground-subtle)' }}>{n.time}</p>
                </div>
              ))}
              <div style={{ padding: '10px 16px' }}>
                <button type="button" onClick={handleMarkAllRead} style={{ fontSize: '13px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          style={iconBtn()}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--background-hover)'; e.currentTarget.style.color = 'var(--foreground)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--foreground-muted)' }}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User avatar */}
        <div style={{ position: 'relative' }} ref={userRef}>
          <button
            type="button"
            onClick={() => { setUserOpen(p => !p); setNotifOpen(false) }}
            aria-label="User menu"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '4px 8px 4px 4px', borderRadius: '10px',
              border: 'none', cursor: 'pointer', background: 'transparent',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--background-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'linear-gradient(135deg,#7C3AED,#EC4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {initials}
            </div>
          </button>

          {userOpen && (
            <div style={{
              ...dropdown,
              right: 0,
              maxWidth: isMobile ? 'calc(100vw - 32px)' : undefined,
            }} className="fade-in">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>
                  {user?.name || 'Student'}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>
                  {user?.email || ''}
                </p>
              </div>
              <div style={{ padding: '6px' }}>
                {[
                  { icon: User,     label: 'Profile',  path: '/app/profile' },
                  { icon: Settings, label: 'Settings', path: '/app/settings' },
                ].map(({ icon: Icon, label, path }) => (
                  <button key={label} type="button"
                    onClick={() => { navigate(path); setUserOpen(false) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '8px', border: 'none',
                      background: 'transparent', cursor: 'pointer', fontSize: '13px',
                      color: 'var(--foreground-muted)', transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--background-hover)'; e.currentTarget.style.color = 'var(--foreground)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--foreground-muted)' }}
                  >
                    <Icon size={15} />{label}
                  </button>
                ))}
              </div>
              <div style={{ padding: '6px', borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '8px', border: 'none',
                    background: 'transparent', cursor: 'pointer', fontSize: '13px',
                    color: '#ef4444', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={15} />Logout
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