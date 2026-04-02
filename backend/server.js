/**
 * Express Server — Patient Management API.
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { initDatabase } = require('./database');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const db = initDatabase();

// ==================== Patient Endpoints ====================

// GET all patients
app.get('/api/patients', (req, res) => {
  try {
    const { search, sort, order } = req.query;
    let query = 'SELECT * FROM patients';
    const params = [];

    if (search) {
      query += ' WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const sortCol = ['name', 'age', 'gender', 'created_at'].includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortCol} ${sortOrder}`;

    const patients = db.prepare(query).all(...params);
    res.json({ patients, total: patients.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single patient
app.get('/api/patients/:id', (req, res) => {
  try {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create patient
app.post('/api/patients', (req, res) => {
  try {
    const { name, age, gender, phone, email, blood_group, address, emergency_contact } = req.body;
    if (!name || !age || !gender) {
      return res.status(400).json({ error: 'Name, age, and gender are required' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO patients (id, name, age, gender, phone, email, blood_group, address, emergency_contact)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, age, gender, phone || null, email || null, blood_group || null, address || null, emergency_contact || null);

    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);
    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update patient
app.put('/api/patients/:id', (req, res) => {
  try {
    const { name, age, gender, phone, email, blood_group, address, emergency_contact } = req.body;
    const existing = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Patient not found' });

    db.prepare(`
      UPDATE patients SET name=?, age=?, gender=?, phone=?, email=?, blood_group=?, address=?, emergency_contact=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      name || existing.name, age || existing.age, gender || existing.gender,
      phone || existing.phone, email || existing.email, blood_group || existing.blood_group,
      address || existing.address, emergency_contact || existing.emergency_contact,
      req.params.id
    );

    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE patient
app.delete('/api/patients/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Patient not found' });

    db.prepare('DELETE FROM patients WHERE id = ?').run(req.params.id);
    res.json({ message: 'Patient deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== Medical Records Endpoints ====================

// GET patient medical records
app.get('/api/patients/:id/records', (req, res) => {
  try {
    const records = db.prepare(
      'SELECT * FROM medical_records WHERE patient_id = ? ORDER BY date DESC'
    ).all(req.params.id);
    res.json({ records, total: records.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add medical record
app.post('/api/patients/:id/records', (req, res) => {
  try {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const { diagnosis, symptoms, bp_systolic, bp_diastolic, glucose, cholesterol, bmi, heart_rate, temperature, notes } = req.body;
    const id = uuidv4();

    db.prepare(`
      INSERT INTO medical_records (id, patient_id, diagnosis, symptoms, bp_systolic, bp_diastolic, glucose, cholesterol, bmi, heart_rate, temperature, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, diagnosis, symptoms, bp_systolic, bp_diastolic, glucose, cholesterol, bmi, heart_rate, temperature, notes);

    const record = db.prepare('SELECT * FROM medical_records WHERE id = ?').get(id);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== Predictions Endpoints ====================

// GET all predictions
app.get('/api/predictions', (req, res) => {
  try {
    const predictions = db.prepare(`
      SELECT p.*, pt.name as patient_name FROM predictions p
      LEFT JOIN patients pt ON p.patient_id = pt.id
      ORDER BY p.created_at DESC LIMIT 50
    `).all();
    res.json({ predictions, total: predictions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST save prediction
app.post('/api/predictions', (req, res) => {
  try {
    const { patient_id, disease_type, risk_level, probability, model_used, input_data } = req.body;
    const id = uuidv4();

    db.prepare(`
      INSERT INTO predictions (id, patient_id, disease_type, risk_level, probability, model_used, input_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, patient_id || null, disease_type, risk_level, probability, model_used, JSON.stringify(input_data));

    const prediction = db.prepare('SELECT * FROM predictions WHERE id = ?').get(id);
    res.status(201).json(prediction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== Dashboard Stats ====================

app.get('/api/stats', (req, res) => {
  try {
    const totalPatients = db.prepare('SELECT COUNT(*) as count FROM patients').get().count;
    const totalPredictions = db.prepare('SELECT COUNT(*) as count FROM predictions').get().count;
    const highRiskCount = db.prepare("SELECT COUNT(*) as count FROM predictions WHERE risk_level = 'High'").get().count;
    const avgAge = db.prepare('SELECT AVG(age) as avg FROM patients').get().avg;
    const genderDist = db.prepare('SELECT gender, COUNT(*) as count FROM patients GROUP BY gender').all();
    const bloodGroupDist = db.prepare('SELECT blood_group, COUNT(*) as count FROM patients GROUP BY blood_group ORDER BY count DESC').all();
    const diseaseDist = db.prepare('SELECT disease_type, COUNT(*) as count FROM predictions GROUP BY disease_type').all();
    const riskDist = db.prepare('SELECT risk_level, COUNT(*) as count FROM predictions GROUP BY risk_level').all();
    
    const recentPredictions = db.prepare(`
      SELECT p.*, pt.name as patient_name FROM predictions p
      LEFT JOIN patients pt ON p.patient_id = pt.id
      ORDER BY p.created_at DESC LIMIT 10
    `).all();

    const monthlyPatients = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count 
      FROM patients GROUP BY month ORDER BY month DESC LIMIT 6
    `).all();

    res.json({
      totalPatients,
      totalPredictions,
      highRiskCount,
      avgAge: Math.round(avgAge || 0),
      genderDistribution: genderDist,
      bloodGroupDistribution: bloodGroupDist,
      diseaseDistribution: diseaseDist,
      riskDistribution: riskDist,
      recentPredictions,
      monthlyPatients
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🏥 Healthcare API running on http://localhost:${PORT}`);
  console.log(`📊 Endpoints:`);
  console.log(`   GET    /api/patients`);
  console.log(`   POST   /api/patients`);
  console.log(`   GET    /api/patients/:id`);
  console.log(`   PUT    /api/patients/:id`);
  console.log(`   DELETE /api/patients/:id`);
  console.log(`   GET    /api/patients/:id/records`);
  console.log(`   POST   /api/patients/:id/records`);
  console.log(`   GET    /api/predictions`);
  console.log(`   POST   /api/predictions`);
  console.log(`   GET    /api/stats\n`);
});
