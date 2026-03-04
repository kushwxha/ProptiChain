"""
train_models.py
Trains and evaluates the property valuation (regression) and risk classification (binary) models for ProptiChain.
"""
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import GridSearchCV
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, classification_report
from sklearn.utils.class_weight import compute_class_weight
from preprocess import load_data, build_preprocessing_pipeline, split_data, set_seed

# Set random seed for reproducibility
set_seed(42)

DATA_PATH = 'data.csv'  # Updated to new dataset filename
CATEGORICAL_FEATURES = ['location']
NUMERICAL_FEATURES = [
    'bedrooms', 'bathrooms', 'sqft_living', 'sqft_lot', 'floors',
    'waterfront', 'view', 'condition', 'sqft_above', 'sqft_basement',
    'age', 'renovated'
]
TARGET_REG = 'price'
TARGET_CLF = 'risk_label'

df = load_data(DATA_PATH)
df = load_data(DATA_PATH)

preprocessor = build_preprocessing_pipeline(CATEGORICAL_FEATURES, NUMERICAL_FEATURES)
X = df.drop([TARGET_REG, TARGET_CLF], axis=1)
y_reg = df[TARGET_REG]
y_clf = df[TARGET_CLF]
from sklearn.model_selection import train_test_split
X_train, X_test, y_reg_train, y_reg_test, y_clf_train, y_clf_test = train_test_split(
    X, y_reg, y_clf, test_size=0.2, random_state=42, stratify=y_clf)
preprocessor.fit(X_train)
X_train_proc = preprocessor.transform(X_train)
X_test_proc = preprocessor.transform(X_test)


# === REGRESSION MODEL: Property Valuation (with Hyperparameter Tuning) ===
# === CLASSIFICATION MODEL: Transaction Risk ===
# Handle class imbalance
from sklearn.utils.class_weight import compute_class_weight
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, classification_report
import numpy as np
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
    feature_names = preprocessor.get_feature_names_out()
    plt.figure(figsize=(8, 4))
    plt.barh(feature_names, importances)
    plt.title('Feature Importances (Risk Model)')
    plt.tight_layout()
    plt.savefig('risk_feature_importance.png')
    plt.close()
except Exception as e:
    print(f"Feature importance plot failed: {e}")
print("\n--- Hyperparameter Tuning for Property Valuation Model ---")
param_grid = {
    'n_estimators': [100, 200],
    'max_depth': [None, 10, 20],
    'min_samples_split': [2, 5],
    'min_samples_leaf': [1, 2]
}
grid_search = GridSearchCV(RandomForestRegressor(random_state=42), param_grid, cv=3, scoring='neg_mean_squared_error', n_jobs=-1)
grid_search.fit(X_train_proc, y_reg_train)
reg_model = grid_search.best_estimator_
print(f"Best parameters: {grid_search.best_params_}")

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









print("\nTraining complete. Models saved as 'valuation_model.pkl' and 'risk_model.pkl'.")
