def recommend_medications(disease_key: str, data: dict, prediction_positive: bool) -> list:
    """
    Returns a list of recommended medications based on the disease model result
    and the specific patient data (vital signs / lab results).
    """
    meds = []
    
    # If the AI model predicts negative and indicators aren't alarming, return preventive advice.
    if not prediction_positive:
        return ["Maintain a healthy diet and regular exercise.", "General multivitamins (optional)."]

    if disease_key == 'heart_disease':
        # data might contain: trestbps, chol, fbs, etc.
        chol = data.get('chol', 0)
        bps = data.get('trestbps', 0)
        exang = data.get('exang', 0)
        
        meds.append("Aspirin (preventive dosage) - Consult Cardiologist")
        
        if chol > 200:
            meds.append("Statins (e.g., Atorvastatin, Rosuvastatin) for cholesterol management")
        if bps > 130:
            meds.append("Beta-blockers (e.g., Metoprolol) or ACE inhibitors for blood pressure")
        if exang == 1:
            meds.append("Nitrates (e.g., Nitroglycerin) for exercise-induced angina relief")
            
    elif disease_key == 'diabetes':
        # data might contain: Glucose, BloodPressure, BMI
        glucose = data.get('Glucose', 0)
        bmi = data.get('BMI', 0)
        
        if glucose > 125:
            meds.append("Metformin as a first-line treatment for blood sugar regulation")
        if glucose > 200:
            meds.append("Insulin therapy or advanced oral antidiabetics (Sulfonylureas)")
        if bmi > 30:
            meds.append("GLP-1 receptor agonists (e.g., Semaglutide) to aid in weight loss and glucose control")
            
    elif disease_key == 'kidney_disease':
        # data might contain: bp, sc (serum creatinine), hemo, su
        bps = data.get('bp', 0)
        hemo = data.get('hemo', 15)
        su = data.get('su', 0)
        
        if bps > 130:
            meds.append("ACE inhibitors or ARBs to protect kidney function and control BP")
        if hemo < 12:
            meds.append("Erythropoiesis-stimulating agents (ESAs) or Iron supplements for anemia")
        if su > 1:
            meds.append("SGLT2 inhibitors (e.g., Dapagliflozin) to reduce kidney disease progression")

    # If no specific rules hit but prediction is positive
    if not meds:
        if disease_key == 'heart_disease':
            meds.append("Consult cardiologist for comprehensive medication plan including Statins or Beta-blockers")
        elif disease_key == 'diabetes':
            meds.append("Consult endocrinologist for a Metformin prescription or lifestyle plan")
        else:
            meds.append("Consult nephrologist for renal-protective medications")
            
    return meds
