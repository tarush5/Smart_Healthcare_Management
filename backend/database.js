/**
 * SQLite Database Setup — Patients, Medical Records, Predictions.
 * Seeds with realistic sample data.
 */

const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'healthcare.db');

function initDatabase() {
  const db = new Database(DB_PATH);
  
  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      blood_group TEXT,
      address TEXT,
      emergency_contact TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medical_records (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      diagnosis TEXT,
      symptoms TEXT,
      bp_systolic INTEGER,
      bp_diastolic INTEGER,
      glucose REAL,
      cholesterol REAL,
      bmi REAL,
      heart_rate INTEGER,
      temperature REAL,
      notes TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      patient_id TEXT,
      disease_type TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      probability REAL NOT NULL,
      model_used TEXT,
      input_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
    );
  `);

  // Seed data if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM patients').get();
  if (count.count === 0) {
    seedData(db);
  }

  return db;
}

function seedData(db) {
  console.log('🌱 Seeding database with sample data...');

  const patients = [
    { name: 'Rajesh Kumar', age: 55, gender: 'Male', phone: '9876543210', email: 'rajesh@email.com', blood_group: 'A+', address: 'Mumbai, Maharashtra' },
    { name: 'Priya Sharma', age: 34, gender: 'Female', phone: '9876543211', email: 'priya@email.com', blood_group: 'B+', address: 'Delhi, NCR' },
    { name: 'Amit Patel', age: 62, gender: 'Male', phone: '9876543212', email: 'amit@email.com', blood_group: 'O+', address: 'Ahmedabad, Gujarat' },
    { name: 'Sneha Reddy', age: 28, gender: 'Female', phone: '9876543213', email: 'sneha@email.com', blood_group: 'AB+', address: 'Hyderabad, Telangana' },
    { name: 'Mohammed Ali', age: 47, gender: 'Male', phone: '9876543214', email: 'ali@email.com', blood_group: 'B-', address: 'Chennai, Tamil Nadu' },
    { name: 'Anita Desai', age: 71, gender: 'Female', phone: '9876543215', email: 'anita@email.com', blood_group: 'A-', address: 'Pune, Maharashtra' },
    { name: 'Vikram Singh', age: 39, gender: 'Male', phone: '9876543216', email: 'vikram@email.com', blood_group: 'O-', address: 'Jaipur, Rajasthan' },
    { name: 'Kavita Nair', age: 52, gender: 'Female', phone: '9876543217', email: 'kavita@email.com', blood_group: 'A+', address: 'Kochi, Kerala' },
    { name: 'Suresh Gupta', age: 66, gender: 'Male', phone: '9876543218', email: 'suresh@email.com', blood_group: 'B+', address: 'Kolkata, West Bengal' },
    { name: 'Deepa Joshi', age: 41, gender: 'Female', phone: '9876543219', email: 'deepa@email.com', blood_group: 'O+', address: 'Bangalore, Karnataka' },
    { name: 'Rahul Verma', age: 58, gender: 'Male', phone: '9876543220', email: 'rahul@email.com', blood_group: 'AB-', address: 'Lucknow, Uttar Pradesh' },
    { name: 'Meera Iyer', age: 33, gender: 'Female', phone: '9876543221', email: 'meera@email.com', blood_group: 'A+', address: 'Chennai, Tamil Nadu' },
    { name: 'Arjun Menon', age: 45, gender: 'Male', phone: '9876543222', email: 'arjun@email.com', blood_group: 'B+', address: 'Trivandrum, Kerala' },
    { name: 'Sunita Rao', age: 60, gender: 'Female', phone: '9876543223', email: 'sunita@email.com', blood_group: 'O+', address: 'Mysuru, Karnataka' },
    { name: 'Kiran Das', age: 37, gender: 'Male', phone: '9876543224', email: 'kiran@email.com', blood_group: 'A-', address: 'Guwahati, Assam' },
    { name: 'Lakshmi Pillai', age: 49, gender: 'Female', phone: '9876543225', email: 'lakshmi@email.com', blood_group: 'B-', address: 'Kochi, Kerala' },
    { name: 'Nikhil Chopra', age: 43, gender: 'Male', phone: '9876543226', email: 'nikhil@email.com', blood_group: 'AB+', address: 'Chandigarh' },
    { name: 'Ritu Agarwal', age: 56, gender: 'Female', phone: '9876543227', email: 'ritu@email.com', blood_group: 'O-', address: 'Indore, MP' },
    { name: 'Sanjay Mishra', age: 68, gender: 'Male', phone: '9876543228', email: 'sanjay@email.com', blood_group: 'A+', address: 'Varanasi, UP' },
    { name: 'Pooja Kapoor', age: 31, gender: 'Female', phone: '9876543229', email: 'pooja@email.com', blood_group: 'B+', address: 'New Delhi' },
    { name: 'Arun Tiwari', age: 73, gender: 'Male', phone: '9876543230', email: 'arun@email.com', blood_group: 'O+', address: 'Bhopal, MP' },
    { name: 'Divya Saxena', age: 29, gender: 'Female', phone: '9876543231', email: 'divya@email.com', blood_group: 'A+', address: 'Noida, UP' },
    { name: 'Manoj Kulkarni', age: 51, gender: 'Male', phone: '9876543232', email: 'manoj@email.com', blood_group: 'AB+', address: 'Nashik, Maharashtra' },
    { name: 'Nandini Hegde', age: 44, gender: 'Female', phone: '9876543233', email: 'nandini@email.com', blood_group: 'B-', address: 'Mangalore, Karnataka' },
    { name: 'Prakash Shetty', age: 59, gender: 'Male', phone: '9876543234', email: 'prakash@email.com', blood_group: 'O+', address: 'Udupi, Karnataka' },
    { name: 'Asha Bhatt', age: 36, gender: 'Female', phone: '9876543235', email: 'asha@email.com', blood_group: 'A-', address: 'Surat, Gujarat' },
    { name: 'Venkat Rao', age: 64, gender: 'Male', phone: '9876543236', email: 'venkat@email.com', blood_group: 'B+', address: 'Vizag, AP' },
    { name: 'Rekha Pandey', age: 48, gender: 'Female', phone: '9876543237', email: 'rekha@email.com', blood_group: 'O-', address: 'Ranchi, Jharkhand' },
    { name: 'Gaurav Malik', age: 40, gender: 'Male', phone: '9876543238', email: 'gaurav@email.com', blood_group: 'AB-', address: 'Dehradun, Uttarakhand' },
    { name: 'Swati Deshpande', age: 53, gender: 'Female', phone: '9876543239', email: 'swati@email.com', blood_group: 'A+', address: 'Nagpur, Maharashtra' },
  ];

  const insertPatient = db.prepare(`
    INSERT INTO patients (id, name, age, gender, phone, email, blood_group, address) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRecord = db.prepare(`
    INSERT INTO medical_records (id, patient_id, diagnosis, symptoms, bp_systolic, bp_diastolic, glucose, cholesterol, bmi, heart_rate, temperature, notes, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPrediction = db.prepare(`
    INSERT INTO predictions (id, patient_id, disease_type, risk_level, probability, model_used)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const diagnoses = ['Hypertension', 'Type 2 Diabetes', 'Coronary Artery Disease', 'Chronic Kidney Disease', 'Healthy', 'Pre-diabetic', 'High Cholesterol', 'Anemia'];
  const symptomsList = [
    'chest pain, shortness of breath',
    'frequent urination, fatigue',
    'headache, dizziness',
    'swelling in legs, fatigue',
    'no complaints',
    'mild fatigue, weight gain',
    'joint pain, stiffness',
    'persistent cough, fever'
  ];
  const riskLevels = ['Low', 'Medium', 'High'];
  const diseaseTypes = ['Heart Disease', 'Diabetes', 'Kidney Disease'];
  const modelNames = ['Random Forest', 'Logistic Regression', 'SVM', 'Decision Tree'];

  const transaction = db.transaction(() => {
    patients.forEach((p, index) => {
      const patientId = uuidv4();
      insertPatient.run(patientId, p.name, p.age, p.gender, p.phone, p.email, p.blood_group, p.address);

      // Add 1-3 medical records per patient
      const numRecords = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numRecords; i++) {
        const daysAgo = Math.floor(Math.random() * 365);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        insertRecord.run(
          uuidv4(),
          patientId,
          diagnoses[Math.floor(Math.random() * diagnoses.length)],
          symptomsList[Math.floor(Math.random() * symptomsList.length)],
          110 + Math.floor(Math.random() * 50),  // systolic
          60 + Math.floor(Math.random() * 30),   // diastolic
          70 + Math.floor(Math.random() * 130),   // glucose
          150 + Math.floor(Math.random() * 120),  // cholesterol
          18 + Math.round(Math.random() * 20 * 10) / 10, // bmi
          60 + Math.floor(Math.random() * 40),    // heart rate
          97 + Math.round(Math.random() * 4 * 10) / 10,  // temperature
          'Regular checkup',
          date.toISOString()
        );
      }

      // Add 0-2 predictions per patient
      if (index % 2 === 0) {
        const diseaseType = diseaseTypes[Math.floor(Math.random() * diseaseTypes.length)];
        const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
        const probability = riskLevel === 'High' ? 70 + Math.random() * 25 :
                           (riskLevel === 'Medium' ? 40 + Math.random() * 30 : 5 + Math.random() * 35);
        
        insertPrediction.run(
          uuidv4(),
          patientId,
          diseaseType,
          riskLevel,
          Math.round(probability * 100) / 100,
          modelNames[Math.floor(Math.random() * modelNames.length)]
        );
      }
    });
  });

  transaction();
  console.log(`✅ Seeded ${patients.length} patients with medical records and predictions`);
}

module.exports = { initDatabase, DB_PATH };
