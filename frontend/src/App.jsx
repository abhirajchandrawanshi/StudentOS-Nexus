import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import useUIStore from './store/uiStore'

function App() {
  const { initTheme } = useUIStore()
  useEffect(() => { initTheme() }, [initTheme])
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App