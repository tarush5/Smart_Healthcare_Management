"""
Data Mining Engine — Association Rules, Clustering, Pattern Discovery.
"""

import os
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from mlxtend.frequent_patterns import apriori, association_rules

DATASET_DIR = os.path.join(os.path.dirname(__file__), '..', 'datasets')


def get_association_rules():
    """Run Apriori algorithm to find symptom-disease association rules."""
    df = pd.read_csv(os.path.join(DATASET_DIR, 'heart_disease.csv'))

    # Create binary features for association mining
    binary_df = pd.DataFrame()
    binary_df['High_Age'] = (df['age'] > 55).astype(int)
    binary_df['Male'] = df['sex']
    binary_df['Chest_Pain'] = (df['cp'] >= 2).astype(int)
    binary_df['High_BP'] = (df['trestbps'] > 140).astype(int)
    binary_df['High_Cholesterol'] = (df['chol'] > 240).astype(int)
    binary_df['High_Blood_Sugar'] = df['fbs']
    binary_df['Low_Max_HR'] = (df['thalach'] < 120).astype(int)
    binary_df['Exercise_Angina'] = df['exang']
    binary_df['High_ST_Depression'] = (df['oldpeak'] > 2.0).astype(int)
    binary_df['Heart_Disease'] = df['target']

    # Also get diabetes rules
    df_diab = pd.read_csv(os.path.join(DATASET_DIR, 'diabetes.csv'))
    binary_diab = pd.DataFrame()
    binary_diab['High_Glucose'] = (df_diab['Glucose'] > 140).astype(int)
    binary_diab['High_BMI'] = (df_diab['BMI'] > 35).astype(int)
    binary_diab['High_Age'] = (df_diab['Age'] > 45).astype(int)
    binary_diab['High_Insulin'] = (df_diab['Insulin'] > 200).astype(int)
    binary_diab['High_BP'] = (df_diab['BloodPressure'] > 80).astype(int)
    binary_diab['High_Pregnancies'] = (df_diab['Pregnancies'] > 5).astype(int)
    binary_diab['Diabetes'] = df_diab['Outcome']

    all_rules = []

    # Heart disease rules
    try:
        freq_items = apriori(binary_df, min_support=0.08, use_colnames=True)
        if len(freq_items) > 0:
            rules = association_rules(freq_items, metric="confidence", min_threshold=0.5,
                                       num_items_in_rule=2)
            for _, rule in rules.iterrows():
                consequents = list(rule['consequents'])
                if 'Heart_Disease' in consequents:
                    all_rules.append({
                        'antecedents': list(rule['antecedents']),
                        'consequents': consequents,
                        'support': round(float(rule['support']), 4),
                        'confidence': round(float(rule['confidence']), 4),
                        'lift': round(float(rule['lift']), 4),
                        'disease_type': 'Heart Disease'
                    })
    except Exception as e:
        print(f"Heart disease rules error: {e}")

    # Diabetes rules
    try:
        freq_items_d = apriori(binary_diab, min_support=0.08, use_colnames=True)
        if len(freq_items_d) > 0:
            rules_d = association_rules(freq_items_d, metric="confidence", min_threshold=0.5,
                                         num_items_in_rule=2)
            for _, rule in rules_d.iterrows():
                consequents = list(rule['consequents'])
                if 'Diabetes' in consequents:
                    all_rules.append({
                        'antecedents': list(rule['antecedents']),
                        'consequents': consequents,
                        'support': round(float(rule['support']), 4),
                        'confidence': round(float(rule['confidence']), 4),
                        'lift': round(float(rule['lift']), 4),
                        'disease_type': 'Diabetes'
                    })
    except Exception as e:
        print(f"Diabetes rules error: {e}")

    # Sort by confidence
    all_rules.sort(key=lambda x: x['confidence'], reverse=True)
    return all_rules[:30]


def get_patient_clusters():
    """Perform K-Means clustering to segment patients by risk level."""
    df = pd.read_csv(os.path.join(DATASET_DIR, 'heart_disease.csv'))

    features = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']
    X = df[features].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X_scaled)

    # Determine which cluster is high/medium/low risk
    cluster_stats = []
    for i in range(3):
        mask = clusters == i
        cluster_data = df[mask]
        avg_disease = cluster_data['target'].mean()
        cluster_stats.append({
            'cluster_id': i,
            'avg_disease_rate': avg_disease,
            'size': int(mask.sum()),
            'avg_age': round(float(cluster_data['age'].mean()), 1),
            'avg_bp': round(float(cluster_data['trestbps'].mean()), 1),
            'avg_chol': round(float(cluster_data['chol'].mean()), 1),
            'avg_max_hr': round(float(cluster_data['thalach'].mean()), 1),
        })

    # Sort by disease rate to assign labels
    cluster_stats.sort(key=lambda x: x['avg_disease_rate'], reverse=True)
    risk_labels = ['High Risk', 'Medium Risk', 'Low Risk']
    risk_colors = ['#ef4444', '#f59e0b', '#22c55e']

    for idx, stat in enumerate(cluster_stats):
        stat['risk_label'] = risk_labels[idx]
        stat['color'] = risk_colors[idx]

    # Get scatter data for visualization
    scatter_data = []
    label_map = {stat['cluster_id']: stat['risk_label'] for stat in cluster_stats}
    color_map = {stat['cluster_id']: stat['color'] for stat in cluster_stats}

    for i in range(len(df)):
        scatter_data.append({
            'age': int(df.iloc[i]['age']),
            'chol': int(df.iloc[i]['chol']),
            'bp': int(df.iloc[i]['trestbps']),
            'max_hr': int(df.iloc[i]['thalach']),
            'cluster': label_map[clusters[i]],
            'color': color_map[clusters[i]]
        })

    return {
        'clusters': cluster_stats,
        'scatter_data': scatter_data[:200],  # Limit for performance
        'features_used': features
    }


def get_patterns():
    """Discover correlation patterns across datasets."""
    # Heart disease correlations
    df_heart = pd.read_csv(os.path.join(DATASET_DIR, 'heart_disease.csv'))
    heart_corr = df_heart.corr()['target'].drop('target').sort_values(ascending=False)

    heart_patterns = []
    for feature, corr_val in heart_corr.items():
        direction = 'positive' if corr_val > 0 else 'negative'
        strength = 'strong' if abs(corr_val) > 0.3 else ('moderate' if abs(corr_val) > 0.15 else 'weak')
        heart_patterns.append({
            'feature': feature,
            'correlation': round(float(corr_val), 4),
            'direction': direction,
            'strength': strength
        })

    # Diabetes correlations
    df_diab = pd.read_csv(os.path.join(DATASET_DIR, 'diabetes.csv'))
    diab_corr = df_diab.corr()['Outcome'].drop('Outcome').sort_values(ascending=False)

    diabetes_patterns = []
    for feature, corr_val in diab_corr.items():
        direction = 'positive' if corr_val > 0 else 'negative'
        strength = 'strong' if abs(corr_val) > 0.3 else ('moderate' if abs(corr_val) > 0.15 else 'weak')
        diabetes_patterns.append({
            'feature': feature,
            'correlation': round(float(corr_val), 4),
            'direction': direction,
            'strength': strength
        })

    # Symptom co-occurrence
    symptom_pairs = [
        {'pair': ['High BP', 'High Cholesterol'], 'co_occurrence': round(float((df_heart['trestbps'] > 140) & (df_heart['chol'] > 240)).mean() * 100, 1), 'disease': 'Heart Disease'},
        {'pair': ['Chest Pain', 'Exercise Angina'], 'co_occurrence': round(float(((df_heart['cp'] >= 2) & (df_heart['exang'] == 1)).mean()) * 100, 1), 'disease': 'Heart Disease'},
        {'pair': ['High Glucose', 'High BMI'], 'co_occurrence': round(float(((df_diab['Glucose'] > 140) & (df_diab['BMI'] > 35)).mean()) * 100, 1), 'disease': 'Diabetes'},
        {'pair': ['High Age', 'High BP'], 'co_occurrence': round(float(((df_heart['age'] > 55) & (df_heart['trestbps'] > 140)).mean()) * 100, 1), 'disease': 'Heart Disease'},
    ]

    return {
        'heart_disease_patterns': heart_patterns,
        'diabetes_patterns': diabetes_patterns,
        'symptom_cooccurrence': symptom_pairs
    }


if __name__ == '__main__':
    print("Testing Data Mining Engine...")
    print("\n=== Association Rules ===")
    rules = get_association_rules()
    for r in rules[:5]:
        print(f"  {r['antecedents']} → {r['consequents']}  (conf: {r['confidence']})")

    print("\n=== Patient Clusters ===")
    clusters = get_patient_clusters()
    for c in clusters['clusters']:
        print(f"  {c['risk_label']}: {c['size']} patients, disease rate: {c['avg_disease_rate']:.2%}")

    print("\n=== Patterns ===")
    patterns = get_patterns()
    print(f"  Heart disease patterns: {len(patterns['heart_disease_patterns'])}")
    print(f"  Diabetes patterns: {len(patterns['diabetes_patterns'])}")
