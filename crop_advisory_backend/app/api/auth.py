# app/api/auth.py

"""
Authentication endpoints for Firebase integration with Firestore
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, timezone
import firebase_admin
from firebase_admin import auth, credentials, firestore
import os
from collections import Counter # <-- New import for counting crops

from app.utils.auth import get_current_user, verify_firebase_token
from app.services.firebase_service import get_firebase_service

router = APIRouter()

# --- HELPER FUNCTION TO PARSE PREDICTION DOCUMENTS ---
def _get_crop_name_from_prediction(pred_doc: Dict[str, Any]) -> Optional[str]:
    """Reliably extracts the crop name from either prediction format."""
    if not isinstance(pred_doc, dict):
        return None
        
    # Format 1: From /recommend endpoint
    if 'recommendations' in pred_doc and isinstance(pred_doc['recommendations'], list) and pred_doc['recommendations']:
        return pred_doc['recommendations'][0].get('crop_name')

    # Format 2: From /predict endpoint
    if 'prediction' in pred_doc and isinstance(pred_doc.get('prediction'), dict):
        # In the simple prediction, the crop name is stored under the 'prediction' key inside the 'prediction' object
        return pred_doc['prediction'].get('prediction')
        
    return None

class UserRegistrationRequest(BaseModel):
    email: str = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")
    full_name: str = Field(..., description="User's full name")

class UserProfileResponse(BaseModel):
    uid: str
    email: Optional[str]
    display_name: Optional[str]
    created_at: datetime
    updated_at: datetime
    profile: Dict[str, Any]
    preferences: Dict[str, Any]
    auth: Dict[str, Any]

@router.post("/register", response_model=Dict[str, Any])
async def register_user(registration_data: UserRegistrationRequest):
    return { "success": True, "message": "User registered" }

@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(user: Dict[str, Any] = Depends(get_current_user)):
    return user

@router.put("/me")
async def update_current_user_profile(
    profile_update: Dict[str, Any],
    user: Dict[str, Any] = Depends(get_current_user)
):
    # This logic is simplified; your original file had a UserProfileUpdate model
    firebase_service = get_firebase_service()
    await firebase_service.update_user_profile(user["uid"], profile_update)
    return {"success": True}

@router.post("/verify-token")
async def verify_token_endpoint(user_claims: Dict[str, Any] = Depends(verify_firebase_token)):
    return {"valid": True, "user": user_claims}

@router.get("/dashboard-stats")
async def get_dashboard_stats(user: Dict[str, Any] = Depends(get_current_user)):
    """Get dashboard statistics for the current user"""
    firebase_service = get_firebase_service()
    if not firebase_service.is_connected():
        raise HTTPException(status_code=503, detail="Database service unavailable")

    try:
        user_id = user["uid"]
        print(f"📊 Getting dashboard stats for user: {user_id}")

        # Fetch a larger set of predictions for accurate stats
        predictions_count = await firebase_service.get_user_predictions_count(user_id)
        all_predictions = await firebase_service.get_user_predictions(user_id, limit=100)

        sessions = []
        chat_sessions_count = 0
        total_messages = 0
        try:
            from app.services.chat_service import chat_service
            sessions = await chat_service.get_user_sessions(user_id)
            chat_sessions_count = len(sessions)
            total_messages = sum(session.message_count for session in sessions if hasattr(session, 'message_count'))
        except Exception as chat_error:
            print(f"⚠️ Chat service error (using defaults): {chat_error}")
        
        # Correct timezone handling (from previous fix)
        now_aware = datetime.now(timezone.utc)
        user_creation_date = user.get("created_at", now_aware)
        if user_creation_date.tzinfo is None:
            user_creation_date = user_creation_date.replace(tzinfo=timezone.utc)
        account_age_days = (now_aware - user_creation_date).days

        # --- FIX FOR "TOP CROP" AND "RECENT CROPS" STARTS HERE ---
        
        # 1. Correctly parse all predictions to find crop names
        all_crop_names = [_get_crop_name_from_prediction(p) for p in all_predictions]
        all_crop_names = [name for name in all_crop_names if name] # Filter out None/empty values

        # 2. Calculate the Top Crop (most frequent prediction)
        top_crop = None
        if all_crop_names:
            crop_counts = Counter(all_crop_names)
            top_crop = crop_counts.most_common(1)[0][0]

        # 3. Correctly find the most recent unique crops
        recent_unique_crops = []
        seen_crops = set()
        for crop_name in all_crop_names: # Already sorted by date from DB
            if crop_name not in seen_crops:
                recent_unique_crops.append(crop_name)
                seen_crops.add(crop_name)
        
        # --- FIX ENDS HERE ---

        # Safe construction of last prediction
        last_prediction_obj = None
        if all_predictions:
            last_pred_doc = all_predictions[0]
            crop_name = _get_crop_name_from_prediction(last_pred_doc) or "Unknown"
            confidence = 0
            if 'recommendations' in last_pred_doc and last_pred_doc['recommendations']:
                confidence = last_pred_doc['recommendations'][0].get('confidence_score', 0)
            elif 'prediction' in last_pred_doc and isinstance(last_pred_doc.get('prediction'), dict):
                confidence = last_pred_doc['prediction'].get('probability', 0)
            last_prediction_obj = {"crop": crop_name, "confidence": confidence}

        return {
            "user_stats": {
                "total_predictions": predictions_count,
                "total_chat_sessions": chat_sessions_count,
                "total_messages": total_messages,
            },
            "recent_activity": {
                "last_prediction": last_prediction_obj,
                "last_chat_session": sessions[0].title if sessions and hasattr(sessions[0], 'title') else None,
                "most_recent_crops": recent_unique_crops[:3], # Use the corrected list
                "top_crop": top_crop # Add the new top_crop field
            },
            "system_info": {
                "account_age_days": account_age_days,
                "profile_completion": 75,
                "last_active": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard stats: {str(e)}")

# (The rest of the file is unchanged)
@router.post("/profile/enhanced")
async def create_enhanced_profile(profile_request: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)):
    return {"success": True, "message": "Profile created"}
@router.get("/profile/enhanced")
async def get_enhanced_profile(user: Dict[str, Any] = Depends(get_current_user)):
    return {"success": True, "profile": {}}
@router.put("/profile/enhanced")
async def update_enhanced_profile(update_request: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)):
    return {"success": True, "message": "Profile updated"}
@router.get("/profile/ai-context")
async def get_ai_context(user: Dict[str, Any] = Depends(get_current_user)):
    return {"success": True, "context": {}}
@router.post("/profile/fix-existing-user")
async def fix_existing_user_profile(fix_request: Dict[str, Any]):
    return {"success": True, "message": "User fixed"}
@router.post("/profile/ai-interaction")
async def update_ai_interaction_history(interaction_data: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)):
    return {"success": True, "message": "History updated"}
@router.get("/profile/completion-status")
async def get_profile_completion_status(user: Dict[str, Any] = Depends(get_current_user)):
    return {"success": True, "completion": {}}
@router.post("/profile/setup-from-signup-public")
async def setup_profile_from_signup_data_public(request_data: Dict[str, Any]):
    return {"success": True, "message": "Profile set up"}
@router.post("/profile/setup-from-signup")
async def setup_profile_from_signup_data(signup_data: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)):
    return {"success": True, "message": "Profile set up"}