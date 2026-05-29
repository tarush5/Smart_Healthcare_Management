"""
Generate realistic synthetic healthcare datasets for training ML models.
Modeled after Kaggle Heart Disease, Pima Diabetes, and Chronic Kidney Disease datasets.
"""

import numpy as np
import pandas as pd
import os
import sys

# Fix Windows console encoding for unicode characters
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

np.random.seed(42)

# Container-safe path resolution
def get_path(folder_name):
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    if base_dir == '/' or base_dir == '':
        return os.path.join(os.path.dirname(__file__), folder_name)
    return os.path.join(base_dir, folder_name)

DATASET_DIR = get_path('datasets')
os.makedirs(DATASET_DIR, exist_ok=True)


def generate_heart_disease_dataset(n=1000):
    """Generate heart disease dataset modeled after UCI Heart Disease dataset."""
    data = []
    for _ in range(n):
        age = np.random.randint(29, 78)
        sex = np.random.choice([0, 1], p=[0.32, 0.68])
        cp = np.random.choice([0, 1, 2, 3], p=[0.47, 0.17, 0.28, 0.08])
        trestbps = int(np.random.normal(131, 17))
        trestbps = max(90, min(200, trestbps))
        chol = int(np.random.normal(246, 52))
        chol = max(120, min(570, chol))
        fbs = np.random.choice([0, 1], p=[0.85, 0.15])
        restecg = np.random.choice([0, 1, 2], p=[0.48, 0.49, 0.03])
        thalach = int(np.random.normal(149, 23))
        thalach = max(70, min(210, thalach))
        exang = np.random.choice([0, 1], p=[0.67, 0.33])
        oldpeak = round(np.random.exponential(1.0), 1)
        oldpeak = min(6.2, oldpeak)
        slope = np.random.choice([0, 1, 2], p=[0.07, 0.46, 0.47])
        ca = np.random.choice([0, 1, 2, 3, 4], p=[0.58, 0.22, 0.12, 0.06, 0.02])
        thal = np.random.choice([0, 1, 2, 3], p=[0.02, 0.05, 0.52, 0.41])

        # Target based on risk factors
        risk_score = 0
        risk_score += 0.3 if age > 55 else 0
        risk_score += 0.2 if sex == 1 else 0
        risk_score += 0.3 if cp >= 2 else 0
        risk_score += 0.2 if trestbps > 140 else 0
        risk_score += 0.2 if chol > 240 else 0
        risk_score += 0.1 if fbs == 1 else 0
        risk_score += 0.3 if thalach < 120 else 0
        risk_score += 0.3 if exang == 1 else 0
        risk_score += 0.2 if oldpeak > 2.0 else 0
        risk_score += 0.2 if ca > 0 else 0
        risk_score += 0.2 if thal == 3 else 0

        prob = min(0.95, max(0.05, risk_score / 2.5 + np.random.normal(0, 0.1)))
        target = 1 if np.random.random() < prob else 0

        data.append([age, sex, cp, trestbps, chol, fbs, restecg, thalach,
                      exang, oldpeak, slope, ca, thal, target])

    columns = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg',
               'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal', 'target']
    df = pd.DataFrame(data, columns=columns)
    filepath = os.path.join(DATASET_DIR, 'heart_disease.csv')
    df.to_csv(filepath, index=False)
    print(f"✅ Heart Disease dataset: {len(df)} rows → {filepath}")
    print(f"   Target distribution: {dict(df['target'].value_counts())}")
    return df


def generate_diabetes_dataset(n=800):
    """Generate diabetes dataset modeled after Pima Indians Diabetes dataset."""
    data = []
    for _ in range(n):
        pregnancies = np.random.choice(range(0, 15), p=[
            0.15, 0.14, 0.12, 0.10, 0.09, 0.08, 0.07, 0.06,
            0.05, 0.04, 0.03, 0.03, 0.02, 0.01, 0.01
        ])
        glucose = int(np.random.normal(121, 32))
        glucose = max(44, min(200, glucose))
        blood_pressure = int(np.random.normal(72, 12))
        blood_pressure = max(24, min(122, blood_pressure))
        skin_thickness = int(np.random.normal(26, 10))
        skin_thickness = max(7, min(99, skin_thickness))
        insulin = int(np.random.normal(140, 86))
        insulin = max(14, min(846, insulin))
        bmi = round(np.random.normal(32, 8), 1)
        bmi = max(18.2, min(67.1, bmi))
        dpf = round(np.random.exponential(0.47), 3)
        dpf = min(2.42, dpf)
        age = np.random.randint(21, 81)

        # Outcome based on risk factors
        risk_score = 0
        risk_score += 0.3 if glucose > 140 else (0.1 if glucose > 120 else 0)
        risk_score += 0.2 if bmi > 35 else (0.1 if bmi > 30 else 0)
        risk_score += 0.15 if age > 45 else 0
        risk_score += 0.1 if pregnancies > 5 else 0
        risk_score += 0.15 if insulin > 200 else 0
        risk_score += 0.1 if dpf > 0.5 else 0
        risk_score += 0.1 if blood_pressure > 80 else 0
        risk_score += 0.1 if skin_thickness > 35 else 0

        prob = min(0.9, max(0.05, risk_score / 1.2 + np.random.normal(0, 0.1)))
        outcome = 1 if np.random.random() < prob else 0

        data.append([pregnancies, glucose, blood_pressure, skin_thickness,
                      insulin, bmi, dpf, age, outcome])

    columns = ['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness',
               'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age', 'Outcome']
    df = pd.DataFrame(data, columns=columns)
    filepath = os.path.join(DATASET_DIR, 'diabetes.csv')
    df.to_csv(filepath, index=False)
    print(f"✅ Diabetes dataset: {len(df)} rows → {filepath}")
    print(f"   Outcome distribution: {dict(df['Outcome'].value_counts())}")
    return df


