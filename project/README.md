# 🧠 Smart Healthcare Management System

An AI-powered healthcare analytics platform combining ML disease prediction, data mining, risk assessment, and patient management.

## 🏗️ Architecture

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  React Frontend  │───▶│ Node.js Backend  │    │  FastAPI ML API  │
│   (Port 5173)    │    │   (Port 3001)    │    │   (Port 8000)    │
│                  │───▶│                  │    │                  │
│  Dashboard       │    │  Patient CRUD    │    │  Disease Pred.   │
│  Predictions     │    │  Medical Records │    │  Data Mining     │
│  Data Mining     │    │  Prediction DB   │    │  Risk Assessment │
│  Risk Analytics  │    │  Analytics       │    │  AI Chatbot      │
│  Visualizations  │    │  SQLite DB       │    │  OCR Scanner     │
│  AI Chatbot      │    │                  │    │  Visualizations  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+ with pip
- Node.js 18+ with npm

### One-Command Start
```bash
cd project
run_all.bat
```

> The ML backend takes 2-3 minutes to start (training models). The sidebar shows live health indicators.

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Recharts, Lucide Icons |
| API Backend | Node.js, Express, better-sqlite3 |
| ML Backend | Python, FastAPI, scikit-learn, pandas |
| Database | SQLite (WAL mode) |
| ML Models | Logistic Regression, Random Forest, Decision Tree, SVM |
| Data Mining | Apriori (mlxtend), K-Means (sklearn) |

## 🔬 Features

- **Disease Prediction** — Heart (13 features), Diabetes (8), Kidney (20)
- **Data Mining** — Association Rules, K-Means Clustering, Pattern Discovery
- **Risk Analytics** — Individual + population risk with recommendations
- **AI Chatbot** — Symptom checker with urgency triage
- **Medical Report Scanner** — OCR-based multi-disease analysis
- **20+ ML Visualizations** — EDA, model evaluation, mining, dashboards

## 🔧 Configuration

Frontend `.env`: `VITE_API_URL`, `VITE_ML_URL`
Backend `.env`: `PORT`, `CORS_ORIGIN`
