import React, { useState, useRef } from 'react'
import { UploadCloud, FileText, Brain, Activity, ShieldAlert, CheckCircle } from 'lucide-react'
import { ML_URL } from '../config'

export default function ImageUploadScanner() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setError(null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setResult(null)
      setError(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${ML_URL}/predict/image-unified`, {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('API request failed')
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError('Failed to process image. Ensure ML backend is running.')
    }
    setLoading(false)
  }

  const renderRiskBadge = (disease, riskData) => {
    const riskColor = riskData.risk_level === 'High' ? 'high' : riskData.risk_level === 'Medium' ? 'medium' : 'low'
    return (
      <div className="card" key={disease} style={{ flex: 1, minWidth: 200, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h4 style={{ margin: 0, textTransform: 'capitalize' }}>{disease.replace('_', ' ')}</h4>
          <span className={`badge ${riskColor}`}>{riskData.risk_level} Risk</span>
        </div>
        <div className={`prediction-probability ${riskColor}`} style={{ fontSize: 24, marginBottom: 4 }}>
          {riskData.probability.toFixed(1)}%
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Probability of disease</div>
        
        {riskData.medications && riskData.medications.length > 0 && (
          <div style={{ backgroundColor: '#0f172a', padding: 10, borderRadius: 8, marginTop: 'auto' }}>
            <strong style={{ fontSize: 12, color: '#f8fafc', display: 'block', marginBottom: 6 }}>Suggested Medications:</strong>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: '#94a3b8' }}>
              {riskData.medications.map((med, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{med}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="card">
         <div className="card-header">
            <div>
              <div className="card-title">📸 Medical Report Scan</div>
              <div className="card-subtitle">Upload a blood test or medical report to predict all diseases.</div>
            </div>
         </div>
         
         <div 
           onDragOver={(e) => e.preventDefault()} 
           onDrop={handleDrop}
           style={{
             border: '2px dashed #334155', borderRadius: 12, padding: '40px 20px',
             textAlign: 'center', cursor: 'pointer', backgroundColor: '#0f172a',
             transition: 'all 0.2s ease', position: 'relative'
           }}
           onClick={() => fileInputRef.current?.click()}
         >
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileChange} 
             style={{ display: 'none' }} 
             accept="image/*,.pdf" 
           />
           
           {!file ? (
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
               <div style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <UploadCloud size={30} color="#38bdf8" />
               </div>
               <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>Click or drag file to upload</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Supported formats: JPG, PNG</p>
               </div>
             </div>
           ) : (
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
               <div style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <FileText size={30} color="#22c55e" />
               </div>
               <div>
                 <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc' }}>{file.name}</h3>
                 <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
               </div>
             </div>
           )}
         </div>

         <button 
           className="btn btn-primary btn-lg" 
           onClick={handleSubmit} 
           disabled={!file || loading}
           style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}
         >
           {loading ? (
             <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div> Analyzing Report with AI...</>
           ) : (
             <><Brain size={20} /> Run Unified Prediction</>
           )}
         </button>
         
         {error && (
            <div style={{ marginTop: 16, padding: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, fontSize: 14 }}>
              {error}
            </div>
         )}
      </div>

      {result && (
        <div className="card fade-in">
          <div className="card-header">
            <div>
              <div className="card-title">Analysis Results</div>
              <div className="card-subtitle">AI assessment across multiple models based on extracted data</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            {Object.entries(result.predictions).map(([key, data]) => renderRiskBadge(key, data))}
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: 20, borderRadius: 12, border: '1px solid #1e293b' }}>
            <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #1e293b', paddingBottom: 12 }}>Extracted Indicators (Simulated OCR)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
               {Object.entries(result.extracted_data).slice(0, 15).map(([key, value]) => (
                  <div key={key} style={{ backgroundColor: '#1e293b', padding: '8px 12px', borderRadius: 6, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>{key}</span>
                    <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: 13 }}>{value}</span>
                  </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
