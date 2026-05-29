import React, { useState, useEffect, useRef } from 'react'
import { BarChart3, RefreshCw, Download, ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { ML_URL as ML_API } from '../config'

const CATEGORY_INFO = {
  eda: { title: '📊 Exploratory Data Analysis', description: 'Dataset distributions, correlations, box plots, and feature analysis' },
  model_evaluation: { title: '🤖 Model Evaluation', description: 'Accuracy comparisons, confusion matrices, ROC curves, and feature importance' },
  data_mining: { title: '⛏️ Data Mining', description: 'K-Means clustering, elbow curve, and pattern discovery' },
  dashboard: { title: '📈 Summary Dashboard', description: 'Violin plots, KDE density, and comprehensive analytics dashboard' },
}

export default function Visualizations() {
  const [graphData, setGraphData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState(null)
  const [lightboxImg, setLightboxImg] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')

  const fetchGraphs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${ML_API}/api/graphs/list`)
      if (!res.ok) throw new Error('Failed to fetch graphs')
      const data = await res.json()
      setGraphData(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGraphs() }, [])

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const res = await fetch(`${ML_API}/api/graphs/regenerate`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to regenerate')
      await fetchGraphs()
    } catch (e) {
      setError(e.message)
    } finally {
      setRegenerating(false)
    }
  }

  const allGraphs = graphData?.all_graphs || []

  const filteredGraphs = activeCategory === 'all'
    ? allGraphs
    : (graphData?.categories?.[activeCategory] || [])

  // Lightbox navigation
  const currentIndex = lightboxImg ? filteredGraphs.findIndex(g => g.url === lightboxImg) : -1
  const goNext = () => {
    if (currentIndex < filteredGraphs.length - 1) setLightboxImg(filteredGraphs[currentIndex + 1].url)
  }
  const goPrev = () => {
    if (currentIndex > 0) setLightboxImg(filteredGraphs[currentIndex - 1].url)
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handler = (e) => {
      if (!lightboxImg) return
      if (e.key === 'Escape') setLightboxImg(null)
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxImg, currentIndex])

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <BarChart3 style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
            ML Visualizations
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Seaborn & Matplotlib graphs — EDA, Model Evaluation, Data Mining
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={fetchGraphs} disabled={loading}>
            <RefreshCw size={16} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleRegenerate} disabled={regenerating}>
            {regenerating
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Regenerating...</>
              : <><BarChart3 size={16} /> Regenerate All</>}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {graphData && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-value">{graphData.total}</div>
            <div className="stat-label">Total Graphs</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{graphData.categories?.eda?.length || 0}</div>
            <div className="stat-label">EDA Plots</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{graphData.categories?.model_evaluation?.length || 0}</div>
            <div className="stat-label">Model Eval</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{graphData.categories?.data_mining?.length || 0}</div>
            <div className="stat-label">Mining Plots</div>
          </div>
        </div>
      )}

      {/* Category filter tabs */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap'
      }}>
        {[
          { key: 'all', label: '🌐 All Graphs' },
          { key: 'eda', label: '📊 EDA' },
          { key: 'model_evaluation', label: '🤖 Model Evaluation' },
          { key: 'data_mining', label: '⛏️ Data Mining' },
          { key: 'dashboard', label: '📈 Dashboard' },
        ].map(tab => (
          <button key={tab.key}
            className={`btn ${activeCategory === tab.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveCategory(tab.key)}
            style={{ fontSize: 13, padding: '8px 16px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--danger)', marginBottom: 24 }}>
          <p style={{ color: 'var(--danger)', margin: 0 }}>⚠️ {error}</p>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 13 }}>
            Make sure the ML backend is running and graphs have been generated.
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>Loading visualizations...</p>
        </div>
      )}

      {/* No graphs yet */}
      {!loading && !error && filteredGraphs.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <BarChart3 size={64} style={{ color: 'var(--text-secondary)', marginBottom: 16 }} />
          <h3>No graphs generated yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Click "Regenerate All" to generate all visualizations, or restart the project using run_all.bat.
          </p>
          <button className="btn btn-primary" onClick={handleRegenerate} disabled={regenerating}>
            <BarChart3 size={16} /> Generate Graphs Now
          </button>
        </div>
      )}

      {/* Category section headers + Graph grid */}
      {!loading && activeCategory === 'all' && graphData && (
        Object.entries(CATEGORY_INFO).map(([key, info]) => {
          const graphs = graphData.categories?.[key] || []
          if (graphs.length === 0) return null
          return (
            <div key={key} style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 20, marginBottom: 4, color: 'var(--text-primary)' }}>{info.title}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>{info.description}</p>
              <div className="graph-grid">
                {graphs.map(g => (
                  <GraphCard key={g.filename} graph={g} onClick={() => setLightboxImg(g.url)} />
                ))}
              </div>
            </div>
          )
        })
      )}

      {/* Filtered view (non-"all") */}
      {!loading && activeCategory !== 'all' && (
        <div className="graph-grid">
          {filteredGraphs.map(g => (
            <GraphCard key={g.filename} graph={g} onClick={() => setLightboxImg(g.url)} />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div className="lightbox-overlay" onClick={() => setLightboxImg(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxImg(null)}><X size={24} /></button>
            {currentIndex > 0 && (
              <button className="lightbox-nav lightbox-prev" onClick={goPrev}><ChevronLeft size={32} /></button>
            )}
            {currentIndex < filteredGraphs.length - 1 && (
              <button className="lightbox-nav lightbox-next" onClick={goNext}><ChevronRight size={32} /></button>
            )}
            <img src={lightboxImg} alt="Graph" className="lightbox-img" />
            <div className="lightbox-caption">
              {filteredGraphs[currentIndex]?.name || ''}
              <span style={{ marginLeft: 16, opacity: 0.6 }}>
                {currentIndex + 1} / {filteredGraphs.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Inline styles for this page */}
      <style>{`
        .graph-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
          gap: 20px;
        }
        .graph-card {
          background: var(--card-bg, #1e293b);
          border: 1px solid var(--border, #334155);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .graph-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(99, 102, 241, 0.2);
          border-color: var(--primary, #6366f1);
        }
        .graph-card img {
          width: 100%;
          height: 260px;
          object-fit: cover;
          object-position: top center;
          display: block;
          background: #0f172a;
        }
        .graph-card-footer {
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border, #334155);
        }
        .graph-card-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary, #94a3b8);
          text-transform: capitalize;
        }
        .graph-card-actions {
          display: flex;
          gap: 8px;
        }
        .graph-card-actions button {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: var(--text-secondary, #94a3b8);
          border-radius: 6px;
          transition: all 0.2s;
        }
        .graph-card-actions button:hover {
          color: var(--primary, #6366f1);
          background: rgba(99, 102, 241, 0.1);
        }

        /* Lightbox */
        .lightbox-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.92);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        .lightbox-content {
          position: relative;
          max-width: 92vw;
          max-height: 92vh;
        }
        .lightbox-img {
          max-width: 92vw;
          max-height: 85vh;
          border-radius: 8px;
          box-shadow: 0 0 60px rgba(0,0,0,0.5);
        }
        .lightbox-close {
          position: absolute;
          top: -40px; right: 0;
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .lightbox-close:hover { background: rgba(255,255,255,0.2); }
        .lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          padding: 12px;
          border-radius: 50%;
          cursor: pointer;
          transition: background 0.2s;
          z-index: 10;
        }
        .lightbox-nav:hover { background: rgba(99, 102, 241, 0.5); }
        .lightbox-prev { left: -60px; }
        .lightbox-next { right: -60px; }
        .lightbox-caption {
          text-align: center;
          color: #94a3b8;
          margin-top: 12px;
          font-size: 14px;
          text-transform: capitalize;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function GraphCard({ graph, onClick }) {
  const handleDownload = (e) => {
    e.stopPropagation()
    const a = document.createElement('a')
    a.href = graph.url
    a.download = graph.filename
    a.click()
  }

  return (
    <div className="graph-card" onClick={onClick}>
      <img src={graph.url} alt={graph.name} loading="lazy" />
      <div className="graph-card-footer">
        <span className="graph-card-title">{graph.name}</span>
        <div className="graph-card-actions">
          <button onClick={handleDownload} title="Download">
            <Download size={16} />
          </button>
          <button title="View full size">
            <ZoomIn size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
