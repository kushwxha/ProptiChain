"""
preprocess.py
Contains data loading, preprocessing, and feature engineering utilities for ProptiChain AI models.
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

# Set random seed for reproducibility
def set_seed(seed=42):
    np.random.seed(seed)

# Example function to load dataset (replace with actual path or data source)
def load_data(csv_path: str) -> pd.DataFrame:
    """
    Load housing dataset from CSV file, engineer features for valuation model.
    - Uses columns: date, price, bedrooms, bathrooms, sqft_living, sqft_lot, floors, waterfront, view, condition, sqft_above, sqft_basement, yr_built, yr_renovated, street, city, statezip, country
    - Engineers: age, renovated, location (city), etc.
    """
    import numpy as np
    import pandas as pd
    from datetime import datetime
    df = pd.read_csv(csv_path)
    # Feature engineering
    current_year = datetime.now().year
    df['age'] = current_year - df['yr_built']
    df['renovated'] = (df['yr_renovated'] > 0).astype(int)
    df['location'] = df['city']
    # Simulate risk_label: 1 if price < median, else 0
    price_median = df['price'].median()
    df['risk_label'] = (df['price'] < price_median).astype(int)
    # Select features for valuation and risk model
    features = [
        'bedrooms', 'bathrooms', 'sqft_living', 'sqft_lot', 'floors',
        'waterfront', 'view', 'condition', 'sqft_above', 'sqft_basement',
        'age', 'renovated', 'location'
    ]
    target_reg = 'price'
    target_clf = 'risk_label'
    df_model = df[features + [target_reg, target_clf]].copy()
    return df_model

# Preprocessing pipeline builder
def build_preprocessing_pipeline(categorical_features, numerical_features):
    """Create a preprocessing pipeline for categorical and numerical features."""
    categorical_transformer = OneHotEncoder(handle_unknown='ignore', sparse=False)
    numerical_transformer = StandardScaler()
    preprocessor = ColumnTransformer([
        ('cat', categorical_transformer, categorical_features),
        ('num', numerical_transformer, numerical_features)
    ])
    return preprocessor

# Split data for regression and classification
def split_data(df: pd.DataFrame, target_reg: str, target_clf: str, test_size=0.2, seed=42):
    """Split data for regression and classification tasks."""
    X = df.drop([target_reg, target_clf], axis=1)
    y_reg = df[target_reg]
    y_clf = df[target_clf]
    X_train, X_test, y_reg_train, y_reg_test, y_clf_train, y_clf_test = train_test_split(
        X, y_reg, y_clf, test_size=test_size, random_state=seed, stratify=y_clf
    )
    return X_train, X_test, y_reg_train, y_reg_test, y_clf_train, y_clf_test
