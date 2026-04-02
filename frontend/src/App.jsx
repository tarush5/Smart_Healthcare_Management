import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Activity, Users, Search as SearchIcon, PieChart,
  ShieldAlert, MessageSquare, HeartPulse, Brain, Database
} from 'lucide-react'

import Dashboard from './pages/Dashboard'
import DiseasePrediction from './pages/DiseasePrediction'
import PatientManagement from './pages/PatientManagement'
import DataMining from './pages/DataMining'
import RiskAnalytics from './pages/RiskAnalytics'
import Chatbot from './pages/Chatbot'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
  { path: '/predict', label: 'Disease Prediction', icon: Brain, section: 'AI & ML' },
  { path: '/mining', label: 'Data Mining', icon: Database, section: 'AI & ML' },
  { path: '/risk', label: 'Risk Analytics', icon: ShieldAlert, section: 'AI & ML' },
  { path: '/patients', label: 'Patient Management', icon: Users, section: 'Management' },
  { path: '/chatbot', label: 'AI Chatbot', icon: MessageSquare, section: 'Tools' },
]

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
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
          <span className="status-dot"></span>
          <span>All Systems Operational</span>
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
