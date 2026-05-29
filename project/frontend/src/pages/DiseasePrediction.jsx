import React, { useState, useEffect } from 'react'
import { HeartPulse, Droplets, Bean, Brain } from 'lucide-react'
import ImageUploadScanner from '../components/ImageUploadScanner'
import { ML_URL, API_URL } from '../config'

const DISEASE_CONFIGS = {
  heart: {
    title: 'Heart Disease',
    icon: '❤️',
    endpoint: '/predict/heart',
    fields: [
      { name: 'age', label: 'Age', type: 'number', placeholder: '55', min: 1, max: 120 },
      { name: 'sex', label: 'Sex', type: 'select', options: [{ v: 1, l: 'Male' }, { v: 0, l: 'Female' }] },
      { name: 'cp', label: 'Chest Pain Type', type: 'select', options: [
        { v: 0, l: 'Typical Angina' }, { v: 1, l: 'Atypical Angina' },
        { v: 2, l: 'Non-anginal Pain' }, { v: 3, l: 'Asymptomatic' }
      ]},
      { name: 'trestbps', label: 'Resting Blood Pressure (mm Hg)', type: 'number', placeholder: '130' },
      { name: 'chol', label: 'Cholesterol (mg/dl)', type: 'number', placeholder: '240' },
      { name: 'fbs', label: 'Fasting Blood Sugar > 120', type: 'select', options: [{ v: 0, l: 'No' }, { v: 1, l: 'Yes' }] },
      { name: 'restecg', label: 'Resting ECG', type: 'select', options: [
        { v: 0, l: 'Normal' }, { v: 1, l: 'ST-T Abnormality' }, { v: 2, l: 'LV Hypertrophy' }
      ]},
      { name: 'thalach', label: 'Max Heart Rate Achieved', type: 'number', placeholder: '150' },
      { name: 'exang', label: 'Exercise Induced Angina', type: 'select', options: [{ v: 0, l: 'No' }, { v: 1, l: 'Yes' }] },
      { name: 'oldpeak', label: 'ST Depression', type: 'number', placeholder: '1.5', step: '0.1' },
      { name: 'slope', label: 'ST Slope', type: 'select', options: [
        { v: 0, l: 'Upsloping' }, { v: 1, l: 'Flat' }, { v: 2, l: 'Downsloping' }
      ]},
      { name: 'ca', label: 'Major Vessels (0-4)', type: 'number', placeholder: '0', min: 0, max: 4 },
      { name: 'thal', label: 'Thalassemia', type: 'select', options: [
        { v: 0, l: 'Normal' }, { v: 1, l: 'Fixed Defect' }, { v: 2, l: 'Normal' }, { v: 3, l: 'Reversible Defect' }
      ]},
    ]
  },
  diabetes: {
    title: 'Diabetes',
    icon: '🩸',
    endpoint: '/predict/diabetes',
    fields: [
      { name: 'Pregnancies', label: 'Pregnancies', type: 'number', placeholder: '2', min: 0 },
      { name: 'Glucose', label: 'Glucose Level (mg/dl)', type: 'number', placeholder: '120' },
      { name: 'BloodPressure', label: 'Blood Pressure (mm Hg)', type: 'number', placeholder: '72' },
      { name: 'SkinThickness', label: 'Skin Thickness (mm)', type: 'number', placeholder: '26' },
      { name: 'Insulin', label: 'Insulin Level (mu U/ml)', type: 'number', placeholder: '140' },
      { name: 'BMI', label: 'BMI', type: 'number', placeholder: '32.0', step: '0.1' },
      { name: 'DiabetesPedigreeFunction', label: 'Diabetes Pedigree Function', type: 'number', placeholder: '0.47', step: '0.01' },
      { name: 'Age', label: 'Age', type: 'number', placeholder: '45', min: 1, max: 120 },
    ]
  },
  kidney: {
    title: 'Kidney Disease',
    icon: '🫘',
    endpoint: '/predict/kidney',
    fields: [
      { name: 'age', label: 'Age', type: 'number', placeholder: '55' },
      { name: 'bp', label: 'Blood Pressure (mm Hg)', type: 'number', placeholder: '80' },
      { name: 'sg', label: 'Specific Gravity', type: 'select', options: [
        { v: 1.005, l: '1.005' }, { v: 1.010, l: '1.010' }, { v: 1.015, l: '1.015' },
        { v: 1.020, l: '1.020' }, { v: 1.025, l: '1.025' }
      ]},
      { name: 'al', label: 'Albumin (0-5)', type: 'number', placeholder: '0', min: 0, max: 5 },
      { name: 'su', label: 'Sugar (0-5)', type: 'number', placeholder: '0', min: 0, max: 5 },
      { name: 'bgr', label: 'Blood Glucose (mg/dl)', type: 'number', placeholder: '120' },
      { name: 'bu', label: 'Blood Urea (mg/dl)', type: 'number', placeholder: '50' },
      { name: 'sc', label: 'Serum Creatinine (mg/dl)', type: 'number', placeholder: '1.2', step: '0.1' },
      { name: 'sod', label: 'Sodium (mEq/L)', type: 'number', placeholder: '140', step: '0.1' },
      { name: 'pot', label: 'Potassium (mEq/L)', type: 'number', placeholder: '4.5', step: '0.1' },
      { name: 'hemo', label: 'Hemoglobin (g)', type: 'number', placeholder: '13', step: '0.1' },
      { name: 'pcv', label: 'Packed Cell Volume', type: 'number', placeholder: '40' },
      { name: 'wc', label: 'White Blood Cell Count', type: 'number', placeholder: '8000' },
      { name: 'rc', label: 'Red Blood Cell Count (M/cmm)', type: 'number', placeholder: '4.8', step: '0.1' },
      { name: 'htn', label: 'Hypertension', type: 'select', options: [{ v: 0, l: 'No' }, { v: 1, l: 'Yes' }] },
      { name: 'dm', label: 'Diabetes Mellitus', type: 'select', options: [{ v: 0, l: 'No' }, { v: 1, l: 'Yes' }] },
      { name: 'cad', label: 'Coronary Artery Disease', type: 'select', options: [{ v: 0, l: 'No' }, { v: 1, l: 'Yes' }] },
      { name: 'appet', label: 'Appetite', type: 'select', options: [{ v: 1, l: 'Good' }, { v: 0, l: 'Poor' }] },
      { name: 'pe', label: 'Pedal Edema', type: 'select', options: [{ v: 0, l: 'No' }, { v: 1, l: 'Yes' }] },
      { name: 'ane', label: 'Anemia', type: 'select', options: [{ v: 0, l: 'No' }, { v: 1, l: 'Yes' }] },
    ]
  },
  scan: {
    title: 'Medical Report Scan',
    icon: '📸',
    isUpload: true
  }
}

