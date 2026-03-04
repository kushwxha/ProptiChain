"""
app.py
FastAPI app for serving property valuation and risk prediction for ProptiChain.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, validator
import joblib
import numpy as np
from typing import List

# Load models and preprocessors (ensure deterministic output)
valuation_bundle = joblib.load('valuation_model.pkl')
risk_bundle = joblib.load('risk_model.pkl')
valuation_model = valuation_bundle['model']
risk_model = risk_bundle['model']
preprocessor = valuation_bundle['preprocessor']  # Same for both

app = FastAPI(title="ProptiChain AI Service")

# Input schema using Pydantic
class PropertyInput(BaseModel):
    bedrooms: int = Field(..., ge=0, le=20)
    bathrooms: int = Field(..., ge=0, le=20)
    sqft_living: float = Field(..., gt=0, description="Living area in square feet")
    sqft_lot: float = Field(..., gt=0, description="Lot area in square feet")
    floors: float = Field(..., gt=0, description="Number of floors")
    waterfront: int = Field(..., ge=0, le=1, description="Waterfront (0/1)")
    view: int = Field(..., ge=0, le=4, description="View rating (0-4)")
    condition: int = Field(..., ge=1, le=5, description="Condition rating (1-5)")
    sqft_above: float = Field(..., ge=0, description="Sqft above ground")
    sqft_basement: float = Field(..., ge=0, description="Sqft basement")
    age: int = Field(..., ge=0, description="Property age")
    renovated: int = Field(..., ge=0, le=1, description="Renovated (0/1)")
    location: str = Field(..., description="City name")

    @validator('location')
    def location_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Location must not be empty')
        return v

# Output schema
class PredictionOutput(BaseModel):
    predicted_price: float
    risk_score: float
    risk_label: str
    confidence_interval: List[float]

# Helper for confidence interval (simple percentile-based for demo)
def get_confidence_interval(preds, alpha=0.05):
    lower = np.percentile(preds, 100 * alpha / 2)
    upper = np.percentile(preds, 100 * (1 - alpha / 2))
    return [round(lower, 2), round(upper, 2)]

@app.post("/predict", response_model=PredictionOutput)
def predict(input: PropertyInput):
    try:
        # Prepare input for model
        import pandas as pd
        X = pd.DataFrame([{k: v for k, v in input.dict().items()}])
        X_proc = preprocessor.transform(X)
        # Valuation prediction
        price_pred = float(valuation_model.predict(X_proc)[0])
        # Confidence interval (using ensemble predictions)
        if hasattr(valuation_model, 'estimators_'):
            all_preds = np.array([est.predict(X_proc)[0] for est in valuation_model.estimators_])
            conf_int = get_confidence_interval(all_preds)
        else:
            conf_int = [round(price_pred, 2), round(price_pred, 2)]
        # Risk prediction
        risk_prob = float(risk_model.predict_proba(X_proc)[0][1])
        risk_label = "High Risk" if risk_prob >= 0.5 else "Low Risk"
        return PredictionOutput(
            predicted_price=round(price_pred, 2),
            risk_score=round(risk_prob, 2),
            risk_label=risk_label,
            confidence_interval=conf_int
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {str(e)}")

@app.get("/")
def root():
    return {"message": "ProptiChain AI Service is running."}
