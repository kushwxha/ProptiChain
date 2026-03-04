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
    area: float = Field(..., gt=0, description="Area in square feet")
    bedrooms: int = Field(..., ge=0, le=20)
    bathrooms: int = Field(..., ge=0, le=20)
    age: int = Field(..., ge=0, le=200)
    location: str = Field(..., description="Location category")
    amenities_score: float = Field(..., ge=0, le=10)
    market_trend: float = Field(..., description="Market trend indicator")

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
        X = [{
            'area': input.area,
            'bedrooms': input.bedrooms,
            'bathrooms': input.bathrooms,
            'age': input.age,
            'location': input.location,
            'amenities_score': input.amenities_score,
            'market_trend': input.market_trend
        }]
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
