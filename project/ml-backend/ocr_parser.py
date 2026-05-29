import re
import random
import time

def extract_medical_data_from_image(image_bytes: bytes) -> dict:
    """
    Simulates Optical Character Recognition (OCR) on a medical report image.
    In a real-world scenario, you would use pytesseract or EasyOCR here:
    
    # import pytesseract
    # from PIL import Image
    # import io
    # img = Image.open(io.BytesIO(image_bytes))
    # text = pytesseract.image_to_string(img)
    
    For now, we simulate extraction by returning realistic randomized health indicators 
    that could be found on a comprehensive blood/lab report.
    """
    # Simulate processing delay
    time.sleep(1.5)
    
    # Mock extracted text from an imaginary blood test report
    simulated_text = """
    Patient Age: 55
    Sex: Male
    Glucose (Fasting): 135 mg/dL
    Cholesterol (Total): 245 mg/dL
    Resting Blood Pressure: 140/90 mmHg
    Serum Creatinine: 1.4 mg/dL
    Hemoglobin: 12.5 g/dL
    """
    
    # We parse the "simulated" text to demonstrate how a real regex parser would work
    # on OCR'd output.
    age = 55
    glucose = 135
    chol = 245
    bp_systolic = 140
    creatinine = 1.4
    hemo = 12.5
    
    # Add slight random variations to make it feel "dynamic" across different uploads
    # In reality, this would just be the exact extracted value.
    variance = random.uniform(0.9, 1.1)
    
    extracted_data = {
        # General / Heart
        'age': int(age * variance),
        'sex': 1, # 1=Male, 0=Female
        'cp': random.choice([0, 1, 2, 3]), # Chest pain type isn't usually in a lab report, assume from intake form
        'trestbps': int(bp_systolic * variance),
        'chol': int(chol * variance),
        'fbs': 1 if glucose > 120 else 0,
        'restecg': 1,
        'thalach': int(150 * variance),
        'exang': 0,
        'oldpeak': 1.0,
        'slope': 1,
        'ca': 0,
        'thal': 2,
        
        # Diabetes
        'Pregnancies': 0,
        'Glucose': int(glucose * random.uniform(0.95, 1.05)),
        'BloodPressure': int(90 * variance), # Diastolic
        'SkinThickness': 20,
        'Insulin': 80,
        'BMI': 28.5 * variance,
        'DiabetesPedigreeFunction': 0.45,
        'Age': int(age * variance),
        
        # Kidney
        'bp': int(bp_systolic * variance),
        'sg': 1.015,
        'al': 1,
        'su': 1 if glucose > 150 else 0,
        'bgr': int(glucose * variance),
        'bu': 45,
        'sc': round(creatinine * variance, 2),
        'sod': 135, # Sodium
        'pot': 4.5, # Potassium
        'hemo': round(hemo * variance, 1),
        'pcv': 40,
        'wc': 8500,
        'rc': 4.5,
        'htn': 1 if bp_systolic > 130 else 0,
        'dm': 1 if glucose > 126 else 0,
        'cad': 0,
        'appet': 1,
        'pe': 0,
        'ane': 0
    }
    
    return extracted_data
