import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Activity, Users, Search as SearchIcon, PieChart,
  ShieldAlert, MessageSquare, HeartPulse, Brain, Database, BarChart3
} from 'lucide-react'
import { API_URL, ML_URL } from './config'

import Dashboard from './pages/Dashboard'
import DiseasePrediction from './pages/DiseasePrediction'
import PatientManagement from './pages/PatientManagement'
import DataMining from './pages/DataMining'
import RiskAnalytics from './pages/RiskAnalytics'
import Chatbot from './pages/Chatbot'
import Visualizations from './pages/Visualizations'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
  { path: '/predict', label: 'Disease Prediction', icon: Brain, section: 'AI & ML' },
  { path: '/mining', label: 'Data Mining', icon: Database, section: 'AI & ML' },
  { path: '/risk', label: 'Risk Analytics', icon: ShieldAlert, section: 'AI & ML' },
  { path: '/patients', label: 'Patient Management', icon: Users, section: 'Management' },
  { path: '/visualizations', label: 'ML Graphs', icon: BarChart3, section: 'Analytics' },
  { path: '/chatbot', label: 'AI Chatbot', icon: MessageSquare, section: 'Tools' },
]

function useBackendHealth() {
  const [apiHealth, setApiHealth] = useState(null)
  const [mlHealth, setMlHealth] = useState(null)

  useEffect(() => {
    const check = () => {
      fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) })
        .then(r => r.json())
        .then(d => setApiHealth(d.status === 'healthy' ? 'up' : 'down'))
        .catch(() => setApiHealth('down'))

      fetch(`${ML_URL}/health`, { signal: AbortSignal.timeout(3000) })
        .then(r => r.json())
        .then(d => setMlHealth(d.status === 'healthy' ? 'up' : 'down'))
        .catch(() => setMlHealth('down'))
    }
    check()
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
  }, [])

  return { apiHealth, mlHealth }
}

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { apiHealth, mlHealth } = useBackendHealth()
  let lastSection = ''

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">🧠</div>
        <div>
          <div className="sidebar-title">HealthCare AI</div>
          <div className="sidebar-subtitle">Smart System</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const showSection = item.section !== lastSection
          lastSection = item.section
          const Icon = item.icon
          return (
            <React.Fragment key={item.path}>
              {showSection && (
                <div className="nav-section-label">{item.section}</div>
              )}
              <div
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </div>
            </React.Fragment>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-status">
          <span className={`status-dot ${apiHealth === 'up' ? '' : 'offline'}`}></span>
          <span style={{ fontSize: 11 }}>API {apiHealth === 'up' ? 'Online' : apiHealth === 'down' ? 'Offline' : '...'}</span>
        </div>
        <div className="sidebar-status">
          <span className={`status-dot ${mlHealth === 'up' ? '' : 'offline'}`}></span>
          <span style={{ fontSize: 11 }}>ML {mlHealth === 'up' ? 'Online' : mlHealth === 'down' ? 'Starting...' : '...'}</span>
        </div>
      </div>
    </aside>
  )
}

function AppContent() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/predict" element={<DiseasePrediction />} />
            <Route path="/patients" element={<PatientManagement />} />
            <Route path="/mining" element={<DataMining />} />
            <Route path="/risk" element={<RiskAnalytics />} />
            <Route path="/visualizations" element={<Visualizations />} />
            <Route path="/chatbot" element={<Chatbot />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
