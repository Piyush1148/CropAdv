# app/api/crops.py

"""
Crop recommendation endpoints - ML model integration with Firestore
This is where your trained model will be served with database integration
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
import os

from app.utils.auth import get_current_user, optional_authenticated_user
from app.services.firebase_service import get_firebase_service
import time

router = APIRouter()

# --- HELPER FUNCTION TO PARSE PREDICTION DOCUMENTS ---
def _get_crop_name_from_prediction(pred_doc: Dict[str, Any]) -> Optional[str]:
    """Reliably extracts the crop name from either prediction format."""
    if not isinstance(pred_doc, dict):
        return None
        
    # Format 1: From /recommend endpoint - recommendations array
    if 'recommendations' in pred_doc and isinstance(pred_doc.get('recommendations'), list) and pred_doc['recommendations']:
        crop_name = pred_doc['recommendations'][0].get('crop_name')
        if crop_name:
            return crop_name

    # Format 2: From /predict endpoint - nested prediction object
    if 'prediction' in pred_doc:
        prediction = pred_doc['prediction']
        if isinstance(prediction, dict):
            # Try prediction.prediction first (most common format)
            crop_name = prediction.get('prediction')
            if crop_name and isinstance(crop_name, str):
                return crop_name
            # Try prediction.crop_name as fallback
            crop_name = prediction.get('crop_name')
            if crop_name and isinstance(crop_name, str):
                return crop_name
            # Try prediction.crop
            crop_name = prediction.get('crop')
            if crop_name and isinstance(crop_name, str):
                return crop_name
        elif isinstance(prediction, str):
            # Direct string value
            return prediction
    
    # Format 3: Direct crop_name field at root level
    if 'crop_name' in pred_doc and pred_doc['crop_name']:
        return pred_doc['crop_name']
    
    # Format 4: input_data might have crop result
    if 'input_data' in pred_doc and isinstance(pred_doc['input_data'], dict):
        crop_name = pred_doc['input_data'].get('crop')
        if crop_name:
            return crop_name
            
    return None

# (Pydantic models are unchanged)
class SimplePredictionRequest(BaseModel):
    N: float = Field(..., ge=0, le=300)
    P: float = Field(..., ge=0, le=300)
    K: float = Field(..., ge=0, le=300)
    temperature: float = Field(..., ge=-10, le=60)
    humidity: float = Field(..., ge=0, le=100)
    ph: float = Field(..., ge=0, le=14)
    rainfall: float = Field(..., ge=0, le=4000)
    location: str = Field(..., min_length=1, max_length=100)

class SimplePredictionResponse(BaseModel):
    prediction: str
    confidence: float
    probability: float
    id: Optional[str] = None  # Prediction ID from Firestore

class CropRecommendationRequest(BaseModel):
    nitrogen: float = Field(..., ge=0, le=150)
    phosphorous: float = Field(..., ge=0, le=150)
    potassium: float = Field(..., ge=0, le=200)
    temperature: float = Field(..., ge=0, le=50)
    humidity: float = Field(..., ge=0, le=100)
    ph: float = Field(..., ge=0, le=14)
    rainfall: float = Field(..., ge=0, le=4000)
    location: Optional[str] = None
    farm_size: Optional[float] = None

class CropRecommendation(BaseModel):
    crop_name: str
    confidence_score: float

class CropRecommendationResponse(BaseModel):
    recommendations: List[CropRecommendation]
    timestamp: datetime


ml_model, crop_labels = None, None

def load_ml_model():
    """Load the trained ML model and metadata."""
    global ml_model, crop_labels
    try:
        model_path = os.getenv("MODEL_PATH", "./ml_models/crop_recommendation_model.joblib")
        info_path = os.getenv("INFO_PATH", "./ml_models/model_info.joblib")
        if os.path.exists(model_path):
            ml_model = joblib.load(model_path)
            print(f"✅ ML Model loaded from {model_path}")
        if os.path.exists(info_path):
            model_info = joblib.load(info_path)
            crop_labels = model_info.get('crop_labels', [])
            print(f"✅ Model info loaded. Accuracy: {model_info.get('accuracy', 0)*100:.2f}%")
    except Exception as e:
        print(f"❌ Error loading ML model: {str(e)}")

# (Endpoints for writing data are unchanged)
@router.post("/recommend")
async def get_crop_recommendations(request: CropRecommendationRequest, user: Optional[Dict[str, Any]] = Depends(optional_authenticated_user)):
    if ml_model is None: raise HTTPException(503, "Model not loaded")
    
    features = [request.nitrogen, request.phosphorous, request.potassium, request.temperature, request.humidity, request.ph, request.rainfall]
    input_array = np.array(features).reshape(1, -1)
    prediction_proba = ml_model.predict_proba(input_array)[0]
    top_3_indices = prediction_proba.argsort()[-3:][::-1]

    recommendations = []
    for i in top_3_indices:
        recommendations.append(CropRecommendation(
            crop_name=ml_model.classes_[i],
            confidence_score=round(prediction_proba[i] * 100, 2)
        ))
    
    response = CropRecommendationResponse(recommendations=recommendations, timestamp=datetime.utcnow())
    if user:
        firebase_service = get_firebase_service()
        await firebase_service.save_prediction(user["uid"], response.dict())
    return response

@router.post("/predict", response_model=SimplePredictionResponse)
async def predict_crop_simple(request: SimplePredictionRequest, user: Optional[Dict[str, Any]] = Depends(optional_authenticated_user)):
    if ml_model is None: raise HTTPException(503, "Model not loaded")

    # 🔍 DEBUG: Log incoming request values
    print("\n" + "="*60)
    print("📊 CROP PREDICTION REQUEST RECEIVED")
    print("="*60)
    print(f"  N (Nitrogen):    {request.N}")
    print(f"  P (Phosphorus):  {request.P}")
    print(f"  K (Potassium):   {request.K}")
    print(f"  Temperature:     {request.temperature}°C")
    print(f"  Humidity:        {request.humidity}%")
    print(f"  pH:              {request.ph}")
    print(f"  Rainfall:        {request.rainfall}mm")
    print(f"  Location:        {request.location}")
    print(f"  User ID:         {user['uid'] if user else 'Anonymous'}")
    print("-"*60)

    input_array = np.array([[request.N, request.P, request.K, request.temperature, request.humidity, request.ph, request.rainfall]])
    
    # 🔍 DEBUG: Show input array
    print(f"  Input Array: {input_array[0]}")
    
    prediction = ml_model.predict(input_array)[0]
    probabilities = ml_model.predict_proba(input_array)[0]
    confidence = float(np.max(probabilities))
    
    # 🔍 DEBUG: Show top 3 predictions
    top_3_indices = probabilities.argsort()[-3:][::-1]
    print(f"\n  🌾 Top 3 Predictions:")
    for i, idx in enumerate(top_3_indices, 1):
        print(f"    {i}. {ml_model.classes_[idx]}: {probabilities[idx]*100:.1f}%")
    
    print(f"\n  ✅ FINAL PREDICTION: {prediction}")
    print(f"  ✅ CONFIDENCE: {confidence*100:.1f}%")
    print("="*60 + "\n")
    
    response = SimplePredictionResponse(prediction=prediction, confidence=confidence, probability=confidence * 100)

    # Save prediction to database and return ID
    prediction_id = None
    if user:
        firebase_service = get_firebase_service()
        prediction_data = {"input_data": request.dict(), "prediction": response.dict(), "user_id": user["uid"], "created_at": datetime.utcnow()}
        prediction_id = await firebase_service.save_prediction(user["uid"], prediction_data)
        print(f"✅ Prediction saved with ID: {prediction_id}")

    # Add prediction_id to response
    return {
        **response.dict(),
        "id": prediction_id  # Add the ID to the response
    }

@router.get("/list")
async def get_supported_crops():
    return {"crops": crop_labels or [], "model_loaded": ml_model is not None}

@router.get("/predictions/history")
async def get_prediction_history(limit: int = 10, user: Dict[str, Any] = Depends(get_current_user)):
    return await get_predictions_simple(limit, user)

@router.get("/analytics")
async def get_user_analytics(user: Dict[str, Any] = Depends(get_current_user)):
    return {"message": "Analytics endpoint is under construction."}


@router.get("/predictions")
async def get_predictions_simple(limit: int = 10, user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get user's crop predictions and standardize the output for the frontend.
    This fixes the "Unknown" crop and incorrect confidence issues.
    """
    firebase_service = get_firebase_service()
    if not firebase_service.is_connected():
        raise HTTPException(status_code=503, detail="Database service unavailable")
        
    try:
        raw_predictions = await firebase_service.get_user_predictions(user["uid"], limit)
        
        standardized_predictions = []
        for pred_doc in raw_predictions:
            new_pred = pred_doc.copy()
            
            # DEBUG: Log the prediction structure
            print(f"🔍 DEBUG - Prediction doc keys: {pred_doc.keys()}")
            if 'prediction' in pred_doc:
                print(f"🔍 DEBUG - Prediction value: {pred_doc['prediction']}")
            if 'recommendations' in pred_doc:
                print(f"🔍 DEBUG - Recommendations: {pred_doc['recommendations']}")
            
            # FIX 1: Robustly find the crop name
            crop_name = _get_crop_name_from_prediction(pred_doc)
            print(f"🔍 DEBUG - Extracted crop name: {crop_name}")
            new_pred['crop_name'] = crop_name or "Unknown"

            # FIX 2: Standardize confidence score to a decimal (0-1.0)
            confidence_percent = 0.0
            if 'recommendations' in pred_doc and pred_doc.get('recommendations'):
                confidence_percent = pred_doc['recommendations'][0].get('confidence_score', 0.0)
            elif 'prediction' in pred_doc and isinstance(pred_doc.get('prediction'), dict):
                # This format stores 'probability' as the percentage value
                confidence_percent = pred_doc['prediction'].get('probability', 0.0)
            
            # Send as a decimal (e.g., 95.5% becomes 0.955) to fix frontend calculation
            new_pred['confidence'] = round(confidence_percent / 100.0, 4)
            
            standardized_predictions.append(new_pred)
            
        return standardized_predictions
        
    except Exception as e:
        print(f"❌ Error fetching or standardizing predictions: {str(e)}")
        import traceback
        traceback.print_exc()
        return []