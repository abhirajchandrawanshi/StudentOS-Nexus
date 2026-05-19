import { Outlet } from 'react-router-dom'
import Sidebar from '../components/common/Sidebar'
import Navbar from '../components/common/Navbar'
import useUIStore from '../store/uiStore'

const DashboardLayout = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--background)' }}
    >
      <Sidebar collapsed={sidebarCollapsed} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ background: 'var(--background)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout