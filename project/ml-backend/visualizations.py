"""
Visualization Engine — Seaborn & Matplotlib graphs for Smart Healthcare System.
Generates publication-quality charts for EDA, model evaluation, and data mining.
"""

import os
import sys
import json

# Fix Windows console encoding for unicode characters
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for server use
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import seaborn as sns
from sklearn.metrics import confusion_matrix, roc_curve, auc
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import joblib
import warnings
warnings.filterwarnings('ignore')

# ──────────────────── Configuration ────────────────────
sns.set_theme(style="darkgrid", palette="deep", font_scale=1.1)
plt.rcParams.update({
    'figure.facecolor': '#0f172a',
    'axes.facecolor': '#1e293b',
    'axes.edgecolor': '#334155',
    'axes.labelcolor': '#e2e8f0',
    'text.color': '#e2e8f0',
    'xtick.color': '#94a3b8',
    'ytick.color': '#94a3b8',
    'grid.color': '#334155',
    'grid.alpha': 0.4,
    'figure.dpi': 120,
    'savefig.dpi': 150,
    'savefig.bbox': 'tight',
    'savefig.facecolor': '#0f172a',
    'font.family': 'sans-serif',
    'font.size': 11,
})

# Container-safe path resolution
def get_path(folder_name):
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    if base_dir == '/' or base_dir == '':
        return os.path.join(os.path.dirname(__file__), folder_name)
    return os.path.join(base_dir, folder_name)

DATASET_DIR = get_path('datasets')
MODEL_DIR = get_path('models')
GRAPH_DIR = get_path('graphs')
os.makedirs(GRAPH_DIR, exist_ok=True)

# Premium color palettes
COLORS = {
    'primary': '#6366f1',
    'secondary': '#8b5cf6',
    'accent': '#06b6d4',
    'success': '#22c55e',
    'warning': '#f59e0b',
    'danger': '#ef4444',
    'info': '#3b82f6',
    'gradient': ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'],
    'disease_palette': ['#ef4444', '#f59e0b', '#22c55e'],
    'model_palette': ['#6366f1', '#06b6d4', '#f59e0b', '#ef4444'],
    'heatmap_cmap': 'RdYlBu_r',
}


def _save_fig(fig, name):
    """Save figure to graphs directory."""
    path = os.path.join(GRAPH_DIR, f"{name}.png")
    fig.savefig(path, bbox_inches='tight', pad_inches=0.3)
    plt.close(fig)
    print(f"  📊 Saved: {name}.png")
    return path


# ═══════════════════════════════════════════════════════════════
#  1. DATASET EXPLORATORY DATA ANALYSIS (EDA)
# ═══════════════════════════════════════════════════════════════

