import React, { useState, useEffect } from 'react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  ScatterChart, Scatter, AreaChart, Area, Legend, ZAxis
} from 'recharts'
import { ShieldAlert, AlertTriangle, CheckCircle, Activity, HeartPulse, Brain } from 'lucide-react'
import { ML_URL, API_URL } from '../config'

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

function RiskGauge({ score, level }) {
  const radius = 80
  const circumference = Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score > 75 ? '#ef4444' : score > 50 ? '#f59e0b' : score > 25 ? '#3b82f6' : '#22c55e'

  return (
    <div className="risk-gauge-container">
      <svg width="200" height="120" viewBox="0 0 200 120">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </svg>
      <div className="risk-gauge-value" style={{ color, marginTop: -30 }}>{score}%</div>
      <div className="risk-gauge-label" style={{ color }}>{level}</div>
    </div>
  )
}

export default function RiskAnalytics() {
  const [activeTab, setActiveTab] = useState('individual')
  const [populationData, setPopulationData] = useState(null)
  const [form, setForm] = useState({
    age: '', gender: 'Male', bmi: '', blood_pressure: '', cholesterol: '',
    glucose: '', smoking: false, family_history: false, exercise: true
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/analytics/risk-trends`)
      .then(r => r.json())
      .then(d => setPopulationData(d.records))
      .catch(e => console.error(e))
  }, [])

  const riskByGenderData = []
  if (populationData) {
    ['Male', 'Female'].forEach(g => {
      const records = populationData.filter(d => d.gender === g)
      if (records.length) {
         riskByGenderData.push({
           gender: g,
           Low: records.filter(d => d.risk_level === 'Low').length,
           Medium: records.filter(d => d.risk_level === 'Medium').length,
           High: records.filter(d => ['High', 'Critical'].includes(d.risk_level)).length
         })
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${ML_URL}/risk/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: Number(form.age) || 0,
          bmi: Number(form.bmi) || 0,
          blood_pressure: Number(form.blood_pressure) || 0,
          cholesterol: Number(form.cholesterol) || 0,
          glucose: Number(form.glucose) || 0
        })
      })
      setResult(await res.json())
    } catch {
      setResult({ error: true })
    }
    setLoading(false)
  }

  const diseaseRiskData = result?.disease_risks ? [
    { name: 'Heart Disease', value: result.disease_risks.heart_disease, color: '#ef4444' },
    { name: 'Diabetes', value: result.disease_risks.diabetes, color: '#f59e0b' },
    { name: 'Kidney Disease', value: result.disease_risks.kidney_disease, color: '#8b5cf6' },
  ] : []

  const radarData = result?.risk_factors ? result.risk_factors.map(f => ({
    factor: f.factor.length > 18 ? f.factor.substring(0, 18) + '...' : f.factor,
    impact: f.impact
  })) : []

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Risk Analytics</h1>
        <p>Comprehensive health risk assessment with multi-disease scoring</p>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'individual' ? 'active' : ''}`}
                onClick={() => setActiveTab('individual')}>
          👤 Individual Assessment
        </button>
        <button className={`tab ${activeTab === 'population' ? 'active' : ''}`}
                onClick={() => setActiveTab('population')}>
          🌍 Population Analytics
        </button>
      </div>

      {activeTab === 'individual' && (
        <div className="slide-up">
          <div className="charts-grid">
            {/* Risk Assessment Form */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🩺 Health Risk Assessment</div>
              <div className="card-subtitle">Enter patient health data for risk scoring</div>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Age</label>
                <input className="form-input" type="number" placeholder="55"
                       value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" value={form.gender}
                        onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option>Male</option><option>Female</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">BMI</label>
                <input className="form-input" type="number" step="0.1" placeholder="28.5"
                       value={form.bmi} onChange={e => setForm({ ...form, bmi: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Blood Pressure (systolic)</label>
                <input className="form-input" type="number" placeholder="130"
                       value={form.blood_pressure} onChange={e => setForm({ ...form, blood_pressure: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cholesterol (mg/dl)</label>
                <input className="form-input" type="number" placeholder="220"
                       value={form.cholesterol} onChange={e => setForm({ ...form, cholesterol: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Blood Glucose (mg/dl)</label>
                <input className="form-input" type="number" placeholder="100"
                       value={form.glucose} onChange={e => setForm({ ...form, glucose: e.target.value })} />
              </div>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { key: 'smoking', label: '🚬 Smoking', neg: true },
                { key: 'family_history', label: '👨‍👩‍👧 Family History', neg: true },
                { key: 'exercise', label: '🏃 Regular Exercise', neg: false }
              ].map(t => (
                <label key={t.key} style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  padding: '8px 14px', borderRadius: 8, fontSize: 13,
                  background: form[t.key] ? (t.neg ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)') : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${form[t.key] ? (t.neg ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)') : 'rgba(255,255,255,0.06)'}`,
                  color: form[t.key] ? (t.neg ? '#ef4444' : '#22c55e') : '#64748b',
                  transition: 'all 200ms'
                }}>
                  <input type="checkbox" checked={form[t.key]}
                         onChange={e => setForm({ ...form, [t.key]: e.target.checked })}
                         style={{ display: 'none' }} />
                  {t.label}
                </label>
              ))}
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
                    style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Calculating...' : '🔬 Assess Risk'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {result?.error ? (
            <div className="card empty-state">
              <div className="empty-state-icon">⚠️</div>
              <h3>Connection Error</h3>
              <p>Ensure ML backend is running on port 8000</p>
            </div>
          ) : result ? (
            <>
              {/* Risk Gauge */}
              <div className="card">
                <RiskGauge score={result.risk_score} level={result.risk_level + ' Risk'} />
              </div>

              {/* Disease-specific risk */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Disease-Specific Risk</div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={diseaseRiskData} layout="vertical" barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={110} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {diseaseRiskData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.8} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="card empty-state">
              <div className="empty-state-icon">📊</div>
              <h3>No Assessment Yet</h3>
              <p>Fill in patient data and click Assess Risk</p>
            </div>
          )}
        </div>
      </div>

      {/* Risk Factors + Recommendations */}
      {result && !result.error && (
        <div className="charts-grid" style={{ marginTop: 24 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">⚠️ Risk Factor Breakdown</div>
            </div>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="factor" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Radar name="Impact" dataKey="impact" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: '#64748b', textAlign: 'center', padding: 32 }}>No significant risk factors detected.</p>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">💡 Recommendations</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {result.recommendations?.map((rec, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: 12, background: 'rgba(34,197,94,0.06)',
                  border: '1px solid rgba(34,197,94,0.12)', borderRadius: 8
                }}>
                  <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: '#d1d5db' }}>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
        </div>
      )}

      {/* Population Analytics Tab */}
      {activeTab === 'population' && (
        <div className="slide-up">
          <div className="charts-grid">
            
            {/* Age vs Risk Probability Scatter Plot */}
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-header">
                <div>
                  <div className="card-title">📈 Age vs Risk Probability</div>
                  <div className="card-subtitle">Distribution of predicted risks across patient ages</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" dataKey="age" name="Age" stroke="#64748b" label={{ value: 'Age', position: 'insideBottom', fill: '#64748b', offset: -10 }} />
                  <YAxis type="number" dataKey="probability" name="Probability" unit="%" stroke="#64748b" label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                  <ZAxis type="category" dataKey="disease" name="Disease" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                  
                  {populationData && ['Heart Disease', 'Diabetes', 'Kidney Disease'].map((disease, i) => {
                    const colors = ['#ef4444', '#f59e0b', '#8b5cf6']
                    const data = populationData.filter(d => d.disease_type === disease)
                    return <Scatter key={disease} name={disease} data={data} fill={colors[i]} fillOpacity={0.6} />
                  })}
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Distribution by Gender Stacked Bar */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">🚻 Risk Distribution by Gender</div>
                  <div className="card-subtitle">Proportion of risk levels across genders</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={riskByGenderData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="gender" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                  <Bar dataKey="Low" stackId="a" fill="#22c55e" />
                  <Bar dataKey="Medium" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="High" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Probability Density Area */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">🔬 Risk Probability Density</div>
                  <div className="card-subtitle">Area chart representing probability trend</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={populationData && populationData.slice().sort((a,b) => a.probability - b.probability)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="probability" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="probability" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProb)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
