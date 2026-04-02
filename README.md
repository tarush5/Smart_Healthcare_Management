# 🧠 Smart Healthcare Management System

> AI-Powered Healthcare Management with Machine Learning & Data Mining

An intelligent healthcare management system that analyzes patient data, predicts diseases, discovers hidden patterns through data mining, and assists doctors in clinical decision-making.

## 🏗️ Architecture

| Component | Technology | Port |
|-----------|-----------|------|
| Frontend | React + Vite | 5173 |
| API Gateway | Node.js + Express | 3001 |
| ML Backend | Python + FastAPI | 8000 |
| Database | SQLite | — |

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm

### 1. Setup ML Backend
```bash
cd ml-backend
pip install -r requirements.txt
python generate_datasets.py
python train_models.py
uvicorn main:app --reload --port 8000
```

### 2. Setup Node.js Backend
```bash
cd backend
npm install
node server.js
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔬 AI/ML Features

- **Disease Prediction**: Heart Disease, Diabetes, Kidney Disease using Random Forest, SVM, Logistic Regression, Decision Tree
- **Data Mining**: Association Rule Mining (Apriori), K-Means Clustering, Pattern Discovery
- **Risk Assessment**: Patient risk scoring with probability percentages
- **AI Chatbot**: Symptom-based health advice assistant

## 📊 Tech Stack

- **Frontend**: React, Vite, Recharts, Modern CSS
- **Backend**: Node.js, Express, SQLite
- **ML Backend**: Python, FastAPI, Scikit-learn, Pandas, NumPy, mlxtend
- **ML Models**: Random Forest, SVM, Logistic Regression, Decision Tree, K-Means, Apriori
