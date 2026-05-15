import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/common/Sidebar'
import Navbar from '../components/common/Navbar'
 
const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
 
  return (
    <div className="flex h-screen bg-[#0a0f1e] overflow-hidden">
 
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((p) => !p)}
      />
 
      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
 
        {/* Top navbar */}
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onMenuClick={() => setSidebarCollapsed((p) => !p)}
        />
 
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
 
      </div>
    </div>
  )
}
 
export default DashboardLayout