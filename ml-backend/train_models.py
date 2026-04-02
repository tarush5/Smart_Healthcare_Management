"""
Train ML models for disease prediction.
Trains 4 algorithms per disease, compares accuracy, saves the best model.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                              f1_score, confusion_matrix, classification_report)
from sklearn.pipeline import Pipeline

DATASET_DIR = os.path.join(os.path.dirname(__file__), '..', 'datasets')
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
os.makedirs(MODEL_DIR, exist_ok=True)


def get_algorithms():
    """Return dict of ML algorithms to train."""
    return {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
        'Decision Tree': DecisionTreeClassifier(random_state=42),
        'SVM': SVC(kernel='rbf', probability=True, random_state=42)
    }


def train_and_evaluate(X_train, X_test, y_train, y_test, disease_name):
    """Train all algorithms, evaluate, and save the best model."""
    algorithms = get_algorithms()
    results = {}
    best_accuracy = 0
    best_model_name = None
    best_pipeline = None

    print(f"\n{'='*60}")
    print(f"  Training Models for: {disease_name}")
    print(f"{'='*60}")
    print(f"  Training set: {len(X_train)} samples")
    print(f"  Test set: {len(X_test)} samples")
    print(f"  Features: {X_train.shape[1]}")
    print()

    for name, algorithm in algorithms.items():
        # Create pipeline with scaler
        pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', algorithm)
        ])

        # Train
        pipeline.fit(X_train, y_train)

        # Predict
        y_pred = pipeline.predict(X_test)

        # Evaluate
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        cm = confusion_matrix(y_test, y_pred).tolist()

        results[name] = {
            'accuracy': round(accuracy * 100, 2),
            'precision': round(precision * 100, 2),
            'recall': round(recall * 100, 2),
            'f1_score': round(f1 * 100, 2),
            'confusion_matrix': cm
        }

        print(f"  {name:25s} → Accuracy: {accuracy*100:.2f}%  |  F1: {f1*100:.2f}%")

        if accuracy > best_accuracy:
            best_accuracy = accuracy
            best_model_name = name
            best_pipeline = pipeline

    # Save best model
    model_filename = disease_name.lower().replace(' ', '_') + '_model.joblib'
    model_path = os.path.join(MODEL_DIR, model_filename)
    joblib.dump(best_pipeline, model_path)

    # Get feature importance if available
    feature_importance = None
    classifier = best_pipeline.named_steps['classifier']
    if hasattr(classifier, 'feature_importances_'):
        feature_importance = classifier.feature_importances_.tolist()
    elif hasattr(classifier, 'coef_'):
        feature_importance = np.abs(classifier.coef_[0]).tolist()

    print(f"\n  🏆 Best model: {best_model_name} ({best_accuracy*100:.2f}%)")
    print(f"  💾 Saved to: {model_path}")

    return {
        'best_model': best_model_name,
        'best_accuracy': round(best_accuracy * 100, 2),
        'all_results': results,
        'feature_importance': feature_importance
    }


def train_heart_disease():
    """Train heart disease prediction models."""
    df = pd.read_csv(os.path.join(DATASET_DIR, 'heart_disease.csv'))
    X = df.drop('target', axis=1)
    y = df['target']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    results = train_and_evaluate(X_train, X_test, y_train, y_test, 'Heart Disease')
    results['features'] = list(X.columns)
    return results


def train_diabetes():
    """Train diabetes prediction models."""
    df = pd.read_csv(os.path.join(DATASET_DIR, 'diabetes.csv'))
    X = df.drop('Outcome', axis=1)
    y = df['Outcome']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    results = train_and_evaluate(X_train, X_test, y_train, y_test, 'Diabetes')
    results['features'] = list(X.columns)
    return results


def train_kidney_disease():
    """Train kidney disease prediction models."""
    df = pd.read_csv(os.path.join(DATASET_DIR, 'kidney_disease.csv'))
    X = df.drop('classification', axis=1)
    y = df['classification']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    results = train_and_evaluate(X_train, X_test, y_train, y_test, 'Kidney Disease')
    results['features'] = list(X.columns)
    return results


if __name__ == '__main__':
    all_results = {}

    all_results['heart_disease'] = train_heart_disease()
    all_results['diabetes'] = train_diabetes()
    all_results['kidney_disease'] = train_kidney_disease()

    # Save comparison results
    results_path = os.path.join(MODEL_DIR, 'training_results.json')
    with open(results_path, 'w') as f:
        json.dump(all_results, f, indent=2)

    print(f"\n{'='*60}")
    print(f"  All models trained and saved! ✅")
    print(f"  Results saved to: {results_path}")
    print(f"{'='*60}")

    # Summary
    print(f"\n📊 Summary:")
    for disease, result in all_results.items():
        print(f"  {disease:20s} → Best: {result['best_model']} ({result['best_accuracy']}%)")
