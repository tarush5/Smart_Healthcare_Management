import React, { useState, useEffect } from 'react'
import { Search, Plus, X, User, Phone, Mail, Droplet, MapPin, FileText } from 'lucide-react'

const API_URL = 'http://localhost:3001/api'

export default function PatientManagement() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editPatient, setEditPatient] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [records, setRecords] = useState([])
  const [form, setForm] = useState({ name: '', age: '', gender: 'Male', phone: '', email: '', blood_group: '', address: '' })

  const fetchPatients = () => {
    fetch(`${API_URL}/patients?search=${search}`)
      .then(r => r.json())
      .then(d => { setPatients(d.patients || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchPatients() }, [search])

  const openAdd = () => {
    setEditPatient(null)
    setForm({ name: '', age: '', gender: 'Male', phone: '', email: '', blood_group: '', address: '' })
    setShowModal(true)
  }

  const openEdit = (p) => {
    setEditPatient(p)
    setForm({ name: p.name, age: p.age, gender: p.gender, phone: p.phone || '', email: p.email || '', blood_group: p.blood_group || '', address: p.address || '' })
    setShowModal(true)
  }

  const handleSave = async () => {
    const method = editPatient ? 'PUT' : 'POST'
    const url = editPatient ? `${API_URL}/patients/${editPatient.id}` : `${API_URL}/patients`
    await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, age: Number(form.age) })
    })
    setShowModal(false)
    fetchPatients()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this patient?')) return
    await fetch(`${API_URL}/patients/${id}`, { method: 'DELETE' })
    fetchPatients()
    if (selectedPatient?.id === id) setSelectedPatient(null)
  }

  const viewPatient = async (p) => {
    setSelectedPatient(p)
    const res = await fetch(`${API_URL}/patients/${p.id}/records`)
    const data = await res.json()
    setRecords(data.records || [])
  }

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading patients...</p></div>

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Patient Management</h1>
        <p>Manage patient records and medical history</p>
      </div>

      {/* Search + Add */}
      <div className="search-bar">
        <div className="search-input-wrapper" style={{ maxWidth: 400 }}>
          <Search className="search-icon" />
          <input type="text" placeholder="Search patients by name, email, phone..."
                 value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Patient</button>
      </div>

      <div className="charts-grid">
        {/* Patient Table */}
        <div className="card" style={{ minWidth: 0 }}>
          <div className="card-header">
            <div className="card-title">All Patients ({patients.length})</div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => viewPatient(p)}>
                    <td style={{ color: '#f1f5f9', fontWeight: 500 }}>{p.name}</td>
                    <td>{p.age}</td>
                    <td><span className={`badge ${p.gender === 'Male' ? 'info' : 'medium'}`}>{p.gender}</span></td>
                    <td>{p.blood_group || '—'}</td>
                    <td>{p.phone || '—'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Patient Detail */}
        <div className="card">
          {selectedPatient ? (
            <>
              <div className="card-header">
                <div className="card-title">
                  <User size={18} style={{ display: 'inline', marginRight: 8 }} />
                  {selectedPatient.name}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ fontSize: 13 }}><span style={{ color: '#64748b' }}>Age:</span> <span style={{ color: '#f1f5f9' }}>{selectedPatient.age}</span></div>
                <div style={{ fontSize: 13 }}><span style={{ color: '#64748b' }}>Gender:</span> <span style={{ color: '#f1f5f9' }}>{selectedPatient.gender}</span></div>
                <div style={{ fontSize: 13 }}><span style={{ color: '#64748b' }}>Blood:</span> <span style={{ color: '#f1f5f9' }}>{selectedPatient.blood_group || '—'}</span></div>
                <div style={{ fontSize: 13 }}><span style={{ color: '#64748b' }}>Phone:</span> <span style={{ color: '#f1f5f9' }}>{selectedPatient.phone || '—'}</span></div>
                <div style={{ fontSize: 13, gridColumn: '1/3' }}><span style={{ color: '#64748b' }}>Email:</span> <span style={{ color: '#f1f5f9' }}>{selectedPatient.email || '—'}</span></div>
                <div style={{ fontSize: 13, gridColumn: '1/3' }}><span style={{ color: '#64748b' }}>Address:</span> <span style={{ color: '#f1f5f9' }}>{selectedPatient.address || '—'}</span></div>
              </div>
              <div className="card-title" style={{ fontSize: 14, marginBottom: 12 }}>
                <FileText size={16} style={{ display: 'inline', marginRight: 6 }} />
                Medical Records ({records.length})
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {records.length ? records.map(r => (
                  <div key={r.id} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8, padding: 12, marginBottom: 8, fontSize: 13
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#818cf8', fontWeight: 600 }}>{r.diagnosis || 'Checkup'}</span>
                      <span style={{ color: '#64748b', fontSize: 11 }}>{new Date(r.date).toLocaleDateString()}</span>
                    </div>
                    <div style={{ color: '#94a3b8' }}>{r.symptoms || 'No symptoms noted'}</div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                      {r.bp_systolic && <span style={{ color: '#64748b', fontSize: 11 }}>BP: {r.bp_systolic}/{r.bp_diastolic}</span>}
                      {r.glucose && <span style={{ color: '#64748b', fontSize: 11 }}>Glucose: {r.glucose}</span>}
                      {r.cholesterol && <span style={{ color: '#64748b', fontSize: 11 }}>Chol: {r.cholesterol}</span>}
                      {r.bmi && <span style={{ color: '#64748b', fontSize: 11 }}>BMI: {r.bmi}</span>}
                    </div>
                  </div>
                )) : <p style={{ color: '#64748b', fontSize: 13 }}>No medical records found.</p>}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">👤</div>
              <h3>Select a Patient</h3>
              <p>Click on a patient row to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editPatient ? 'Edit Patient' : 'Add New Patient'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label className="form-label">Age *</label>
                  <input className="form-input" type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="35" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select className="form-select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-select" value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })}>
                    <option value="">Select...</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="City, State" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.name || !form.age}>
                {editPatient ? 'Update' : 'Add Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
