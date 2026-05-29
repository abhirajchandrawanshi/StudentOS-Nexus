import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/common/Sidebar'
import Navbar from '../components/common/Navbar'
import useUIStore from '../store/uiStore'
import { useIsMobile } from '../hooks/useIsMobile'

const DashboardLayout = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const isMobile = useIsMobile()
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      height: '100dvh',
      width: '100%',
      overflow: 'hidden',
      background: 'var(--background)',
    }}>

      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          onClick={closeMobile}
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar — drawer on mobile, inline on desktop */}
      {isMobile ? (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          height: '100dvh',
          zIndex: 50,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <Sidebar collapsed={false} onNavigate={closeMobile} onClose={closeMobile} isMobile />
        </div>
      ) : (
        <Sidebar collapsed={sidebarCollapsed} />
      )}

      {/* Right column: Navbar + Page content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        height: '100dvh',
        overflow: 'hidden',
      }}>
        <Navbar
          onToggleSidebar={isMobile ? () => setMobileOpen(p => !p) : toggleSidebar}
          sidebarCollapsed={isMobile ? !mobileOpen : sidebarCollapsed}
          isMobile={isMobile}
        />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '16px' : '24px',
          background: 'var(--background)',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout