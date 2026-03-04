"""
train_models.py
Trains and evaluates the property valuation (regression) and risk classification (binary) models for ProptiChain.
"""
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, classification_report
from sklearn.utils.class_weight import compute_class_weight
from preprocess import load_data, build_preprocessing_pipeline, split_data, set_seed

# Set random seed for reproducibility
set_seed(42)

# === CONFIGURATION ===
DATA_PATH = 'F:/ProptiChain/ai_service/housing_data.csv'  # Replace with your dataset path
CATEGORICAL_FEATURES = ['location']
NUMERICAL_FEATURES = ['area', 'bedrooms', 'bathrooms', 'age', 'amenities_score', 'market_trend']
TARGET_REG = 'sale_price'
TARGET_CLF = 'risk_label'

# === LOAD DATA ===
df = load_data(DATA_PATH)

# === PREPROCESSING ===
preprocessor = build_preprocessing_pipeline(CATEGORICAL_FEATURES, NUMERICAL_FEATURES)
X_train, X_test, y_reg_train, y_reg_test, y_clf_train, y_clf_test = split_data(df, TARGET_REG, TARGET_CLF)

# Fit preprocessor on training data only
preprocessor.fit(X_train)
X_train_proc = preprocessor.transform(X_train)
X_test_proc = preprocessor.transform(X_test)

# === REGRESSION MODEL: Property Valuation ===
reg_model = RandomForestRegressor(n_estimators=100, random_state=42)
reg_model.fit(X_train_proc, y_reg_train)

# Predict and evaluate
reg_preds = reg_model.predict(X_test_proc)
rmse = mean_squared_error(y_reg_test, reg_preds, squared=False)
mae = mean_absolute_error(y_reg_test, reg_preds)
r2 = r2_score(y_reg_test, reg_preds)
print("\n--- Property Valuation Model Evaluation ---")
print(f"RMSE: {rmse:.2f}")
print(f"MAE: {mae:.2f}")
print(f"R^2: {r2:.2f}")

# Save regression model and preprocessor
joblib.dump({'model': reg_model, 'preprocessor': preprocessor}, 'valuation_model.pkl')

# Feature importance visualization (Regression)
try:
    importances = reg_model.feature_importances_
    feature_names = preprocessor.get_feature_names_out()
    plt.figure(figsize=(8, 4))
    plt.barh(feature_names, importances)
    plt.title('Feature Importances (Valuation Model)')
    plt.tight_layout()
    plt.savefig('valuation_feature_importance.png')
    plt.close()
except Exception as e:
    print(f"Feature importance plot failed: {e}")



# === CLASSIFICATION MODEL: Transaction Risk ===
# Handle class imbalance
class_weights = compute_class_weight('balanced', classes=np.unique(y_clf_train), y=y_clf_train)
class_weight_dict = {k: v for k, v in zip(np.unique(y_clf_train), class_weights)}
clf_model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight=class_weight_dict)
clf_model.fit(X_train_proc, y_clf_train)

# Predict and evaluate
clf_preds = clf_model.predict(X_test_proc)
clf_probs = clf_model.predict_proba(X_test_proc)[:, 1]
acc = accuracy_score(y_clf_test, clf_preds)
prec = precision_score(y_clf_test, clf_preds)
rec = recall_score(y_clf_test, clf_preds)
f1 = f1_score(y_clf_test, clf_preds)
roc_auc = roc_auc_score(y_clf_test, clf_probs)
print("\n--- Risk Classification Model Evaluation ---")
print(f"Accuracy: {acc:.2f}")
print(f"Precision: {prec:.2f}")
print(f"Recall: {rec:.2f}")
print(f"F1-score: {f1:.2f}")
print(f"ROC-AUC: {roc_auc:.2f}")
print("\nClassification Report:\n", classification_report(y_clf_test, clf_preds))

# Save classification model
joblib.dump({'model': clf_model, 'preprocessor': preprocessor}, 'risk_model.pkl')

# Feature importance visualization (Classification)
try:
    importances = clf_model.feature_importances_
    plt.figure(figsize=(8, 4))
    plt.barh(feature_names, importances)
    plt.title('Feature Importances (Risk Model)')
    plt.tight_layout()
    plt.savefig('risk_feature_importance.png')
    plt.close()
except Exception as e:
    print(f"Feature importance plot failed: {e}")



print("\nTraining complete. Models saved as 'valuation_model.pkl' and 'risk_model.pkl'.")