def plot_dataset_distributions():
    """Plot feature distributions for all three datasets."""
    print("\n📈 Generating Dataset Distribution Plots...")

    # ── Heart Disease Distributions ──
    df = pd.read_csv(os.path.join(DATASET_DIR, 'heart_disease.csv'))
    fig, axes = plt.subplots(3, 4, figsize=(20, 14))
    fig.suptitle('Heart Disease Dataset — Feature Distributions', fontsize=18, fontweight='bold', color='#a78bfa', y=0.98)

    numeric_cols = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']
    categorical_cols = ['sex', 'cp', 'fbs', 'restecg', 'exang', 'slope', 'ca']

    for idx, col in enumerate(numeric_cols):
        ax = axes[idx // 4][idx % 4]
        for target_val, color, label in [(0, '#22c55e', 'No Disease'), (1, '#ef4444', 'Disease')]:
            subset = df[df['target'] == target_val][col]
            ax.hist(subset, bins=25, alpha=0.6, color=color, label=label, edgecolor='none')
        ax.set_title(col.upper(), fontweight='bold', fontsize=11)
        ax.legend(fontsize=8, framealpha=0.3)

    for idx, col in enumerate(categorical_cols):
        ax = axes[(idx + len(numeric_cols)) // 4][(idx + len(numeric_cols)) % 4]
        ct = pd.crosstab(df[col], df['target'])
        ct.plot.bar(ax=ax, color=['#22c55e', '#ef4444'], edgecolor='none', alpha=0.85)
        ax.set_title(col.upper(), fontweight='bold', fontsize=11)
        ax.legend(['No Disease', 'Disease'], fontsize=7, framealpha=0.3)
        ax.set_xlabel('')

    # Hide unused subplot
    axes[2][3].set_visible(False)
    fig.tight_layout(rect=[0, 0, 1, 0.95])
    _save_fig(fig, '01_heart_distributions')

    # ── Diabetes Distributions ──
    df_d = pd.read_csv(os.path.join(DATASET_DIR, 'diabetes.csv'))
    fig, axes = plt.subplots(2, 4, figsize=(20, 10))
    fig.suptitle('Diabetes Dataset — Feature Distributions', fontsize=18, fontweight='bold', color='#a78bfa', y=0.98)

    for idx, col in enumerate(df_d.columns[:-1]):
        ax = axes[idx // 4][idx % 4]
        for outcome, color, label in [(0, '#06b6d4', 'No Diabetes'), (1, '#f59e0b', 'Diabetes')]:
            subset = df_d[df_d['Outcome'] == outcome][col]
            ax.hist(subset, bins=25, alpha=0.6, color=color, label=label, edgecolor='none')
        ax.set_title(col, fontweight='bold', fontsize=11)
        ax.legend(fontsize=8, framealpha=0.3)

    fig.tight_layout(rect=[0, 0, 1, 0.95])
    _save_fig(fig, '02_diabetes_distributions')

    # ── Kidney Disease Distributions ──
    df_k = pd.read_csv(os.path.join(DATASET_DIR, 'kidney_disease.csv'))
    top_features = ['age', 'bp', 'bgr', 'bu', 'sc', 'hemo', 'pcv', 'wc', 'rc', 'sod', 'pot', 'sg']
    fig, axes = plt.subplots(3, 4, figsize=(20, 14))
    fig.suptitle('Kidney Disease Dataset — Feature Distributions', fontsize=18, fontweight='bold', color='#a78bfa', y=0.98)

    for idx, col in enumerate(top_features):
        ax = axes[idx // 4][idx % 4]
        for cls, color, label in [(0, '#3b82f6', 'No CKD'), (1, '#ef4444', 'CKD')]:
            subset = df_k[df_k['classification'] == cls][col]
            ax.hist(subset, bins=25, alpha=0.6, color=color, label=label, edgecolor='none')
        ax.set_title(col.upper(), fontweight='bold', fontsize=11)
        ax.legend(fontsize=8, framealpha=0.3)

    fig.tight_layout(rect=[0, 0, 1, 0.95])
    _save_fig(fig, '03_kidney_distributions')


def plot_target_balance():
    """Plot target variable distribution across all datasets."""
    print("  📊 Generating Target Balance Plot...")
    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    fig.suptitle('Disease Class Distribution Across Datasets', fontsize=18, fontweight='bold', color='#a78bfa', y=1.02)

    datasets = [
        ('Heart Disease', 'heart_disease.csv', 'target', ['No Disease', 'Disease'], ['#22c55e', '#ef4444']),
        ('Diabetes', 'diabetes.csv', 'Outcome', ['No Diabetes', 'Diabetes'], ['#06b6d4', '#f59e0b']),
        ('Kidney Disease', 'kidney_disease.csv', 'classification', ['No CKD', 'CKD'], ['#3b82f6', '#ef4444']),
    ]

    for ax, (title, file, target, labels, colors) in zip(axes, datasets):
        df = pd.read_csv(os.path.join(DATASET_DIR, file))
        counts = df[target].value_counts().sort_index()
        wedges, texts, autotexts = ax.pie(
            counts, labels=labels, colors=colors, autopct='%1.1f%%',
            startangle=90, pctdistance=0.75, explode=(0.03, 0.03),
            textprops={'fontsize': 12, 'color': '#e2e8f0'},
            wedgeprops={'edgecolor': '#0f172a', 'linewidth': 2}
        )
        for autotext in autotexts:
            autotext.set_fontweight('bold')
        centre_circle = plt.Circle((0, 0), 0.55, fc='#1e293b')
        ax.add_artist(centre_circle)
        ax.set_title(title, fontsize=14, fontweight='bold', pad=15)
        ax.text(0, 0, f'n={len(df)}', ha='center', va='center', fontsize=13, fontweight='bold', color='#a78bfa')

    fig.tight_layout()
    _save_fig(fig, '04_target_balance')


def plot_correlation_heatmaps():
    """Plot correlation heatmaps for all datasets."""
    print("  📊 Generating Correlation Heatmaps...")

    datasets = [
        ('Heart Disease Correlation Matrix', 'heart_disease.csv'),
        ('Diabetes Correlation Matrix', 'diabetes.csv'),
        ('Kidney Disease Correlation Matrix', 'kidney_disease.csv'),
    ]

    for idx, (title, file) in enumerate(datasets):
        df = pd.read_csv(os.path.join(DATASET_DIR, file))
        corr = df.corr()

        fig, ax = plt.subplots(figsize=(14, 11))
        mask = np.triu(np.ones_like(corr, dtype=bool), k=1)

        sns.heatmap(
            corr, mask=mask, annot=True, fmt='.2f', cmap='RdYlBu_r',
            vmin=-1, vmax=1, center=0, ax=ax,
            square=True, linewidths=0.5, linecolor='#334155',
            cbar_kws={'shrink': 0.8, 'label': 'Correlation Coefficient'},
            annot_kws={'size': 8, 'color': '#0f172a', 'fontweight': 'bold'}
        )
        ax.set_title(title, fontsize=16, fontweight='bold', color='#a78bfa', pad=20)
        ax.tick_params(axis='both', labelsize=9)

        fig.tight_layout()
        _save_fig(fig, f'05_correlation_{file.replace(".csv", "")}')


def plot_box_plots():
    """Plot box plots to show feature spread and outliers."""
    print("  📊 Generating Box Plots...")

    # Heart Disease
    df = pd.read_csv(os.path.join(DATASET_DIR, 'heart_disease.csv'))
    fig, axes = plt.subplots(1, 5, figsize=(22, 6))
    fig.suptitle('Heart Disease — Feature Box Plots by Outcome', fontsize=16, fontweight='bold', color='#a78bfa', y=1.02)

    for ax, col in zip(axes, ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']):
        sns.boxplot(x='target', y=col, data=df, ax=ax, palette=['#22c55e', '#ef4444'],
                    flierprops={'marker': 'o', 'markerfacecolor': '#f59e0b', 'markersize': 4, 'alpha': 0.5},
                    boxprops={'alpha': 0.8}, medianprops={'color': '#e2e8f0', 'linewidth': 2})
        ax.set_xticklabels(['Healthy', 'Disease'])
        ax.set_xlabel('')
        ax.set_title(col.upper(), fontweight='bold')

    fig.tight_layout()
    _save_fig(fig, '06_heart_boxplots')

    # Diabetes
    df_d = pd.read_csv(os.path.join(DATASET_DIR, 'diabetes.csv'))
    fig, axes = plt.subplots(2, 4, figsize=(22, 10))
    fig.suptitle('Diabetes — Feature Box Plots by Outcome', fontsize=16, fontweight='bold', color='#a78bfa', y=1.0)

    for idx, col in enumerate(df_d.columns[:-1]):
        ax = axes[idx // 4][idx % 4]
        sns.boxplot(x='Outcome', y=col, data=df_d, ax=ax, palette=['#06b6d4', '#f59e0b'],
                    flierprops={'marker': 'o', 'markerfacecolor': '#ef4444', 'markersize': 4, 'alpha': 0.5},
                    boxprops={'alpha': 0.8}, medianprops={'color': '#e2e8f0', 'linewidth': 2})
        ax.set_xticklabels(['Healthy', 'Diabetic'])
        ax.set_xlabel('')
        ax.set_title(col, fontweight='bold')

    fig.tight_layout()
    _save_fig(fig, '07_diabetes_boxplots')


def plot_pairplots():
    """Plot pairplots for key features."""
    print("  📊 Generating Pair Plots...")

    # Heart Disease — key features
    df = pd.read_csv(os.path.join(DATASET_DIR, 'heart_disease.csv'))
    df_sub = df[['age', 'trestbps', 'chol', 'thalach', 'oldpeak', 'target']].copy()
    df_sub['target'] = df_sub['target'].map({0: 'Healthy', 1: 'Disease'})

    with sns.axes_style("darkgrid"):
        g = sns.pairplot(df_sub, hue='target', palette={'Healthy': '#22c55e', 'Disease': '#ef4444'},
                         diag_kind='kde', plot_kws={'alpha': 0.4, 's': 20, 'edgecolor': 'none'},
                         diag_kws={'alpha': 0.6, 'linewidth': 2})
        g.figure.suptitle('Heart Disease — Feature Pair Plots', fontsize=16,
                          fontweight='bold', color='#a78bfa', y=1.02)
        g.figure.set_facecolor('#0f172a')
        for ax_row in g.axes:
            for ax in ax_row:
                ax.set_facecolor('#1e293b')
        _save_fig(g.figure, '08_heart_pairplot')


# ═══════════════════════════════════════════════════════════════
#  2. MODEL EVALUATION GRAPHS
# ═══════════════════════════════════════════════════════════════

def plot_model_comparison():
    """Plot model accuracy comparison across all diseases."""
    print("\n📈 Generating Model Comparison Plots...")

    results_path = os.path.join(MODEL_DIR, 'training_results.json')
    if not os.path.exists(results_path):
        print("  ⚠️ No training results found. Train models first.")
        return

    with open(results_path, 'r') as f:
        results = json.load(f)

    diseases = list(results.keys())
    models_list = ['Logistic Regression', 'Random Forest', 'Decision Tree', 'SVM']

    # ── Grouped Bar Chart: Accuracy Comparison ──
    fig, ax = plt.subplots(figsize=(14, 7))
    x = np.arange(len(diseases))
    width = 0.18
    colors = COLORS['model_palette']

    for i, model in enumerate(models_list):
        accuracies = [results[d]['all_results'].get(model, {}).get('accuracy', 0) for d in diseases]
        bars = ax.bar(x + i * width, accuracies, width, label=model, color=colors[i],
                      alpha=0.9, edgecolor='none', zorder=3)
        for bar, acc in zip(bars, accuracies):
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.5,
                    f'{acc:.1f}%', ha='center', va='bottom', fontsize=9, fontweight='bold', color=colors[i])

    ax.set_xlabel('Disease', fontsize=13, fontweight='bold')
    ax.set_ylabel('Accuracy (%)', fontsize=13, fontweight='bold')
    ax.set_title('Model Accuracy Comparison Across Diseases', fontsize=16, fontweight='bold', color='#a78bfa', pad=15)
    ax.set_xticks(x + width * 1.5)
    ax.set_xticklabels([d.replace('_', ' ').title() for d in diseases], fontsize=12)
    ax.legend(loc='upper right', framealpha=0.3, fontsize=10)
    ax.set_ylim(0, 100)
    ax.axhline(y=70, color='#f59e0b', linestyle='--', alpha=0.4, label='70% baseline')

    fig.tight_layout()
    _save_fig(fig, '09_model_accuracy_comparison')

    # ── Multi-Metric Radar / Grouped Bars per Disease ──
    metrics = ['accuracy', 'precision', 'recall', 'f1_score']
    metric_labels = ['Accuracy', 'Precision', 'Recall', 'F1-Score']

    fig, axes = plt.subplots(1, 3, figsize=(22, 7))
    fig.suptitle('Detailed Model Metrics by Disease', fontsize=18, fontweight='bold', color='#a78bfa', y=1.03)

    for ax, disease in zip(axes, diseases):
        x = np.arange(len(metrics))
        width = 0.18

        for i, model in enumerate(models_list):
            vals = [results[disease]['all_results'].get(model, {}).get(m, 0) for m in metrics]
            ax.bar(x + i * width, vals, width, label=model, color=colors[i], alpha=0.85, edgecolor='none')

        ax.set_title(disease.replace('_', ' ').title(), fontsize=14, fontweight='bold')
        ax.set_xticks(x + width * 1.5)
        ax.set_xticklabels(metric_labels, fontsize=10)
        ax.set_ylim(0, 100)
        ax.set_ylabel('Score (%)')
        if ax == axes[0]:
            ax.legend(fontsize=8, framealpha=0.3)

    fig.tight_layout()
    _save_fig(fig, '10_model_metrics_detailed')


def plot_confusion_matrices():
    """Plot confusion matrices for all models and diseases."""
    print("  📊 Generating Confusion Matrices...")

    results_path = os.path.join(MODEL_DIR, 'training_results.json')
    with open(results_path, 'r') as f:
        results = json.load(f)

    diseases = list(results.keys())
    models_list = ['Logistic Regression', 'Random Forest', 'Decision Tree', 'SVM']

    for disease in diseases:
        fig, axes = plt.subplots(1, 4, figsize=(22, 5))
        fig.suptitle(f'{disease.replace("_", " ").title()} — Confusion Matrices',
                     fontsize=16, fontweight='bold', color='#a78bfa', y=1.05)

        for ax, model in zip(axes, models_list):
            cm = np.array(results[disease]['all_results'][model]['confusion_matrix'])
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax,
                        xticklabels=['Predicted\nNegative', 'Predicted\nPositive'],
                        yticklabels=['Actual\nNegative', 'Actual\nPositive'],
                        linewidths=2, linecolor='#334155',
                        annot_kws={'size': 16, 'fontweight': 'bold'},
                        cbar=False)
            acc = results[disease]['all_results'][model]['accuracy']
            is_best = model == results[disease]['best_model']
            title_color = '#22c55e' if is_best else '#e2e8f0'
            star = ' ⭐' if is_best else ''
            ax.set_title(f'{model}{star}\n({acc}%)', fontsize=11, fontweight='bold', color=title_color)

        fig.tight_layout()
        _save_fig(fig, f'11_confusion_{disease}')


def plot_feature_importance():
    """Plot feature importance for all diseases."""
    print("  📊 Generating Feature Importance Plots...")

    results_path = os.path.join(MODEL_DIR, 'training_results.json')
    with open(results_path, 'r') as f:
        results = json.load(f)

    diseases = list(results.keys())

    fig, axes = plt.subplots(1, 3, figsize=(24, 8))
    fig.suptitle('Feature Importance by Disease (Best Model)', fontsize=18, fontweight='bold', color='#a78bfa', y=1.02)

    gradient_colors = ['#6366f1', '#8b5cf6', '#a78bfa', '#06b6d4', '#22d3ee', '#22c55e', '#f59e0b', '#ef4444']

    for ax, disease in zip(axes, diseases):
        features = results[disease].get('features', [])
        importance = results[disease].get('feature_importance', [])

        if not importance:
            ax.text(0.5, 0.5, 'Not available', ha='center', va='center', transform=ax.transAxes, fontsize=14)
            continue

        # Sort by importance
        sorted_pairs = sorted(zip(features, importance), key=lambda x: x[1], reverse=True)
        features_sorted, importance_sorted = zip(*sorted_pairs)

        # Color gradient based on importance
        norm = plt.Normalize(min(importance_sorted), max(importance_sorted))
        colormap = plt.cm.cool
        bar_colors = [colormap(norm(v)) for v in importance_sorted]

        bars = ax.barh(range(len(features_sorted)), importance_sorted, color=bar_colors,
                       edgecolor='none', alpha=0.9, height=0.7)

        ax.set_yticks(range(len(features_sorted)))
        ax.set_yticklabels(features_sorted, fontsize=9)
        ax.invert_yaxis()
        ax.set_xlabel('Importance Score', fontweight='bold')
        best_model = results[disease]['best_model']
        ax.set_title(f'{disease.replace("_", " ").title()}\n({best_model})', fontsize=13, fontweight='bold')

        # Value labels
        for bar, val in zip(bars, importance_sorted):
            ax.text(bar.get_width() + 0.005, bar.get_y() + bar.get_height() / 2,
                    f'{val:.3f}', va='center', fontsize=8, fontweight='bold', color='#94a3b8')

    fig.tight_layout()
    _save_fig(fig, '12_feature_importance')


def plot_roc_curves():
    """Plot ROC curves for all models and diseases."""
    print("  📊 Generating ROC Curves...")

    dataset_info = {
        'heart_disease': ('heart_disease.csv', 'target'),
        'diabetes': ('diabetes.csv', 'Outcome'),
        'kidney_disease': ('kidney_disease.csv', 'classification'),
    }

    fig, axes = plt.subplots(1, 3, figsize=(22, 7))
    fig.suptitle('ROC Curves — All Models vs All Diseases', fontsize=18, fontweight='bold', color='#a78bfa', y=1.02)

    colors = COLORS['model_palette']

    for ax, (disease, (file, target)) in zip(axes, dataset_info.items()):
        df = pd.read_csv(os.path.join(DATASET_DIR, file))
        X = df.drop(target, axis=1)
        y = df[target]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        from sklearn.linear_model import LogisticRegression
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.tree import DecisionTreeClassifier
        from sklearn.svm import SVC
        from sklearn.pipeline import Pipeline

        model_defs = {
            'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
            'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'Decision Tree': DecisionTreeClassifier(random_state=42),
            'SVM': SVC(kernel='rbf', probability=True, random_state=42),
        }

        for i, (name, algo) in enumerate(model_defs.items()):
            pipeline = Pipeline([('scaler', StandardScaler()), ('clf', algo)])
            pipeline.fit(X_train, y_train)
            y_prob = pipeline.predict_proba(X_test)[:, 1]
            fpr, tpr, _ = roc_curve(y_test, y_prob)
            roc_auc = auc(fpr, tpr)
            ax.plot(fpr, tpr, color=colors[i], lw=2.5, alpha=0.9,
                    label=f'{name} (AUC={roc_auc:.3f})')

        ax.plot([0, 1], [0, 1], 'w--', alpha=0.3, lw=1)
        ax.set_xlabel('False Positive Rate', fontweight='bold')
        ax.set_ylabel('True Positive Rate', fontweight='bold')
        ax.set_title(disease.replace('_', ' ').title(), fontsize=14, fontweight='bold')
        ax.legend(loc='lower right', fontsize=9, framealpha=0.3)
        ax.set_xlim([0, 1])
        ax.set_ylim([0, 1.05])

    fig.tight_layout()
    _save_fig(fig, '13_roc_curves')


# ═══════════════════════════════════════════════════════════════
#  3. DATA MINING VISUALIZATIONS
# ═══════════════════════════════════════════════════════════════

def plot_clustering():
    """Plot K-Means clustering visualization."""
    print("\n📈 Generating Clustering Plots...")

    df = pd.read_csv(os.path.join(DATASET_DIR, 'heart_disease.csv'))
    features = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']
    X = df[features].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X_scaled)

    # Determine risk labels
    cluster_disease_rate = []
    for i in range(3):
        rate = df[clusters == i]['target'].mean()
        cluster_disease_rate.append((i, rate))
    cluster_disease_rate.sort(key=lambda x: x[1], reverse=True)
    label_map = {cluster_disease_rate[0][0]: 'High Risk',
                 cluster_disease_rate[1][0]: 'Medium Risk',
                 cluster_disease_rate[2][0]: 'Low Risk'}
    color_map = {'High Risk': '#ef4444', 'Medium Risk': '#f59e0b', 'Low Risk': '#22c55e'}

    labels = [label_map[c] for c in clusters]
    colors_list = [color_map[l] for l in labels]

    # ── 2x2 Scatter plot grid ──
    fig, axes = plt.subplots(2, 2, figsize=(16, 14))
    fig.suptitle('K-Means Patient Clustering — Risk Segmentation', fontsize=18,
                 fontweight='bold', color='#a78bfa', y=1.0)

    pairs = [('age', 'chol'), ('age', 'thalach'), ('trestbps', 'chol'), ('trestbps', 'thalach')]
    pair_labels = [('Age', 'Cholesterol'), ('Age', 'Max Heart Rate'),
                   ('Resting BP', 'Cholesterol'), ('Resting BP', 'Max Heart Rate')]

    for ax, (f1, f2), (l1, l2) in zip(axes.flat, pairs, pair_labels):
        for risk_label, color in color_map.items():
            mask = [l == risk_label for l in labels]
            ax.scatter(df[f1][mask], df[f2][mask], c=color, label=risk_label,
                       alpha=0.55, s=30, edgecolors='none')
        ax.set_xlabel(l1, fontweight='bold')
        ax.set_ylabel(l2, fontweight='bold')
        ax.legend(fontsize=9, framealpha=0.3)

    fig.tight_layout()
    _save_fig(fig, '14_kmeans_clustering')

    # ── Cluster Statistics ──
    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    fig.suptitle('Cluster Demographics & Statistics', fontsize=16, fontweight='bold', color='#a78bfa', y=1.04)

    for idx, (cluster_id, rate) in enumerate(cluster_disease_rate):
        ax = axes[idx]
        mask = clusters == cluster_id
        cluster_df = df[mask]
        risk_label = label_map[cluster_id]
        color = color_map[risk_label]

        stats = cluster_df[features].mean()
        bars = ax.barh(features, stats.values, color=color, alpha=0.8, edgecolor='none', height=0.5)
        ax.set_title(f'{risk_label}\n(n={mask.sum()}, disease rate={rate:.0%})',
                     fontsize=12, fontweight='bold', color=color)
        ax.set_xlabel('Mean Value', fontweight='bold')

        for bar, val in zip(bars, stats.values):
            ax.text(bar.get_width() + 1, bar.get_y() + bar.get_height() / 2,
                    f'{val:.1f}', va='center', fontsize=9, fontweight='bold', color='#94a3b8')

    fig.tight_layout()
    _save_fig(fig, '15_cluster_statistics')


def plot_elbow_curve():
    """Plot elbow curve for optimal K selection."""
    print("  📊 Generating Elbow Curve...")

    df = pd.read_csv(os.path.join(DATASET_DIR, 'heart_disease.csv'))
    features = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']
    X = StandardScaler().fit_transform(df[features].values)

    inertias = []
    K_range = range(2, 11)
    for k in K_range:
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        km.fit(X)
        inertias.append(km.inertia_)

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.plot(K_range, inertias, 'o-', color='#6366f1', linewidth=2.5, markersize=10,
            markeredgecolor='#a78bfa', markerfacecolor='#a78bfa', markeredgewidth=2)
    ax.axvline(x=3, color='#ef4444', linestyle='--', alpha=0.6, label='Selected K=3')
    ax.fill_between(K_range, inertias, alpha=0.1, color='#6366f1')
    ax.set_xlabel('Number of Clusters (K)', fontsize=13, fontweight='bold')
    ax.set_ylabel('Inertia (Within-Cluster Sum of Squares)', fontsize=13, fontweight='bold')
    ax.set_title('Elbow Curve — Optimal K Selection', fontsize=16, fontweight='bold', color='#a78bfa')
    ax.legend(fontsize=11, framealpha=0.3)

    fig.tight_layout()
    _save_fig(fig, '16_elbow_curve')


def plot_correlation_with_target():
    """Plot bar chart of feature correlations with target variable."""
    print("  📊 Generating Target Correlation Plots...")

    fig, axes = plt.subplots(1, 3, figsize=(24, 8))
    fig.suptitle('Feature Correlations with Disease Outcome', fontsize=18,
                 fontweight='bold', color='#a78bfa', y=1.02)

    datasets = [
        ('Heart Disease', 'heart_disease.csv', 'target'),
        ('Diabetes', 'diabetes.csv', 'Outcome'),
        ('Kidney Disease', 'kidney_disease.csv', 'classification'),
    ]

    for ax, (title, file, target) in zip(axes, datasets):
        df = pd.read_csv(os.path.join(DATASET_DIR, file))
        corr = df.corr()[target].drop(target).sort_values()

        colors = ['#ef4444' if v < 0 else '#22c55e' for v in corr.values]
        bars = ax.barh(corr.index, corr.values, color=colors, edgecolor='none', alpha=0.85, height=0.6)
        ax.axvline(x=0, color='#94a3b8', linestyle='-', linewidth=0.5)
        ax.set_title(title, fontsize=14, fontweight='bold')
        ax.set_xlabel('Correlation Coefficient', fontweight='bold')

        for bar, val in zip(bars, corr.values):
            x_pos = bar.get_width() + (0.01 if val >= 0 else -0.01)
            ha = 'left' if val >= 0 else 'right'
            ax.text(x_pos, bar.get_y() + bar.get_height() / 2,
                    f'{val:.3f}', va='center', ha=ha, fontsize=8, fontweight='bold', color='#94a3b8')

    fig.tight_layout()
    _save_fig(fig, '17_target_correlations')


# ═══════════════════════════════════════════════════════════════
#  4. VIOLIN & KDE DENSITY PLOTS
# ═══════════════════════════════════════════════════════════════

def plot_violin_plots():
    """Plot violin plots for key features."""
    print("  📊 Generating Violin Plots...")

    df = pd.read_csv(os.path.join(DATASET_DIR, 'heart_disease.csv'))
    fig, axes = plt.subplots(1, 5, figsize=(24, 6))
    fig.suptitle('Heart Disease — Violin Plots', fontsize=16, fontweight='bold', color='#a78bfa', y=1.03)

    for ax, col in zip(axes, ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']):
        sns.violinplot(x='target', y=col, data=df, ax=ax, palette=['#22c55e', '#ef4444'],
                       inner='box', linewidth=1, alpha=0.8)
        ax.set_xticklabels(['Healthy', 'Disease'])
        ax.set_xlabel('')
        ax.set_title(col.upper(), fontweight='bold')

    fig.tight_layout()
    _save_fig(fig, '18_heart_violin')

    # Diabetes violin
    df_d = pd.read_csv(os.path.join(DATASET_DIR, 'diabetes.csv'))
    fig, axes = plt.subplots(2, 4, figsize=(22, 10))
    fig.suptitle('Diabetes — Violin Plots', fontsize=16, fontweight='bold', color='#a78bfa', y=1.0)

    for idx, col in enumerate(df_d.columns[:-1]):
        ax = axes[idx // 4][idx % 4]
        sns.violinplot(x='Outcome', y=col, data=df_d, ax=ax, palette=['#06b6d4', '#f59e0b'],
                       inner='box', linewidth=1, alpha=0.8)
        ax.set_xticklabels(['Healthy', 'Diabetic'])
        ax.set_xlabel('')
        ax.set_title(col, fontweight='bold')

    fig.tight_layout()
    _save_fig(fig, '19_diabetes_violin')


def plot_kde_density():
    """Plot KDE density overlays for important features."""
    print("  📊 Generating KDE Density Plots...")

    df = pd.read_csv(os.path.join(DATASET_DIR, 'heart_disease.csv'))
    fig, axes = plt.subplots(2, 3, figsize=(18, 10))
    fig.suptitle('Heart Disease — KDE Density Overlays', fontsize=16,
                 fontweight='bold', color='#a78bfa', y=1.02)

    for ax, col in zip(axes.flat[:5], ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']):
        for target, color, label in [(0, '#22c55e', 'Healthy'), (1, '#ef4444', 'Disease')]:
            subset = df[df['target'] == target][col]
            sns.kdeplot(subset, ax=ax, color=color, fill=True, alpha=0.3, linewidth=2, label=label)
        ax.set_title(col.upper(), fontweight='bold')
        ax.legend(fontsize=9, framealpha=0.3)

    axes[1][2].set_visible(False)
    fig.tight_layout()
    _save_fig(fig, '20_heart_kde_density')


# ═══════════════════════════════════════════════════════════════
#  5. SUMMARY DASHBOARD
# ═══════════════════════════════════════════════════════════════

def plot_summary_dashboard():
    """Generate a comprehensive summary dashboard."""
    print("\n📈 Generating Summary Dashboard...")

    results_path = os.path.join(MODEL_DIR, 'training_results.json')
    with open(results_path, 'r') as f:
        results = json.load(f)

    fig = plt.figure(figsize=(24, 16))
    gs = gridspec.GridSpec(3, 4, hspace=0.4, wspace=0.35)
    fig.suptitle('Smart Healthcare System — Analytics Dashboard',
                 fontsize=22, fontweight='bold', color='#a78bfa', y=0.98)

    # ── Panel 1: Best Model Accuracies ──
    ax1 = fig.add_subplot(gs[0, 0:2])
    diseases = list(results.keys())
    best_accs = [results[d]['best_accuracy'] for d in diseases]
    best_models = [results[d]['best_model'] for d in diseases]
    colors_bar = ['#ef4444', '#f59e0b', '#3b82f6']

    bars = ax1.bar([d.replace('_', ' ').title() for d in diseases], best_accs,
                   color=colors_bar, alpha=0.85, edgecolor='none', width=0.5)
    for bar, acc, model in zip(bars, best_accs, best_models):
        ax1.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 1,
                 f'{acc}%\n({model})', ha='center', va='bottom', fontsize=10, fontweight='bold')
    ax1.set_ylabel('Accuracy (%)', fontweight='bold')
    ax1.set_title('Best Model Accuracy per Disease', fontweight='bold', fontsize=13)
    ax1.set_ylim(0, 100)

    # ── Panel 2: Dataset Sizes ──
    ax2 = fig.add_subplot(gs[0, 2:4])
    sizes = []
    labels = []
    for file, name in [('heart_disease.csv', 'Heart Disease'),
                       ('diabetes.csv', 'Diabetes'),
                       ('kidney_disease.csv', 'Kidney Disease')]:
        df = pd.read_csv(os.path.join(DATASET_DIR, file))
        sizes.append(len(df))
        labels.append(name)

    ax2.pie(sizes, labels=labels, colors=colors_bar, autopct='%1.1f%%',
            startangle=90, textprops={'fontsize': 11, 'color': '#e2e8f0'},
            wedgeprops={'edgecolor': '#0f172a', 'linewidth': 2})
    ax2.set_title('Dataset Size Distribution', fontweight='bold', fontsize=13)

    # ── Panel 3-5: Feature Importance (Top 5) ──
    for col_idx, disease in enumerate(diseases):
        ax = fig.add_subplot(gs[1, col_idx])
        feats = results[disease].get('features', [])
        imps = results[disease].get('feature_importance', [])
        if feats and imps:
            pairs = sorted(zip(feats, imps), key=lambda x: x[1], reverse=True)[:5]
            f_names, f_vals = zip(*pairs)
            ax.barh(f_names, f_vals, color=colors_bar[col_idx], alpha=0.8, edgecolor='none')
            ax.invert_yaxis()
        ax.set_title(f'{disease.replace("_", " ").title()}\nTop 5 Features', fontweight='bold', fontsize=11)

    # ── Panel 4: Algorithm Performance Heatmap ──
    ax_heat = fig.add_subplot(gs[1, 3])
    models_list = ['Logistic Regression', 'Random Forest', 'Decision Tree', 'SVM']
    heat_data = []
    for d in diseases:
        row = [results[d]['all_results'][m]['accuracy'] for m in models_list]
        heat_data.append(row)

    sns.heatmap(np.array(heat_data), annot=True, fmt='.1f', cmap='YlOrRd',
                xticklabels=['LR', 'RF', 'DT', 'SVM'],
                yticklabels=[d.replace('_', ' ').title()[:10] for d in diseases],
                ax=ax_heat, linewidths=2, linecolor='#334155',
                annot_kws={'fontsize': 12, 'fontweight': 'bold'})
    ax_heat.set_title('Accuracy Heatmap', fontweight='bold', fontsize=11)

    # ── Panel 5: Correlation highlight ──
    ax_corr = fig.add_subplot(gs[2, 0:2])
    df_h = pd.read_csv(os.path.join(DATASET_DIR, 'heart_disease.csv'))
    corr = df_h.corr()['target'].drop('target').sort_values()
    bar_colors = ['#ef4444' if v < 0 else '#22c55e' for v in corr.values]
    ax_corr.barh(corr.index, corr.values, color=bar_colors, alpha=0.8, edgecolor='none')
    ax_corr.axvline(0, color='#94a3b8', linewidth=0.5)
    ax_corr.set_title('Heart Disease Feature Correlations', fontweight='bold', fontsize=13)

    # ── Panel 6: Metric comparison heatmap ──
    ax_m = fig.add_subplot(gs[2, 2:4])
    metric_names = ['accuracy', 'precision', 'recall', 'f1_score']
    metric_display = ['Accuracy', 'Precision', 'Recall', 'F1']
    best_data = []
    for d in diseases:
        best_model = results[d]['best_model']
        row = [results[d]['all_results'][best_model][m] for m in metric_names]
        best_data.append(row)

    sns.heatmap(np.array(best_data), annot=True, fmt='.1f', cmap='RdYlGn',
                xticklabels=metric_display,
                yticklabels=[d.replace('_', ' ').title() for d in diseases],
                ax=ax_m, linewidths=2, linecolor='#334155',
                annot_kws={'fontsize': 12, 'fontweight': 'bold'},
                vmin=50, vmax=100)
    ax_m.set_title('Best Model Metrics Summary', fontweight='bold', fontsize=13)

    _save_fig(fig, '21_summary_dashboard')


# ═══════════════════════════════════════════════════════════════
#  MAIN — Generate All Graphs
# ═══════════════════════════════════════════════════════════════

def generate_all_graphs():
    """Generate all visualization graphs."""
    print("\n" + "=" * 65)
    print("  🎨 Smart Healthcare — Generating All Visualizations")
    print("=" * 65)

    # 1. EDA
    plot_dataset_distributions()
    plot_target_balance()
    plot_correlation_heatmaps()
    plot_box_plots()
    plot_pairplots()
    plot_violin_plots()
    plot_kde_density()
    plot_correlation_with_target()

    # 2. Model Evaluation
    plot_model_comparison()
    plot_confusion_matrices()
    plot_feature_importance()
    plot_roc_curves()

    # 3. Data Mining
    plot_clustering()
    plot_elbow_curve()

    # 4. Dashboard
    plot_summary_dashboard()

    print("\n" + "=" * 65)
    print(f"  ✅ All graphs saved to: {os.path.abspath(GRAPH_DIR)}")
    print(f"  📊 Total graphs generated: {len(os.listdir(GRAPH_DIR))}")
    print("=" * 65)
    return GRAPH_DIR


if __name__ == '__main__':
    generate_all_graphs()
