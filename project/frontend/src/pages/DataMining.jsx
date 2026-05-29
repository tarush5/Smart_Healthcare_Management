import React, { useState, useEffect } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts'
import { Database, GitBranch, Layers, TrendingUp } from 'lucide-react'
import { ML_URL } from '../config'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{
      background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13
    }}>
      <p style={{ color: '#f1f5f9', fontWeight: 600 }}>{d.cluster || d.name}</p>
      {d.age && <p style={{ color: '#94a3b8' }}>Age: {d.age}</p>}
      {d.chol && <p style={{ color: '#94a3b8' }}>Cholesterol: {d.chol}</p>}
      {d.value !== undefined && <p style={{ color: '#94a3b8' }}>Value: {d.value}</p>}
    </div>
  )
}

export default function DataMining() {
  const [rules, setRules] = useState([])
  const [clusters, setClusters] = useState(null)
  const [patterns, setPatterns] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('rules')

  useEffect(() => {
    Promise.all([
      fetch(`${ML_URL}/mining/association-rules`).then(r => r.json()).catch(() => ({ rules: [] })),
      fetch(`${ML_URL}/mining/clusters`).then(r => r.json()).catch(() => null),
      fetch(`${ML_URL}/mining/patterns`).then(r => r.json()).catch(() => null),
    ]).then(([r, c, p]) => {
      setRules(r.rules || [])
      setClusters(c)
      setPatterns(p)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Running data mining algorithms...</p></div>

  const strengthColor = (s) => s === 'strong' ? '#22c55e' : s === 'moderate' ? '#f59e0b' : '#64748b'

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Data Mining Insights</h1>
        <p>Discover hidden patterns using Apriori, K-Means, and correlation analysis</p>
      </div>

      {/* Section Tabs */}
      <div className="tabs">
        <button className={`tab ${activeSection === 'rules' ? 'active' : ''}`}
                onClick={() => setActiveSection('rules')}>
          🔗 Association Rules
        </button>
        <button className={`tab ${activeSection === 'clusters' ? 'active' : ''}`}
                onClick={() => setActiveSection('clusters')}>
          📊 Patient Clusters
        </button>
        <button className={`tab ${activeSection === 'patterns' ? 'active' : ''}`}
                onClick={() => setActiveSection('patterns')}>
          🔍 Pattern Discovery
        </button>
      </div>

      {/* Association Rules */}
      {activeSection === 'rules' && (
        <div className="slide-up">
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div>
                <div className="card-title">
                  <GitBranch size={18} style={{ display: 'inline', marginRight: 8 }} />
                  Association Rules (Apriori Algorithm)
                </div>
                <div className="card-subtitle">Symptom → Disease patterns with support, confidence, and lift metrics</div>
              </div>
              <span className="badge info">{rules.length} rules found</span>
            </div>
            <div className="table-container" style={{ maxHeight: 500, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Antecedents (IF)</th>
                    <th>Consequent (THEN)</th>
                    <th>Support</th>
                    <th>Confidence</th>
                    <th>Lift</th>
                    <th>Disease</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {r.antecedents.map((a, j) => (
                            <span key={j} style={{
                              background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                              padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600
                            }}>{a.replace(/_/g, ' ')}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600
                        }}>{r.consequents.join(', ').replace(/_/g, ' ')}</span>
                      </td>
                      <td>{(r.support * 100).toFixed(1)}%</td>
                      <td style={{ color: r.confidence > 0.7 ? '#22c55e' : r.confidence > 0.5 ? '#f59e0b' : '#94a3b8', fontWeight: 600 }}>
                        {(r.confidence * 100).toFixed(1)}%
                      </td>
                      <td>{r.lift?.toFixed(2)}x</td>
                      <td><span className="badge info">{r.disease_type}</span></td>
                    </tr>
                  ))}
                  {rules.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                      No rules found. Train models and generate datasets first.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Patient Clusters */}
      {activeSection === 'clusters' && clusters && (
        <div className="slide-up">
          {/* Cluster Summary Cards */}
          <div className="stats-grid stagger-children" style={{ marginBottom: 24 }}>
            {clusters.clusters?.map((c, i) => (
              <div className="stat-card" key={i} style={{ borderLeft: `3px solid ${c.color}` }}>
                <div className="stat-info">
                  <div className="stat-label" style={{ color: c.color, fontWeight: 700 }}>{c.risk_label}</div>
                  <div className="stat-value">{c.size}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                    Avg Age: {c.avg_age} | BP: {c.avg_bp} | Chol: {c.avg_chol}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                    Disease Rate: {(c.avg_disease_rate * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Scatter Plot */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Layers size={18} style={{ display: 'inline', marginRight: 8 }} />
                  K-Means Clustering — Patient Segmentation
                </div>
                <div className="card-subtitle">Patients grouped into 3 risk clusters (Age vs Cholesterol)</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="age" name="Age" stroke="#64748b" fontSize={12} label={{ value: 'Age', position: 'insideBottom', offset: -10, fill: '#64748b' }} />
                <YAxis type="number" dataKey="chol" name="Cholesterol" stroke="#64748b" fontSize={12} label={{ value: 'Cholesterol', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                {['High Risk', 'Medium Risk', 'Low Risk'].map((label, i) => {
                  const colors = ['#ef4444', '#f59e0b', '#22c55e']
                  const data = clusters.scatter_data?.filter(d => d.cluster === label) || []
                  return <Scatter key={label} name={label} data={data} fill={colors[i]} fillOpacity={0.6} />
                })}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Pattern Discovery */}
      {activeSection === 'patterns' && patterns && (
        <div className="slide-up">
          <div className="charts-grid">
            {/* Heart Disease Correlations */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">❤️ Heart Disease — Feature Correlations</div>
                  <div className="card-subtitle">How each feature relates to heart disease</div>
                </div>
              </div>
              <div className="feature-bar-container">
                {patterns.heart_disease_patterns?.map((p, i) => {
                  const pct = Math.abs(p.correlation) * 100
                  return (
                    <div className="feature-bar-row" key={i}>
                      <div className="feature-bar-label">{p.feature}</div>
                      <div className="feature-bar-track">
                        <div className="feature-bar-fill" style={{
                          width: `${Math.min(pct * 2.5, 100)}%`,
                          background: p.direction === 'positive' ? 'linear-gradient(90deg, #6366f1, #ef4444)' : 'linear-gradient(90deg, #6366f1, #22c55e)'
                        }}></div>
                      </div>
                      <div className="feature-bar-value" style={{ color: strengthColor(p.strength) }}>
                        {p.correlation > 0 ? '+' : ''}{(p.correlation * 100).toFixed(1)}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Diabetes Correlations */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">🩸 Diabetes — Feature Correlations</div>
                  <div className="card-subtitle">How each feature relates to diabetes</div>
                </div>
              </div>
              <div className="feature-bar-container">
                {patterns.diabetes_patterns?.map((p, i) => {
                  const pct = Math.abs(p.correlation) * 100
                  return (
                    <div className="feature-bar-row" key={i}>
                      <div className="feature-bar-label">{p.feature}</div>
                      <div className="feature-bar-track">
                        <div className="feature-bar-fill" style={{
                          width: `${Math.min(pct * 2.5, 100)}%`,
                          background: p.direction === 'positive' ? 'linear-gradient(90deg, #8b5cf6, #ef4444)' : 'linear-gradient(90deg, #8b5cf6, #22c55e)'
                        }}></div>
                      </div>
                      <div className="feature-bar-value" style={{ color: strengthColor(p.strength) }}>
                        {p.correlation > 0 ? '+' : ''}{(p.correlation * 100).toFixed(1)}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Symptom Co-occurrence */}
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header">
              <div>
                <div className="card-title">🔗 Symptom Co-occurrence</div>
                <div className="card-subtitle">How often symptom pairs appear together</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              {patterns.symptom_cooccurrence?.map((s, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12, padding: 16
                }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    {s.pair.map((p, j) => (
                      <span key={j} style={{
                        background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600
                      }}>{p}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>{s.co_occurrence}%</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>co-occurrence rate • {s.disease}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