def generate_kidney_disease_dataset(n=400):
    """Generate chronic kidney disease dataset."""
    data = []
    for _ in range(n):
        age = np.random.randint(2, 90)
        bp = int(np.random.normal(76, 14))
        bp = max(50, min(180, bp))
        sg = np.random.choice([1.005, 1.010, 1.015, 1.020, 1.025],
                                p=[0.12, 0.20, 0.25, 0.25, 0.18])
        al = np.random.choice([0, 1, 2, 3, 4, 5], p=[0.40, 0.15, 0.15, 0.10, 0.10, 0.10])
        su = np.random.choice([0, 1, 2, 3, 4, 5], p=[0.50, 0.15, 0.10, 0.10, 0.08, 0.07])
        bgr = int(np.random.normal(148, 79))
        bgr = max(22, min(490, bgr))
        bu = round(np.random.normal(57, 50), 1)
        bu = max(1.5, min(391, bu))
        sc = round(np.random.normal(3.07, 5.7), 1)
        sc = max(0.4, min(76, sc))
        sod = round(np.random.normal(137, 10), 1)
        sod = max(4.5, min(163, sod))
        pot = round(np.random.normal(4.6, 3.2), 1)
        pot = max(2.5, min(47, pot))
        hemo = round(np.random.normal(12.5, 2.9), 1)
        hemo = max(3.1, min(17.8, hemo))
        pcv = int(np.random.normal(38, 9))
        pcv = max(9, min(54, pcv))
        wc = int(np.random.normal(8406, 2944))
        wc = max(2200, min(26400, wc))
        rc = round(np.random.normal(4.7, 1.0), 1)
        rc = max(2.1, min(8.0, rc))
        htn = np.random.choice([0, 1], p=[0.55, 0.45])
        dm = np.random.choice([0, 1], p=[0.60, 0.40])
        cad = np.random.choice([0, 1], p=[0.88, 0.12])
        appet = np.random.choice([0, 1], p=[0.35, 0.65])
        pe = np.random.choice([0, 1], p=[0.75, 0.25])
        ane = np.random.choice([0, 1], p=[0.75, 0.25])

        # Classification based on risk
        risk_score = 0
        risk_score += 0.3 if al > 2 else 0
        risk_score += 0.2 if su > 2 else 0
        risk_score += 0.2 if sc > 3.0 else 0
        risk_score += 0.15 if hemo < 10 else 0
        risk_score += 0.15 if htn == 1 else 0
        risk_score += 0.1 if dm == 1 else 0
        risk_score += 0.1 if bp > 90 else 0
        risk_score += 0.1 if bu > 80 else 0

        prob = min(0.95, max(0.05, risk_score / 1.3 + np.random.normal(0, 0.1)))
        classification = 1 if np.random.random() < prob else 0

        data.append([age, bp, sg, al, su, bgr, bu, sc, sod, pot,
                      hemo, pcv, wc, rc, htn, dm, cad, appet, pe, ane, classification])

    columns = ['age', 'bp', 'sg', 'al', 'su', 'bgr', 'bu', 'sc', 'sod', 'pot',
               'hemo', 'pcv', 'wc', 'rc', 'htn', 'dm', 'cad', 'appet', 'pe', 'ane',
               'classification']
    df = pd.DataFrame(data, columns=columns)
    filepath = os.path.join(DATASET_DIR, 'kidney_disease.csv')
    df.to_csv(filepath, index=False)
    print(f"✅ Kidney Disease dataset: {len(df)} rows → {filepath}")
    print(f"   Classification distribution: {dict(df['classification'].value_counts())}")
    return df


if __name__ == '__main__':
    print("=" * 60)
    print("  Generating Synthetic Healthcare Datasets")
    print("=" * 60)
    generate_heart_disease_dataset()
    print()
    generate_diabetes_dataset()
    print()
    generate_kidney_disease_dataset()
    print()
    print("=" * 60)
    print("  All datasets generated successfully! ✅")
    print("=" * 60)
