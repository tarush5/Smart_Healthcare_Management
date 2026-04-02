"""
FastAPI ML Backend — Disease Prediction, Data Mining, Risk Assessment, Chatbot.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

from data_mining import get_association_rules, get_patient_clusters, get_patterns
from ocr_parser import extract_medical_data_from_image
from chatbot import process_message
from medication_advisor import recommend_medications

app = FastAPI(
    title="Smart Healthcare ML API",
    description="AI-powered disease prediction, data mining, and health analytics",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
DATASET_DIR = os.path.join(os.path.dirname(__file__), '..', 'datasets')

# Load models at startup
models = {}
training_results = {}


@app.on_event("startup")
def load_models():
    global models, training_results
    model_files = {
        'heart_disease': 'heart_disease_model.joblib',
        'diabetes': 'diabetes_model.joblib',
        'kidney_disease': 'kidney_disease_model.joblib'
    }
    for name, filename in model_files.items():
        path = os.path.join(MODEL_DIR, filename)
        if os.path.exists(path):
            models[name] = joblib.load(path)
            print(f"✅ Loaded model: {name}")
        else:
            print(f"⚠️ Model not found: {path}")

    results_path = os.path.join(MODEL_DIR, 'training_results.json')
    if os.path.exists(results_path):
        with open(results_path, 'r') as f:
            training_results = json.load(f)
        print("✅ Loaded training results")


# ==================== Pydantic Models ====================

class HeartInput(BaseModel):
    age: float
    sex: int
    cp: int
    trestbps: float
    chol: float
    fbs: int
    restecg: int
    thalach: float
    exang: int
    oldpeak: float
    slope: int
    ca: int
    thal: int

class DiabetesInput(BaseModel):
    Pregnancies: int
    Glucose: float
    BloodPressure: float
    SkinThickness: float
    Insulin: float
    BMI: float
    DiabetesPedigreeFunction: float
    Age: int

class KidneyInput(BaseModel):
    age: float
    bp: float
    sg: float
    al: float
    su: float
    bgr: float
    bu: float
    sc: float
    sod: float
    pot: float
    hemo: float
    pcv: float
    wc: float
    rc: float
    htn: int
    dm: int
    cad: int
    appet: int
    pe: int
    ane: int

class RiskInput(BaseModel):
    age: int
    gender: str
    bmi: float
    blood_pressure: float
    cholesterol: float
    glucose: float
    smoking: bool = False
    family_history: bool = False
    exercise: bool = True

class ChatMessage(BaseModel):
    message: str


# ==================== Prediction Endpoints ====================

@app.post("/predict/heart")
def predict_heart_disease(data: HeartInput):
    if 'heart_disease' not in models:
        raise HTTPException(status_code=503, detail="Heart disease model not loaded")
    
    features = np.array([[data.age, data.sex, data.cp, data.trestbps, data.chol,
                           data.fbs, data.restecg, data.thalach, data.exang,
                           data.oldpeak, data.slope, data.ca, data.thal]])
    
    model = models['heart_disease']
    prediction = int(model.predict(features)[0])
    probability = float(model.predict_proba(features)[0][1]) * 100

    risk_level = 'High' if probability > 70 else ('Medium' if probability > 40 else 'Low')
    
    return {
        'prediction': prediction,
        'probability': round(probability, 2),
        'risk_level': risk_level,
        'disease': 'Heart Disease',
        'model_used': training_results.get('heart_disease', {}).get('best_model', 'Unknown'),
        'interpretation': f"{'Positive' if prediction == 1 else 'Negative'} for heart disease with {probability:.1f}% probability.",
        'medications': recommend_medications('heart_disease', data.dict(), prediction == 1)
    }


@app.post("/predict/diabetes")
def predict_diabetes(data: DiabetesInput):
    if 'diabetes' not in models:
        raise HTTPException(status_code=503, detail="Diabetes model not loaded")
    
    features = np.array([[data.Pregnancies, data.Glucose, data.BloodPressure,
                           data.SkinThickness, data.Insulin, data.BMI,
                           data.DiabetesPedigreeFunction, data.Age]])
    
    model = models['diabetes']
    prediction = int(model.predict(features)[0])
    probability = float(model.predict_proba(features)[0][1]) * 100

    risk_level = 'High' if probability > 70 else ('Medium' if probability > 40 else 'Low')
    
    return {
        'prediction': prediction,
        'probability': round(probability, 2),
        'risk_level': risk_level,
        'disease': 'Diabetes',
        'model_used': training_results.get('diabetes', {}).get('best_model', 'Unknown'),
        'interpretation': f"{'Positive' if prediction == 1 else 'Negative'} for diabetes with {probability:.1f}% probability.",
        'medications': recommend_medications('diabetes', data.dict(), prediction == 1)
    }


@app.post("/predict/kidney")
def predict_kidney_disease(data: KidneyInput):
    if 'kidney_disease' not in models:
        raise HTTPException(status_code=503, detail="Kidney disease model not loaded")
    
    features = np.array([[data.age, data.bp, data.sg, data.al, data.su,
                           data.bgr, data.bu, data.sc, data.sod, data.pot,
                           data.hemo, data.pcv, data.wc, data.rc,
                           data.htn, data.dm, data.cad, data.appet,
                           data.pe, data.ane]])
    
    model = models['kidney_disease']
    prediction = int(model.predict(features)[0])
    probability = float(model.predict_proba(features)[0][1]) * 100

    risk_level = 'High' if probability > 70 else ('Medium' if probability > 40 else 'Low')
    
    return {
        'prediction': prediction,
        'probability': round(probability, 2),
        'risk_level': risk_level,
        'disease': 'Kidney Disease',
        'model_used': training_results.get('kidney_disease', {}).get('best_model', 'Unknown'),
        'interpretation': f"{'Positive' if prediction == 1 else 'Negative'} for kidney disease with {probability:.1f}% probability.",
        'medications': recommend_medications('kidney_disease', data.dict(), prediction == 1)
    }


@app.post("/predict/image-unified")
async def predict_image_unified(file: UploadFile = File(...)):
    if not all(k in models for k in ['heart_disease', 'diabetes', 'kidney_disease']):
        raise HTTPException(status_code=503, detail="Not all ML models are loaded for unified prediction")
        
    image_bytes = await file.read()
    
    # Extract data using the OCR module
    extracted_data = extract_medical_data_from_image(image_bytes)
    
    # 1. Predict Heart Disease
    heart_features = np.array([[extracted_data['age'], extracted_data['sex'], extracted_data['cp'], 
                                extracted_data['trestbps'], extracted_data['chol'], extracted_data['fbs'], 
                                extracted_data['restecg'], extracted_data['thalach'], extracted_data['exang'],
                                extracted_data['oldpeak'], extracted_data['slope'], extracted_data['ca'], 
                                extracted_data['thal']]])
    
    heart_prob = float(models['heart_disease'].predict_proba(heart_features)[0][1]) * 100
    heart_pred = int(models['heart_disease'].predict(heart_features)[0])
    
    # 2. Predict Diabetes
    diabetes_features = np.array([[extracted_data['Pregnancies'], extracted_data['Glucose'], extracted_data['BloodPressure'],
                                   extracted_data['SkinThickness'], extracted_data['Insulin'], extracted_data['BMI'],
                                   extracted_data['DiabetesPedigreeFunction'], extracted_data['Age']]])
                                   
    diabetes_prob = float(models['diabetes'].predict_proba(diabetes_features)[0][1]) * 100
    diabetes_pred = int(models['diabetes'].predict(diabetes_features)[0])
    
    # 3. Predict Kidney Disease
    kidney_features = np.array([[extracted_data['age'], extracted_data['bp'], extracted_data['sg'], extracted_data['al'], 
                                 extracted_data['su'], extracted_data['bgr'], extracted_data['bu'], extracted_data['sc'],
                                 extracted_data['sod'], extracted_data['pot'], extracted_data['hemo'], extracted_data['pcv'], 
                                 extracted_data['wc'], extracted_data['rc'], extracted_data['htn'], extracted_data['dm'], 
                                 extracted_data['cad'], extracted_data['appet'], extracted_data['pe'], extracted_data['ane']]])
                                 
    kidney_prob = float(models['kidney_disease'].predict_proba(kidney_features)[0][1]) * 100
    kidney_pred = int(models['kidney_disease'].predict(kidney_features)[0])
    
    return {
        'extracted_data': extracted_data,
        'predictions': {
            'heart_disease': {
                'probability': round(heart_prob, 2),
                'risk_level': 'High' if heart_prob > 70 else ('Medium' if heart_prob > 40 else 'Low'),
                'prediction': heart_pred,
                'medications': recommend_medications('heart_disease', extracted_data, heart_pred == 1)
            },
            'diabetes': {
                'probability': round(diabetes_prob, 2),
                'risk_level': 'High' if diabetes_prob > 70 else ('Medium' if diabetes_prob > 40 else 'Low'),
                'prediction': diabetes_pred,
                'medications': recommend_medications('diabetes', extracted_data, diabetes_pred == 1)
            },
            'kidney_disease': {
                'probability': round(kidney_prob, 2),
                'risk_level': 'High' if kidney_prob > 70 else ('Medium' if kidney_prob > 40 else 'Low'),
                'prediction': kidney_pred,
                'medications': recommend_medications('kidney_disease', extracted_data, kidney_pred == 1)
            }
        }
    }


# ==================== Data Mining Endpoints ====================

@app.get("/mining/association-rules")
def association_rules_endpoint():
    try:
        rules = get_association_rules()
        return {'rules': rules, 'total': len(rules)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/mining/clusters")
def clusters_endpoint():
    try:
        clusters = get_patient_clusters()
        return clusters
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/mining/patterns")
def patterns_endpoint():
    try:
        patterns = get_patterns()
        return patterns
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Risk Assessment ====================

@app.post("/risk/assess")
def assess_risk(data: RiskInput):
    risk_score = 0
    risk_factors = []

    # Age risk
    if data.age > 60:
        risk_score += 20
        risk_factors.append({'factor': 'Age > 60', 'impact': 20})
    elif data.age > 45:
        risk_score += 10
        risk_factors.append({'factor': 'Age > 45', 'impact': 10})

    # BMI risk
    if data.bmi > 35:
        risk_score += 20
        risk_factors.append({'factor': 'Obesity (BMI > 35)', 'impact': 20})
    elif data.bmi > 30:
        risk_score += 15
        risk_factors.append({'factor': 'Overweight (BMI > 30)', 'impact': 15})
    elif data.bmi > 25:
        risk_score += 5
        risk_factors.append({'factor': 'Slightly overweight', 'impact': 5})

    # BP risk
    if data.blood_pressure > 140:
        risk_score += 20
        risk_factors.append({'factor': 'High blood pressure (>140)', 'impact': 20})
    elif data.blood_pressure > 120:
        risk_score += 10
        risk_factors.append({'factor': 'Elevated blood pressure', 'impact': 10})

    # Cholesterol
    if data.cholesterol > 240:
        risk_score += 15
        risk_factors.append({'factor': 'High cholesterol (>240)', 'impact': 15})
    elif data.cholesterol > 200:
        risk_score += 8
        risk_factors.append({'factor': 'Borderline cholesterol', 'impact': 8})

    # Glucose
    if data.glucose > 126:
        risk_score += 15
        risk_factors.append({'factor': 'High blood sugar (>126)', 'impact': 15})
    elif data.glucose > 100:
        risk_score += 8
        risk_factors.append({'factor': 'Pre-diabetic glucose', 'impact': 8})

    # Lifestyle
    if data.smoking:
        risk_score += 15
        risk_factors.append({'factor': 'Smoking', 'impact': 15})
    if data.family_history:
        risk_score += 10
        risk_factors.append({'factor': 'Family history', 'impact': 10})
    if not data.exercise:
        risk_score += 10
        risk_factors.append({'factor': 'Sedentary lifestyle', 'impact': 10})

    risk_score = min(100, risk_score)
    risk_level = 'Critical' if risk_score > 75 else ('High' if risk_score > 50 else ('Medium' if risk_score > 25 else 'Low'))

    # Recommendations
    recommendations = []
    if data.bmi > 25:
        recommendations.append('Consider weight management through diet and exercise.')
    if data.blood_pressure > 120:
        recommendations.append('Monitor blood pressure regularly. Reduce sodium intake.')
    if data.cholesterol > 200:
        recommendations.append('Adopt a heart-healthy diet low in saturated fats.')
    if data.glucose > 100:
        recommendations.append('Monitor blood sugar levels. Limit sugar intake.')
    if data.smoking:
        recommendations.append('Quit smoking — it significantly reduces disease risk.')
    if not data.exercise:
        recommendations.append('Aim for at least 150 minutes of moderate exercise per week.')
    if not recommendations:
        recommendations.append('Maintain your healthy lifestyle! Regular check-ups are still recommended.')

    return {
        'risk_score': risk_score,
        'risk_level': risk_level,
        'risk_factors': risk_factors,
        'recommendations': recommendations,
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
        raise HTTPException(status_code=503, detail="Training results not available")
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
    
    feature_data = [{'feature': f, 'importance': round(float(i), 4)}
                     for f, i in zip(features, importance)]
    feature_data.sort(key=lambda x: x['importance'], reverse=True)
    
    return {'disease': disease, 'features': feature_data}


# ==================== Chatbot ====================

@app.post("/chatbot/message")
def chatbot_endpoint(data: ChatMessage):
    response = process_message(data.message)
    return response


# ==================== Health Check ====================

@app.get("/health")
def health_check():
    return {
        'status': 'healthy',
        'models_loaded': list(models.keys()),
        'models_count': len(models)
    }


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
