import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, AreaChart, Area, Legend
} from 'recharts'
import { Users, Activity, ShieldAlert, TrendingUp, HeartPulse, Brain } from 'lucide-react'

const API_URL = 'http://localhost:3001/api'
const ML_URL = 'http://localhost:8000'

const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13
    }}>
      <p style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#f1f5f9' }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [modelData, setModelData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/stats`).then(r => r.json()).catch(() => null),
      fetch(`${ML_URL}/models/comparison`).then(r => r.json()).catch(() => null)
    ]).then(([s, m]) => {
      setStats(s)
      setModelData(m)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    )
  }

  const diseaseData = stats?.diseaseDistribution?.map(d => ({
    name: d.disease_type, value: d.count
  })) || [
    { name: 'Heart Disease', value: 8 },
    { name: 'Diabetes', value: 5 },
    { name: 'Kidney Disease', value: 3 }
  ]

  const riskData = stats?.riskDistribution?.map(d => ({
    name: d.risk_level, value: d.count
  })) || [
    { name: 'High', value: 5 },
    { name: 'Medium', value: 7 },
    { name: 'Low', value: 4 }
  ]

  const riskColors = { 'High': '#ef4444', 'Medium': '#f59e0b', 'Low': '#22c55e', 'Critical': '#dc2626' }

  // Build radar data from model comparison
  const radarData = []
  if (modelData) {
    const algorithms = ['Logistic Regression', 'Random Forest', 'Decision Tree', 'SVM']
    algorithms.forEach(algo => {
      const entry = { algorithm: algo.replace('Logistic Regression', 'Log. Reg.') }
      Object.keys(modelData).forEach(disease => {
        const r = modelData[disease]?.all_results?.[algo]
        if (r) {
          const label = disease.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()).replace('_', ' ')
          entry[label] = r.accuracy
        }
      })
      radarData.push(entry)
    })
  }

  const totalPatients = stats?.totalPatients || 30
  const totalPredictions = stats?.totalPredictions || 15
  const highRisk = stats?.highRiskCount || 5
  const avgAccuracy = modelData ? Math.round(
    Object.values(modelData).reduce((sum, d) => sum + (d.best_accuracy || 0), 0) / Object.keys(modelData).length
  ) : 85

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>AI-powered healthcare analytics and insights overview</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid stagger-children">
        <div className="stat-card purple">
          <div className="stat-icon purple"><Users size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Patients</div>
            <div className="stat-value">{totalPatients}</div>
            <div className="stat-change up">↑ Active records</div>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue"><Brain size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">AI Predictions</div>
            <div className="stat-value">{totalPredictions}</div>
            <div className="stat-change up">↑ ML-powered</div>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon orange"><ShieldAlert size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">High Risk Patients</div>
            <div className="stat-value">{highRisk}</div>
            <div className="stat-change down">⚠ Need attention</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><TrendingUp size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Avg Model Accuracy</div>
            <div className="stat-value">{avgAccuracy}%</div>
            <div className="stat-change up">↑ Best performing</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Disease Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Disease Distribution</div>
              <div className="card-subtitle">Predictions by disease type</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={diseaseData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                   paddingAngle={5} dataKey="value" stroke="none">
                {diseaseData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" iconType="circle"
                      formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 13 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Risk Level Breakdown</div>
              <div className="card-subtitle">Patient risk categorization</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={riskData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {riskData.map((entry, i) => (
                  <Cell key={i} fill={riskColors[entry.name] || COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Comparison Radar + Recent Predictions */}
      <div className="charts-grid" style={{ marginTop: 0 }}>
        {/* Model Accuracy Radar */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Model Accuracy Comparison</div>
              <div className="card-subtitle">Performance across algorithms</div>
            </div>
          </div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="algorithm" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[50, 100]} />
                {Object.keys(radarData[0] || {}).filter(k => k !== 'algorithm').map((key, i) => (
                  <Radar key={key} name={key} dataKey={key}
                         stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
                ))}
                <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p>Train ML models to see accuracy comparison</p>
            </div>
          )}
        </div>

        {/* Recent Predictions */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Predictions</div>
              <div className="card-subtitle">Latest AI disease predictions</div>
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Disease</th>
                  <th>Risk</th>
                  <th>Probability</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentPredictions || []).slice(0, 7).map((p, i) => (
                  <tr key={i}>
                    <td style={{ color: '#f1f5f9' }}>{p.patient_name || 'Anonymous'}</td>
                    <td>{p.disease_type}</td>
                    <td><span className={`badge ${p.risk_level.toLowerCase()}`}>{p.risk_level}</span></td>
                    <td>{p.probability?.toFixed(1)}%</td>
                  </tr>
                ))}
                {(!stats?.recentPredictions?.length) && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                    No predictions yet. Use Disease Prediction to get started.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
