import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useNavigate as useRouterNavigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import FlowBarView from './pages/flow-bar/FlowBarView'
import HomePage from './pages/home/HomePage'
import SettingsPage from './pages/settings/SettingsPage'
import HistoryPage from './pages/history/HistoryPage'
import AnalyticsPage from './pages/analytics/AnalyticsPage'

function NavigationListener() {
  const navigate = useRouterNavigate()

  useEffect(() => {
    const unsub = window.mubble.onNavigate((path) => {
      navigate(path)
    })
    return unsub
  }, [navigate])

  return null
}

function AppRoutes() {
  return (
    <>
      <NavigationListener />
      <Routes>
        <Route path="/flow-bar" element={<FlowBarView />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/settings/*" element={<SettingsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}
