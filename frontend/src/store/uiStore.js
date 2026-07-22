import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUIStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebarCollapsed: false,

      initTheme: () => {
        const t = get().theme
        if (t === 'dark') document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        if (next === 'dark') document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
        set({ theme: next })
      },
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: 'ui-storage',
      partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
)

export default useUIStore