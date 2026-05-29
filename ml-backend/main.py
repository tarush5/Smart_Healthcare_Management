"""
FastAPI ML Backend — Disease Prediction, Data Mining, Risk Assessment, Chatbot.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List

from data_mining import get_association_rules, get_patient_clusters, get_patterns
from ocr_parser import extract_medical_data_from_image
from chatbot import process_message
from medication_advisor import recommend_medications

# Container-safe path resolution
def get_path(folder_name):
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    if base_dir == '/' or base_dir == '':
        return os.path.join(os.path.dirname(__file__), folder_name)
    return os.path.join(base_dir, folder_name)

MODEL_DIR = get_path('models')
DATASET_DIR = get_path('datasets')
GRAPH_DIR = get_path('graphs')
os.makedirs(GRAPH_DIR, exist_ok=True)

models = {}
training_results = {}
CORS_ORIGIN = os.environ.get("CORS_ORIGIN", "*")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global models, training_results
    model_files = {
        'heart_disease': 'heart_disease_model.joblib',
        'diabetes': 'diabetes_model.joblib',
        'kidney_disease': 'kidney_disease_model.joblib'
    }
    for name, filename in model_files.items():
        path = os.path.join(MODEL_DIR, filename)
        try:
            if os.path.exists(path):
                models[name] = joblib.load(path)
                print(f"✅ Loaded model: {name}")
            else:
                print(f"⚠️  Model not found: {path}")
        except Exception as e:
            print(f"❌ Error loading {name}: {e}")

    results_path = os.path.join(MODEL_DIR, 'training_results.json')
    try:
        if os.path.exists(results_path):
            with open(results_path, 'r') as f:
                training_results = json.load(f)
            print("✅ Loaded training results")
    except Exception as e:
        print(f"❌ Error loading training results: {e}")

    print(f"\n🚀 ML Backend ready — {len(models)}/3 models loaded\n")
    yield


app = FastAPI(
    title="Smart Healthcare ML API",
    description="AI-powered disease prediction, data mining, and health analytics",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN] if CORS_ORIGIN != "*" else ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.exists(GRAPH_DIR):
    app.mount("/static/graphs", StaticFiles(directory=GRAPH_DIR), name="graphs")


# ==================== Pydantic Models ====================

class HeartInput(BaseModel):
    age: float; sex: int; cp: int; trestbps: float; chol: float
    fbs: int; restecg: int; thalach: float; exang: int; oldpeak: float
    slope: int; ca: int; thal: int

class DiabetesInput(BaseModel):
    Pregnancies: int; Glucose: float; BloodPressure: float
    SkinThickness: float; Insulin: float; BMI: float
    DiabetesPedigreeFunction: float; Age: int

class KidneyInput(BaseModel):
    age: float; bp: float; sg: float; al: float; su: float
    bgr: float; bu: float; sc: float; sod: float; pot: float
    hemo: float; pcv: float; wc: float; rc: float
    htn: int; dm: int; cad: int; appet: int; pe: int; ane: int

class RiskInput(BaseModel):
    age: int; gender: str; bmi: float; blood_pressure: float
    cholesterol: float; glucose: float
    smoking: bool = False; family_history: bool = False; exercise: bool = True

class ChatMessage(BaseModel):
    message: str


# ==================== Prediction Endpoints ====================

def _make_prediction(disease_key, model_key, features, data_dict):
    if model_key not in models:
        raise HTTPException(status_code=503, detail=f"{disease_key} model not loaded. Run train_models.py first.")
    model = models[model_key]
    prediction = int(model.predict(features)[0])
    probability = float(model.predict_proba(features)[0][1]) * 100
    risk_level = 'High' if probability > 70 else ('Medium' if probability > 40 else 'Low')
    disease_names = {'heart_disease': 'Heart Disease', 'diabetes': 'Diabetes', 'kidney_disease': 'Kidney Disease'}
    return {
        'prediction': prediction, 'probability': round(probability, 2), 'risk_level': risk_level,
        'disease': disease_names.get(model_key, model_key),
        'model_used': training_results.get(model_key, {}).get('best_model', 'Unknown'),
        'interpretation': f"{'Positive' if prediction == 1 else 'Negative'} for {disease_names.get(model_key, model_key).lower()} with {probability:.1f}% probability.",
        'medications': recommend_medications(model_key, data_dict, prediction == 1)
    }

@app.post("/predict/heart")
def predict_heart_disease(data: HeartInput):
    features = np.array([[data.age, data.sex, data.cp, data.trestbps, data.chol,
                           data.fbs, data.restecg, data.thalach, data.exang,
                           data.oldpeak, data.slope, data.ca, data.thal]])
    return _make_prediction('heart_disease', 'heart_disease', features, data.dict())

@app.post("/predict/diabetes")
def predict_diabetes(data: DiabetesInput):
    features = np.array([[data.Pregnancies, data.Glucose, data.BloodPressure,
                           data.SkinThickness, data.Insulin, data.BMI,
                           data.DiabetesPedigreeFunction, data.Age]])
    return _make_prediction('diabetes', 'diabetes', features, data.dict())

@app.post("/predict/kidney")
def predict_kidney_disease(data: KidneyInput):
    features = np.array([[data.age, data.bp, data.sg, data.al, data.su,
                           data.bgr, data.bu, data.sc, data.sod, data.pot,
                           data.hemo, data.pcv, data.wc, data.rc,
                           data.htn, data.dm, data.cad, data.appet,
                           data.pe, data.ane]])
    return _make_prediction('kidney_disease', 'kidney_disease', features, data.dict())


@app.post("/predict/image-unified")
async def predict_image_unified(file: UploadFile = File(...)):
    if not all(k in models for k in ['heart_disease', 'diabetes', 'kidney_disease']):
        raise HTTPException(status_code=503, detail="Not all ML models are loaded for unified prediction")
    image_bytes = await file.read()
    d = extract_medical_data_from_image(image_bytes)
    
    heart_f = np.array([[d['age'],d['sex'],d['cp'],d['trestbps'],d['chol'],d['fbs'],d['restecg'],d['thalach'],d['exang'],d['oldpeak'],d['slope'],d['ca'],d['thal']]])
    diab_f = np.array([[d['Pregnancies'],d['Glucose'],d['BloodPressure'],d['SkinThickness'],d['Insulin'],d['BMI'],d['DiabetesPedigreeFunction'],d['Age']]])
    kid_f = np.array([[d['age'],d['bp'],d['sg'],d['al'],d['su'],d['bgr'],d['bu'],d['sc'],d['sod'],d['pot'],d['hemo'],d['pcv'],d['wc'],d['rc'],d['htn'],d['dm'],d['cad'],d['appet'],d['pe'],d['ane']]])

    def _prob_pred(key, feats):
        prob = float(models[key].predict_proba(feats)[0][1]) * 100
        pred = int(models[key].predict(feats)[0])
        return {'probability': round(prob,2), 'risk_level': 'High' if prob>70 else ('Medium' if prob>40 else 'Low'),
                'prediction': pred, 'medications': recommend_medications(key, d, pred==1)}

    return {'extracted_data': d, 'predictions': {
        'heart_disease': _prob_pred('heart_disease', heart_f),
        'diabetes': _prob_pred('diabetes', diab_f),
        'kidney_disease': _prob_pred('kidney_disease', kid_f)
    }}


# ==================== Data Mining Endpoints ====================

@app.get("/mining/association-rules")
def association_rules_endpoint():
    try:
        rules = get_association_rules()
        return {'rules': rules, 'total': len(rules)}
    except Exception as e:
        return {'rules': [], 'total': 0, 'warning': str(e)}

@app.get("/mining/clusters")
def clusters_endpoint():
    try:
        return get_patient_clusters()
    except Exception as e:
        return {'clusters': [], 'scatter_data': [], 'warning': str(e)}

@app.get("/mining/patterns")
def patterns_endpoint():
    try:
        return get_patterns()
    except Exception as e:
        return {'heart_disease_patterns': [], 'diabetes_patterns': [], 'symptom_cooccurrence': [], 'warning': str(e)}


# ==================== Risk Assessment ====================

@app.post("/risk/assess")
def assess_risk(data: RiskInput):
    risk_score = 0
    risk_factors = []
    if data.age > 60: risk_score += 20; risk_factors.append({'factor': 'Age > 60', 'impact': 20})
    elif data.age > 45: risk_score += 10; risk_factors.append({'factor': 'Age > 45', 'impact': 10})
    if data.bmi > 35: risk_score += 20; risk_factors.append({'factor': 'Obesity (BMI > 35)', 'impact': 20})
    elif data.bmi > 30: risk_score += 15; risk_factors.append({'factor': 'Overweight (BMI > 30)', 'impact': 15})
    elif data.bmi > 25: risk_score += 5; risk_factors.append({'factor': 'Slightly overweight', 'impact': 5})
    if data.blood_pressure > 140: risk_score += 20; risk_factors.append({'factor': 'High blood pressure (>140)', 'impact': 20})
    elif data.blood_pressure > 120: risk_score += 10; risk_factors.append({'factor': 'Elevated blood pressure', 'impact': 10})
    if data.cholesterol > 240: risk_score += 15; risk_factors.append({'factor': 'High cholesterol (>240)', 'impact': 15})
    elif data.cholesterol > 200: risk_score += 8; risk_factors.append({'factor': 'Borderline cholesterol', 'impact': 8})
    if data.glucose > 126: risk_score += 15; risk_factors.append({'factor': 'High blood sugar (>126)', 'impact': 15})
    elif data.glucose > 100: risk_score += 8; risk_factors.append({'factor': 'Pre-diabetic glucose', 'impact': 8})
    if data.smoking: risk_score += 15; risk_factors.append({'factor': 'Smoking', 'impact': 15})
    if data.family_history: risk_score += 10; risk_factors.append({'factor': 'Family history', 'impact': 10})
    if not data.exercise: risk_score += 10; risk_factors.append({'factor': 'Sedentary lifestyle', 'impact': 10})

    risk_score = min(100, risk_score)
    risk_level = 'Critical' if risk_score > 75 else ('High' if risk_score > 50 else ('Medium' if risk_score > 25 else 'Low'))

    recommendations = []
    if data.bmi > 25: recommendations.append('Consider weight management through diet and exercise.')
    if data.blood_pressure > 120: recommendations.append('Monitor blood pressure regularly. Reduce sodium intake.')
    if data.cholesterol > 200: recommendations.append('Adopt a heart-healthy diet low in saturated fats.')
    if data.glucose > 100: recommendations.append('Monitor blood sugar levels. Limit sugar intake.')
    if data.smoking: recommendations.append('Quit smoking — it significantly reduces disease risk.')
    if not data.exercise: recommendations.append('Aim for at least 150 minutes of moderate exercise per week.')
    if not recommendations: recommendations.append('Maintain your healthy lifestyle! Regular check-ups are still recommended.')

    return {
        'risk_score': risk_score, 'risk_level': risk_level,
        'risk_factors': risk_factors, 'recommendations': recommendations,
        'disease_risks': {
            'heart_disease': min(100, risk_score + np.random.randint(-5, 10)),
            'diabetes': min(100, risk_score + np.random.randint(-10, 5)),
            'kidney_disease': min(100, max(0, risk_score - 10 + np.random.randint(-5, 5)))
        }
    }


# ==================== Model Info ====================

@app.get("/models/comparison")
def model_comparison():
    if not training_results:
        return {}
    return training_results

@app.get("/models/feature-importance/{disease}")
def feature_importance(disease: str):
    if disease not in training_results:
        raise HTTPException(status_code=404, detail=f"Disease '{disease}' not found")
    result = training_results[disease]
    features = result.get('features', [])
    importance = result.get('feature_importance', [])
    if not importance:
        raise HTTPException(status_code=404, detail="Feature importance not available")
    feature_data = [{'feature': f, 'importance': round(float(i), 4)} for f, i in zip(features, importance)]
    feature_data.sort(key=lambda x: x['importance'], reverse=True)
    return {'disease': disease, 'features': feature_data}


# ==================== Chatbot ====================

@app.post("/chatbot/message")
def chatbot_endpoint(data: ChatMessage):
    return process_message(data.message)


# ==================== Health Check ====================

@app.get("/health")
def health_check():
    return {
        'status': 'healthy', 'models_loaded': list(models.keys()),
        'models_count': len(models), 'training_results_available': bool(training_results),
        'graphs_available': len([f for f in os.listdir(GRAPH_DIR) if f.endswith('.png')]) if os.path.exists(GRAPH_DIR) else 0
    }


# ==================== Graphs API ====================

@app.get("/api/graphs/list")
def list_graphs():
    if not os.path.exists(GRAPH_DIR):
        return {'total': 0, 'categories': {}, 'all_graphs': []}
    graph_files = sorted([f for f in os.listdir(GRAPH_DIR) if f.endswith('.png')])
    categories = {'eda': [], 'model_evaluation': [], 'data_mining': [], 'dashboard': []}
    for f in graph_files:
        name = f.replace('.png', '').replace('_', ' ')
        url = f"/static/graphs/{f}"
        entry = {'filename': f, 'name': name, 'url': url}
        num = f.split('_')[0]
        if num.isdigit():
            n = int(num)
            if n <= 8: categories['eda'].append(entry)
            elif n <= 13: categories['model_evaluation'].append(entry)
            elif n <= 17: categories['data_mining'].append(entry)
            else: categories['dashboard'].append(entry)
        else: categories['eda'].append(entry)
    return {
        'total': len(graph_files), 'categories': categories,
        'all_graphs': [{'filename': f, 'name': f.replace('.png','').replace('_',' '), 'url': f"/static/graphs/{f}"} for f in graph_files]
    }

@app.post("/api/graphs/regenerate")
def regenerate_graphs():
    try:
        from visualizations import generate_all_graphs
        graph_dir = generate_all_graphs()
        graph_files = sorted([f for f in os.listdir(graph_dir) if f.endswith('.png')])
        return {'status': 'success', 'total': len(graph_files), 'graphs': graph_files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