export default function DiseasePrediction() {
  const [activeTab, setActiveTab] = useState('heart')
  const [formData, setFormData] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [featureImportance, setFeatureImportance] = useState(null)

  const config = DISEASE_CONFIGS[activeTab]

  useEffect(() => {
    setFormData({})
    setResult(null)
    setFeatureImportance(null)
    // Fetch feature importance
    const diseaseKey = activeTab === 'heart' ? 'heart_disease' : activeTab === 'diabetes' ? 'diabetes' : 'kidney_disease'
    fetch(`${ML_URL}/models/feature-importance/${diseaseKey}`)
      .then(r => r.json()).then(d => setFeatureImportance(d.features)).catch(() => {})
  }, [activeTab])

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const payload = {}
    config.fields.forEach(f => {
      const val = formData[f.name]
      payload[f.name] = val !== undefined && val !== '' ? Number(val) : 0
    })

    try {
      const res = await fetch(`${ML_URL}${config.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      setResult(data)

      // Save prediction to backend
      fetch(`${API_URL}/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disease_type: data.disease,
          risk_level: data.risk_level,
          probability: data.probability,
          model_used: data.model_used,
          input_data: payload
        })
      }).catch(() => {})
    } catch (err) {
      setResult({ error: 'Failed to connect to ML backend. Ensure the server is running on port 8000.' })
    }
    setLoading(false)
  }

  const riskColor = result?.risk_level === 'High' ? 'high' : result?.risk_level === 'Medium' ? 'medium' : 'low'

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Disease Prediction</h1>
        <p>AI-powered disease risk assessment using trained ML models</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {Object.entries(DISEASE_CONFIGS).map(([key, cfg]) => (
          <button key={key} className={`tab ${activeTab === key ? 'active' : ''}`}
                  onClick={() => setActiveTab(key)}>
            {cfg.icon} {cfg.title}
          </button>
        ))}
      </div>

      {activeTab === 'scan' ? (
        <ImageUploadScanner />
      ) : (
      <div className="charts-grid">
        {/* Input Form */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{config.icon} {config.title} Assessment</div>
              <div className="card-subtitle">Enter patient data for prediction</div>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              {config.fields.map(field => (
                <div className="form-group" key={field.name}>
                  <label className="form-label">{field.label}</label>
                  {field.type === 'select' ? (
                    <select className="form-select" value={formData[field.name] ?? ''}
                            onChange={e => handleChange(field.name, e.target.value)}>
                      <option value="">Select...</option>
                      {field.options.map(o => (
                        <option key={o.v} value={o.v}>{o.l}</option>
                      ))}
                    </select>
                  ) : (
                    <input className="form-input" type="number"
                           placeholder={field.placeholder} step={field.step || '1'}
                           min={field.min} max={field.max}
                           value={formData[field.name] ?? ''}
                           onChange={e => handleChange(field.name, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
                    style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              {loading ? (
                <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div> Analyzing...</>
              ) : (
                <><Brain size={20} /> Run AI Prediction</>
              )}
            </button>
          </form>
        </div>

        {/* Result + Feature Importance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Prediction Result */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Prediction Result</div>
                <div className="card-subtitle">AI model output</div>
              </div>
            </div>
            {result?.error ? (
              <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <h3>Connection Error</h3>
                <p style={{ fontSize: 13 }}>{result.error}</p>
              </div>
            ) : result ? (
              <div className="prediction-result">
                <div className={`prediction-probability ${riskColor}`}>
                  {result.probability?.toFixed(1)}%
                </div>
                <div className="prediction-label">
                  <span className={`badge ${riskColor}`} style={{ fontSize: 14, padding: '6px 16px' }}>
                    {result.risk_level} Risk
                  </span>
                </div>
                <p style={{ color: '#94a3b8', marginTop: 12, fontSize: 14 }}>
                  {result.interpretation}
                </p>
                <p style={{ color: '#64748b', marginTop: 8, fontSize: 12 }}>
                  Model: {result.model_used}
                </p>
                {result.medications && result.medications.length > 0 && (
                  <div style={{ backgroundColor: '#0f172a', padding: 12, borderRadius: 8, marginTop: 16 }}>
                    <strong style={{ fontSize: 13, color: '#f8fafc', display: 'block', marginBottom: 8 }}>Suggested Medications:</strong>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: '#94a3b8' }}>
                      {result.medications.map((med, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{med}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🔬</div>
                <h3>Awaiting Input</h3>
                <p>Fill in patient data and run prediction</p>
              </div>
            )}
          </div>

          {/* Feature Importance */}
          {featureImportance && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Feature Importance</div>
                  <div className="card-subtitle">What matters most for prediction</div>
                </div>
              </div>
              <div className="feature-bar-container">
                {featureImportance.slice(0, 8).map((f, i) => {
                  const maxVal = featureImportance[0]?.importance || 1
                  const pct = (f.importance / maxVal) * 100
                  return (
                    <div className="feature-bar-row" key={i}>
                      <div className="feature-bar-label">{f.feature}</div>
                      <div className="feature-bar-track">
                        <div className="feature-bar-fill" style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="feature-bar-value">{(f.importance * 100).toFixed(1)}%</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
