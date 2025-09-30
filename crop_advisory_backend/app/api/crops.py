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

# Simple prediction model for frontend compatibility
class SimplePredictionRequest(BaseModel):
    """Simple prediction input matching frontend"""
    N: float = Field(..., ge=0, le=300, description="Nitrogen")
    P: float = Field(..., ge=0, le=300, description="Phosphorus") 
    K: float = Field(..., ge=0, le=300, description="Potassium")
    temperature: float = Field(..., ge=-10, le=60, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
    ph: float = Field(..., ge=0, le=14, description="pH level")
    rainfall: float = Field(..., ge=0, le=4000, description="Rainfall in mm")
    location: str = Field(..., min_length=1, max_length=100, description="Village/City name")

class SimplePredictionResponse(BaseModel):
    """Simple prediction response"""
    prediction: str = Field(..., description="Recommended crop")
    confidence: float = Field(..., description="Model confidence (0-1)")
    probability: float = Field(..., description="Probability percentage")
    model_version: str = Field(default="1.0.0", description="Model version")
    processing_time: str = Field(default="<1s", description="Processing time")

# Pydantic models for request/response
class CropRecommendationRequest(BaseModel):
    """Input data for crop recommendation"""
    nitrogen: float = Field(..., ge=0, le=150, description="Nitrogen content in soil")
    phosphorous: float = Field(..., ge=0, le=150, description="Phosphorous content in soil")
    potassium: float = Field(..., ge=0, le=200, description="Potassium content in soil")
    temperature: float = Field(..., ge=0, le=50, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
    ph: float = Field(..., ge=0, le=14, description="Soil pH level")
    rainfall: float = Field(..., ge=0, le=4000, description="Rainfall in mm")
    location: Optional[str] = Field(None, description="Farm location")
    farm_size: Optional[float] = Field(None, description="Farm size in acres")

class CropRecommendation(BaseModel):
    """Single crop recommendation with confidence"""
    crop_name: str
    confidence_score: float
    suitability_reasons: List[str]
    expected_yield: Optional[str] = None
    growing_season: Optional[str] = None

class CropRecommendationResponse(BaseModel):
    """Response with multiple crop recommendations"""
    recommendations: List[CropRecommendation]
    input_analysis: Dict[str, Any]
    timestamp: datetime
    model_version: str = "1.0.0"

# Global variables for model (will be loaded on startup)
ml_model = None
feature_scaler = None
crop_labels = None

def load_ml_model():
    """Load the trained ML model and metadata"""
    global ml_model, feature_scaler, crop_labels
    
    try:
        model_path = os.getenv("MODEL_PATH", "./ml_models/crop_recommendation_model.joblib")
        info_path = os.getenv("INFO_PATH", "./ml_models/model_info.joblib")
        
        if os.path.exists(model_path):
            ml_model = joblib.load(model_path)
            print(f"✅ ML Model loaded from {model_path}")
        else:
            print(f"⚠️ Model file not found at {model_path}")
            
        if os.path.exists(info_path):
            model_info = joblib.load(info_path)
            crop_labels = model_info.get('crop_labels', [])
            feature_names = model_info.get('feature_names', [])
            accuracy = model_info.get('accuracy', 0)
            print(f"✅ Model info loaded from {info_path}")
            print(f"📊 Model accuracy: {accuracy*100:.2f}%")
            print(f"🌾 Supported crops: {len(crop_labels)} types")
            print(f"📋 Expected features: {feature_names}")
        else:
            print(f"⚠️ Model info file not found at {info_path}")
            # Fallback to your actual crop labels from the trained model
            crop_labels = [
                "apple", "banana", "blackgram", "chickpea", "coconut", "coffee", 
                "cotton", "grapes", "jute", "kidneybeans", "lentil", "maize", 
                "mango", "mothbeans", "mungbean", "muskmelon", "orange", "papaya", 
                "pigeonpeas", "pomegranate", "rice", "watermelon"
            ]
            
        # No feature scaler needed - your model works with raw values
        feature_scaler = None
        
    except Exception as e:
        print(f"❌ Error loading ML model: {str(e)}")

# Load model when module is imported
load_ml_model()

@router.post("/recommend", response_model=CropRecommendationResponse)
async def get_crop_recommendations(
    request: CropRecommendationRequest,
    user: Optional[Dict[str, Any]] = Depends(optional_authenticated_user)
):
    """Get crop recommendations based on soil and climate data with Firestore integration"""
    
    if ml_model is None:
        # Return mock data if model is not loaded
        return get_mock_recommendations(request)
    
    try:
        # Prepare input features in the exact order your model expects
        # Order: N, P, K, temperature, humidity, ph, rainfall
        features = [
            request.nitrogen,
            request.phosphorous,
            request.potassium,
            request.temperature,
            request.humidity,
            request.ph,
            request.rainfall
        ]
        
        # Convert to numpy array and reshape
        input_array = np.array(features).reshape(1, -1)
        
        # Your model doesn't need scaling - works with raw values
        # Get prediction and probabilities
        prediction = ml_model.predict(input_array)[0]
        prediction_proba = ml_model.predict_proba(input_array)[0]
        
        # Create recommendations with confidence scores
        recommendations = []
        
        # Get top 3 recommendations sorted by probability
        class_names = ml_model.classes_
        proba_pairs = list(zip(class_names, prediction_proba))
        top_3_crops = sorted(proba_pairs, key=lambda x: x[1], reverse=True)[:3]
        
        for crop_name, confidence in top_3_crops:
            # Generate suitability reasons based on input conditions
            reasons = generate_suitability_reasons(request, crop_name)
            
            recommendations.append(CropRecommendation(
                crop_name=crop_name,
                confidence_score=round(confidence * 100, 2),
                suitability_reasons=reasons,
                expected_yield=f"Expected yield: {'High' if confidence > 0.8 else 'Medium to High' if confidence > 0.5 else 'Medium'} (confidence: {confidence:.1%})",
                growing_season=get_growing_season(crop_name)
            ))
        
        # Analyze input conditions
        input_analysis = analyze_input_conditions(request)
        
        # Create response
        response = CropRecommendationResponse(
            recommendations=recommendations,
            input_analysis=input_analysis,
            timestamp=datetime.utcnow()
        )
        
        # Save prediction to Firestore if user is authenticated
        if user:
            firebase_service = get_firebase_service()
            if firebase_service.is_connected():
                try:
                    prediction_data = {
                        "input_data": {
                            "nitrogen": request.nitrogen,
                            "phosphorous": request.phosphorous,
                            "potassium": request.potassium,
                            "temperature": request.temperature,
                            "humidity": request.humidity,
                            "ph": request.ph,
                            "rainfall": request.rainfall,
                            "location": request.location,
                            "farm_size": request.farm_size
                        },
                        "recommendations": [
                            {
                                "crop_name": rec.crop_name,
                                "confidence_score": rec.confidence_score,
                                "suitability_reasons": rec.suitability_reasons,
                                "expected_yield": rec.expected_yield,
                                "growing_season": rec.growing_season
                            }
                            for rec in recommendations
                        ],
                        "model_version": "RandomForest-v1.0",
                        "accuracy": 99.32,
                        "location": request.location or "",
                        "season": datetime.utcnow().strftime("%Y-%m")
                    }
                    
                    prediction_id = await firebase_service.save_prediction(
                        user["uid"], 
                        prediction_data
                    )
                    
                    # Add prediction ID to response metadata
                    response.model_version = f"RandomForest-v1.0 (ID: {prediction_id})"
                    
                except Exception as e:
                    print(f"⚠️ Error saving prediction to Firestore: {str(e)}")
                    # Continue with response even if saving fails
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

def get_mock_recommendations(request: CropRecommendationRequest) -> CropRecommendationResponse:
    """Return mock recommendations when ML model is not available"""
    
    mock_recommendations = [
        CropRecommendation(
            crop_name="rice",
            confidence_score=85.2,
            suitability_reasons=[
                "High humidity levels are ideal for rice cultivation",
                "Sufficient rainfall for water-intensive crop",
                "Soil pH within optimal range"
            ],
            expected_yield="High yield expected",
            growing_season="Kharif season (June-October)"
        ),
        CropRecommendation(
            crop_name="wheat",
            confidence_score=76.8,
            suitability_reasons=[
                "Good nitrogen content for cereal growth",
                "Temperature suitable for rabi crops",
                "Adequate soil fertility"
            ],
            expected_yield="Medium to high yield",
            growing_season="Rabi season (October-March)"
        ),
        CropRecommendation(
            crop_name="sugarcane",
            confidence_score=68.5,
            suitability_reasons=[
                "High potassium content beneficial",
                "Humidity levels support growth",
                "Good water availability"
            ],
            expected_yield="Medium yield expected",
            growing_season="Year-round cultivation possible"
        )
    ]
    
    input_analysis = analyze_input_conditions(request)
    
    return CropRecommendationResponse(
        recommendations=mock_recommendations,
        input_analysis=input_analysis,
        timestamp=datetime.utcnow(),
        model_version="Mock v1.0.0"
    )

@router.post("/predict", response_model=SimplePredictionResponse)
async def predict_crop_simple(
    request: SimplePredictionRequest,
    user: Optional[Dict[str, Any]] = Depends(optional_authenticated_user)
):
    """Simple crop prediction endpoint with enhanced logging for debugging"""
    try:
        if ml_model is None:
            raise HTTPException(
                status_code=503,
                detail="ML model is not loaded. Please check server configuration."
            )
        
        # Convert frontend format to model format
        input_array = np.array([[
            request.N,          # Nitrogen
            request.P,          # Phosphorus  
            request.K,          # Potassium
            request.temperature, # Temperature
            request.humidity,   # Humidity
            request.ph,         # pH
            request.rainfall    # Rainfall
        ]])
        
        # Get prediction
        prediction = ml_model.predict(input_array)[0]
        prediction_proba = ml_model.predict_proba(input_array)[0]
        
        # Get class names and confidence
        class_names = ml_model.classes_
        max_proba_idx = np.argmax(prediction_proba)
        confidence = float(prediction_proba[max_proba_idx])
        
        # Create response
        response = SimplePredictionResponse(
            prediction=prediction,
            confidence=confidence,
            probability=confidence * 100,
            model_version="RandomForest-v1.0",
            processing_time="<1s"
        )
        
        # Enhanced logging for prediction saving debugging
        print(f"🔍 DEBUG: User authentication status: {user is not None}")
        if user:
            print(f"🔍 DEBUG: User ID: {user.get('uid', 'No UID found')}")
        else:
            print("🔍 DEBUG: No authenticated user - prediction will not be saved")
            
        # Save to Firestore if user is authenticated
        if user:
            try:
                firebase_service = get_firebase_service()
                print(f"🔍 DEBUG: Firebase service connected: {firebase_service.is_connected()}")
                
                prediction_data = {
                    "input_data": {
                        "N": request.N,
                        "P": request.P,
                        "K": request.K,
                        "temperature": request.temperature,
                        "humidity": request.humidity,
                        "ph": request.ph,
                        "rainfall": request.rainfall,
                        "location": request.location
                    },
                    "prediction": {
                        "crop": prediction,
                        "confidence": confidence,
                        "probability": confidence * 100,
                        "model_version": "RandomForest-v1.0"
                    },
                    "location": request.location,
                    "created_at": datetime.utcnow(),
                    "user_id": user["uid"]
                }
                
                print(f"🔍 DEBUG: Attempting to save prediction for crop: {prediction}")
                prediction_id = await firebase_service.save_prediction(
                    user["uid"], 
                    prediction_data
                )
                
                print(f"✅ PREDICTION SAVED TO FIRESTORE WITH ID: {prediction_id}")
                
            except Exception as e:
                print(f"❌ ERROR SAVING PREDICTION TO FIRESTORE: {str(e)}")
                import traceback
                print(f"❌ FULL ERROR TRACEBACK: {traceback.format_exc()}")
                # Don't fail the request if saving fails
        else:
            print("⚠️ PREDICTION NOT SAVED - USER NOT AUTHENTICATED")
        
        return response
        
    except Exception as e:
        print(f"❌ Prediction error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

def get_growing_season(crop_name: str) -> str:
    """Get the typical growing season for a crop"""
    seasons = {
        "rice": "Kharif (June-October) and Rabi (November-April)",
        "wheat": "Rabi (October-March)",
        "maize": "Kharif (June-September) and Rabi (November-March)",
        "cotton": "Kharif (April-December)",
        "sugarcane": "Year-round (plant February-April)",
        "apple": "Year-round tree, harvest Aug-Nov",
        "banana": "Year-round, harvest every 12-15 months",
        "mango": "Year-round tree, harvest March-July",
        "grapes": "Year-round vine, harvest Feb-Apr & Oct-Jan",
        "orange": "Year-round tree, harvest Nov-Feb",
        "coconut": "Year-round tree, harvest every 45 days",
        "coffee": "Year-round plant, harvest Oct-Feb",
        "chickpea": "Rabi (October-March)",
        "kidneybeans": "Kharif (June-September)",
        "blackgram": "Kharif (June-September) and Summer",
        "lentil": "Rabi (October-March)",
        "pigeonpeas": "Kharif (June-December)",
        "mothbeans": "Kharif (July-October)",
        "mungbean": "Kharif (June-September) and Summer",
        "watermelon": "Summer (February-May)",
        "muskmelon": "Summer (January-May)",
        "papaya": "Year-round, harvest 10-12 months after planting",
        "pomegranate": "Year-round tree, harvest twice yearly",
        "jute": "Kharif (April-September)"
    }
    return seasons.get(crop_name.lower(), "Season varies by region and variety")

def generate_suitability_reasons(request: CropRecommendationRequest, crop_name: str) -> List[str]:
    """Generate reasons why a crop is suitable based on input conditions"""
    reasons = []
    
    # Analyze soil nutrients
    if request.nitrogen > 100:
        reasons.append("High nitrogen content supports leafy growth")
    elif request.nitrogen > 50:
        reasons.append("Adequate nitrogen levels for healthy growth")
    
    if request.phosphorous > 80:
        reasons.append("Excellent phosphorous for root development")
    elif request.phosphorous > 40:
        reasons.append("Good phosphorous levels for flowering")
    
    if request.potassium > 100:
        reasons.append("High potassium enhances disease resistance")
    elif request.potassium > 50:
        reasons.append("Sufficient potassium for fruit quality")
    
    # Analyze climate conditions
    if request.temperature > 30:
        reasons.append("High temperature suitable for tropical crops")
    elif request.temperature > 20:
        reasons.append("Moderate temperature ideal for temperate crops")
    else:
        reasons.append("Cool temperature good for cold-season crops")
    
    if request.humidity > 70:
        reasons.append("High humidity supports moisture-loving crops")
    elif request.humidity > 50:
        reasons.append("Moderate humidity prevents fungal diseases")
    
    if request.rainfall > 150:
        reasons.append("High rainfall perfect for water-intensive crops")
    elif request.rainfall > 75:
        reasons.append("Adequate rainfall for rain-fed cultivation")
    
    # Soil pH analysis
    if 6.0 <= request.ph <= 7.5:
        reasons.append("Optimal soil pH for nutrient availability")
    elif request.ph < 6.0:
        reasons.append("Acidic soil suitable for acid-tolerant varieties")
    else:
        reasons.append("Alkaline soil manageable with proper amendments")
    
    return reasons[:3]  # Return top 3 reasons

def analyze_input_conditions(request: CropRecommendationRequest) -> Dict[str, Any]:
    """Analyze input conditions and provide insights"""
    
    analysis = {
        "soil_fertility": "Unknown",
        "climate_conditions": "Unknown",
        "water_requirements": "Unknown",
        "recommendations": []
    }
    
    # Analyze soil fertility
    avg_nutrients = (request.nitrogen + request.phosphorous + request.potassium) / 3
    if avg_nutrients > 100:
        analysis["soil_fertility"] = "Excellent"
    elif avg_nutrients > 70:
        analysis["soil_fertility"] = "Good"
    elif avg_nutrients > 40:
        analysis["soil_fertility"] = "Moderate"
    else:
        analysis["soil_fertility"] = "Poor"
    
    # Analyze climate
    if 20 <= request.temperature <= 30 and 50 <= request.humidity <= 80:
        analysis["climate_conditions"] = "Optimal"
    elif 15 <= request.temperature <= 35 and 40 <= request.humidity <= 90:
        analysis["climate_conditions"] = "Good"
    else:
        analysis["climate_conditions"] = "Challenging"
    
    # Water requirements
    if request.rainfall > 100:
        analysis["water_requirements"] = "Well-supplied"
    elif request.rainfall > 50:
        analysis["water_requirements"] = "Adequate"
    else:
        analysis["water_requirements"] = "Irrigation needed"
    
    # Generate recommendations
    if analysis["soil_fertility"] == "Poor":
        analysis["recommendations"].append("Consider organic fertilizers to improve soil health")
    
    if request.ph < 6.0:
        analysis["recommendations"].append("Apply lime to reduce soil acidity")
    elif request.ph > 8.0:
        analysis["recommendations"].append("Add organic matter to reduce alkalinity")
    
    if analysis["water_requirements"] == "Irrigation needed":
        analysis["recommendations"].append("Install drip irrigation for water efficiency")
    
    return analysis

@router.get("/list")
async def get_supported_crops():
    """Get list of crops supported by the model"""
    supported_crops = crop_labels if crop_labels else [
        "rice", "wheat", "maize", "sugarcane", "cotton",
        "soybean", "groundnut", "sunflower", "potato", "tomato"
    ]
    
    return {
        "crops": supported_crops,
        "total_count": len(supported_crops),
        "model_loaded": ml_model is not None,
        "model_accuracy": 99.32 if ml_model else 0
    }

@router.get("/predictions/history")
async def get_prediction_history(
    limit: int = 10,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get user's prediction history from Firestore"""
    firebase_service = get_firebase_service()
    
    if not firebase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )
    
    try:
        predictions = await firebase_service.get_user_predictions(user["uid"], limit)
        
        return {
            "predictions": predictions,
            "total_count": len(predictions),
            "user_id": user["uid"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching prediction history: {str(e)}"
        )

@router.get("/analytics")
async def get_user_analytics(user: Dict[str, Any] = Depends(get_current_user)):
    """Get user's crop recommendation analytics"""
    firebase_service = get_firebase_service()
    
    if not firebase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )
    
    try:
        analytics = await firebase_service.get_analytics_data(user["uid"])
        
        return {
            "analytics": analytics,
            "user_id": user["uid"],
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating analytics: {str(e)}"
        )

@router.get("/predictions")
async def get_predictions_simple(
    limit: int = 10,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Simple predictions endpoint for frontend compatibility"""
    firebase_service = get_firebase_service()
    
    try:
        predictions = await firebase_service.get_user_predictions(user["uid"], limit)
        return predictions  # Return array directly
        
    except Exception as e:
        print(f"❌ Error fetching predictions: {str(e)}")
        return []  # Return empty array on error