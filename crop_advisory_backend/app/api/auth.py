"""
Authentication endpoints for Firebase integration with Firestore
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import firebase_admin
from firebase_admin import auth, credentials, firestore
import os

from app.utils.auth import get_current_user, verify_firebase_token
from app.services.firebase_service import get_firebase_service

router = APIRouter()

class UserRegistrationRequest(BaseModel):
    """User registration request model - matches frontend expectations"""
    email: str = Field(..., description="User's email address")
    password: str = Field(..., description="User's password") 
    full_name: str = Field(..., description="User's full name")

class UserProfileUpdate(BaseModel):
    """User profile update model"""
    display_name: Optional[str] = Field(None, description="User's display name")
    farm_location: Optional[str] = Field(None, description="Farm location")
    farm_size: Optional[float] = Field(None, ge=0, description="Farm size in acres")
    farming_experience: Optional[str] = Field(None, description="Years of farming experience")
    primary_crops: Optional[List[str]] = Field(default=[], description="Primary crops grown")
    language: Optional[str] = Field(default="en", description="Preferred language")
    notification_enabled: Optional[bool] = Field(default=True, description="Enable notifications")
    weather_alerts: Optional[bool] = Field(default=True, description="Enable weather alerts")

class UserProfileResponse(BaseModel):
    """User profile response model"""
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
    """
    Basic user registration endpoint that frontend calls.
    Creates minimal user profile - enhanced profile created separately via localStorage data
    """
    firebase_service = get_firebase_service()
    
    if not firebase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )
    
    try:
        # Create basic user profile structure
        user_data = {
            "email": registration_data.email,
            "display_name": registration_data.full_name,
            "profile": {
                "farm_location": "",  # Will be updated from localStorage
                "farm_size": 1,       # Will be updated from localStorage  
                "farming_experience": "beginner",
                "primary_crops": ["wheat", "rice"]  # Default crops
            },
            "preferences": {
                "language": "en",
                "notification_enabled": True,
                "weather_alerts": True
            }
        }
        
        print(f"🔍 DEBUG: Creating basic profile for {registration_data.email}")
        
        # For this endpoint, we don't have the user's Firebase UID yet
        # (it's created on the frontend first), so we return success
        # The real profile will be created when frontend calls setup-from-signup
        
        return {
            "success": True,
            "message": f"User {registration_data.full_name} registered successfully",
            "user": {
                "email": registration_data.email,
                "display_name": registration_data.full_name,
                "profile_created": True,
                "note": "Enhanced profile will be created from signup data"
            }
        }
        
    except Exception as e:
        print(f"❌ Error in user registration: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )

@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user's profile with complete data"""
    return user

@router.put("/me", response_model=UserProfileResponse)
async def update_current_user_profile(
    profile_update: UserProfileUpdate,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Update current user's profile"""
    firebase_service = get_firebase_service()
    
    if not firebase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )
    
    try:
        # Prepare update data
        update_data = {}
        
        # Update profile fields
        if profile_update.display_name is not None:
            update_data["display_name"] = profile_update.display_name
        
        if any([
            profile_update.farm_location is not None,
            profile_update.farm_size is not None,
            profile_update.farming_experience is not None,
            profile_update.primary_crops is not None
        ]):
            profile_data = {}
            if profile_update.farm_location is not None:
                profile_data["farm_location"] = profile_update.farm_location
            if profile_update.farm_size is not None:
                profile_data["farm_size"] = profile_update.farm_size
            if profile_update.farming_experience is not None:
                profile_data["farming_experience"] = profile_update.farming_experience
            if profile_update.primary_crops is not None:
                profile_data["primary_crops"] = profile_update.primary_crops
            
            update_data["profile"] = profile_data
        
        # Update preferences
        if any([
            profile_update.language is not None,
            profile_update.notification_enabled is not None,
            profile_update.weather_alerts is not None
        ]):
            preferences_data = {}
            if profile_update.language is not None:
                preferences_data["language"] = profile_update.language
            if profile_update.notification_enabled is not None:
                preferences_data["notification_enabled"] = profile_update.notification_enabled
            if profile_update.weather_alerts is not None:
                preferences_data["weather_alerts"] = profile_update.weather_alerts
            
            update_data["preferences"] = preferences_data
        
        # Update in Firestore
        success = await firebase_service.update_user_profile(user["uid"], update_data)
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to update profile"
            )
        
        # Return updated profile
        updated_user = await firebase_service.get_user_profile(user["uid"])
        if updated_user:
            updated_user["auth"] = user.get("auth", {})
            return updated_user
        else:
            return user
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating profile: {str(e)}"
        )

@router.post("/verify-token")
async def verify_token_endpoint(user_claims: Dict[str, Any] = Depends(verify_firebase_token)):
    """Verify Firebase ID token and return user info"""
    return {
        "valid": True,
        "user": user_claims,
        "message": "Token verified successfully"
    }

@router.get("/dashboard-stats")
async def get_dashboard_stats(user: Dict[str, Any] = Depends(get_current_user)):
    """Get dashboard statistics for the current user"""
    firebase_service = get_firebase_service()
    
    if not firebase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )
    
    try:
        user_id = user["uid"]
        print(f"📊 Getting dashboard stats for user: {user_id}")
        
        # Get user's predictions count using the new count method
        predictions_count = await firebase_service.get_user_predictions_count(user_id)
        print(f"📊 Predictions count: {predictions_count}")
        
        # Get recent predictions for activity display
        predictions = await firebase_service.get_user_predictions(user_id, limit=10)
        print(f"📊 Retrieved {len(predictions) if predictions else 0} predictions")
        
        # Temporarily disable chat service to isolate error
        try:
            from app.services.chat_service import ChatService
            chat_service = ChatService()
            sessions = await chat_service.get_user_sessions(user_id)
            chat_sessions_count = len(sessions)
            total_messages = sum(len(session.messages) for session in sessions)
        except Exception as chat_error:
            print(f"⚠️ Chat service error (using defaults): {chat_error}")
            sessions = []
            chat_sessions_count = 0
            total_messages = 0
        
        # Get recent activity (last 7 days) with error handling
        try:
            from datetime import timedelta
            week_ago = datetime.utcnow().replace(tzinfo=None) - timedelta(days=7)
            
            def is_recent_prediction(p):
                try:
                    timestamp = p.get('created_at') or p.get('timestamp')
                    if not timestamp:
                        return False
                    if isinstance(timestamp, str):
                        timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                        timestamp = timestamp.replace(tzinfo=None)  # Make timezone-naive
                    else:
                        # Handle Firebase DatetimeWithNanoseconds
                        timestamp = timestamp.replace(tzinfo=None) if hasattr(timestamp, 'replace') else timestamp
                    return timestamp > week_ago
                except Exception as date_error:
                    print(f"⚠️ Date comparison error for prediction: {date_error}")
                    return False
            
            recent_predictions = [p for p in predictions if is_recent_prediction(p)]
            recent_sessions = [s for s in sessions if hasattr(s, 'updated_at') and s.updated_at > week_ago] if sessions else []
        except Exception as recent_error:
            print(f"⚠️ Recent activity calculation error: {recent_error}")
            recent_predictions = []
            recent_sessions = []
        
        # Safe response construction with error handling
        try:
            # Safe last prediction extraction
            last_prediction = None
            if predictions and len(predictions) > 0:
                pred = predictions[0]
                # Handle nested prediction structure
                if isinstance(pred.get("prediction"), dict):
                    crop_name = pred.get("prediction", {}).get("crop", "Unknown")
                    confidence = pred.get("prediction", {}).get("confidence", 0)
                else:
                    crop_name = pred.get("prediction", "Unknown")
                    confidence = pred.get("confidence", 0)
                last_prediction = {"crop": crop_name, "confidence": confidence}
            
            # Safe recent crops extraction
            most_recent_crops = []
            try:
                for p in recent_predictions[:5]:
                    if isinstance(p.get("prediction"), dict):
                        crop = p.get("prediction", {}).get("crop")
                    else:
                        crop = p.get("prediction")
                    if crop and crop != "Unknown":
                        most_recent_crops.append(crop)
                most_recent_crops = list(set(most_recent_crops))[:3]
            except Exception as crop_error:
                print(f"⚠️ Recent crops extraction error: {crop_error}")
                most_recent_crops = []
            
            return {
                "user_stats": {
                    "total_predictions": predictions_count,
                    "total_chat_sessions": chat_sessions_count,
                    "total_messages": total_messages,
                    "recent_predictions_7d": len(recent_predictions),
                    "recent_sessions_7d": len(recent_sessions),
                },
                "recent_activity": {
                    "last_prediction": last_prediction,
                    "last_chat_session": sessions[0].title if sessions and len(sessions) > 0 and hasattr(sessions[0], 'title') else None,
                    "most_recent_crops": most_recent_crops
                },
                "system_info": {
                    "account_age_days": 30,  # Default safe value
                    "profile_completion": 75,  # Default safe value
                    "last_active": datetime.utcnow().isoformat()
                }
            }
        except Exception as response_error:
            print(f"❌ Response construction error: {response_error}")
            # Return minimal safe response
            return {
                "user_stats": {
                    "total_predictions": predictions_count,
                    "total_chat_sessions": 0,
                    "total_messages": 0,
                    "recent_predictions_7d": 0,
                    "recent_sessions_7d": 0,
                },
                "recent_activity": {
                    "last_prediction": None,
                    "last_chat_session": None,
                    "most_recent_crops": []
                },
                "system_info": {
                    "account_age_days": 30,
                    "profile_completion": 75,
                    "last_active": datetime.utcnow().isoformat()
                }
            }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching dashboard stats: {str(e)}"
        )

# ==================== ENHANCED PROFILE MANAGEMENT API ENDPOINTS ====================

@router.post("/profile/enhanced", response_model=Dict[str, Any])
async def create_enhanced_profile(
    profile_request: Dict[str, Any],  # We'll validate this in the service layer
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Create comprehensive enhanced user profile for AI personalization"""
    firebase_service = get_firebase_service()
    
    if not firebase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )
    
    try:
        from app.models.user_models import ProfileCreationRequest
        
        # Convert dict to ProfileCreationRequest
        profile_creation = ProfileCreationRequest(**profile_request)
        
        # Create enhanced profile
        result = await firebase_service.create_enhanced_user_profile(
            uid=user["uid"],
            profile_request=profile_creation
        )
        
        if not result.success:
            raise HTTPException(
                status_code=400,
                detail=result.message
            )
        
        return {
            "success": True,
            "message": result.message,
            "profile": result.profile.dict() if result.profile else None,
            "completion_percentage": result.completion_percentage
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid profile data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating enhanced profile: {str(e)}"
        )

@router.get("/profile/enhanced", response_model=Dict[str, Any])
async def get_enhanced_profile(
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get comprehensive enhanced user profile"""
    firebase_service = get_firebase_service()
    
    if not firebase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )
    
    try:
        enhanced_profile = await firebase_service.get_enhanced_user_profile(user["uid"])
        
        if not enhanced_profile:
            raise HTTPException(
                status_code=404,
                detail="Enhanced profile not found"
            )
        
        return {
            "success": True,
            "profile": enhanced_profile.dict(),
            "ai_context_summary": enhanced_profile.ai_context_summary,
            "completion_percentage": enhanced_profile.metadata.profile_completion_percentage
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving enhanced profile: {str(e)}"
        )

@router.put("/profile/enhanced", response_model=Dict[str, Any])
async def update_enhanced_profile(
    update_request: Dict[str, Any],  # We'll validate this in the service layer
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Update specific sections of enhanced user profile"""
    firebase_service = get_firebase_service()
    
    if not firebase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )
    
    try:
        from app.models.user_models import ProfileUpdateRequest
        
        # Convert dict to ProfileUpdateRequest
        profile_update = ProfileUpdateRequest(**update_request)
        
        # Update enhanced profile
        result = await firebase_service.update_enhanced_user_profile(
            uid=user["uid"],
            update_request=profile_update
        )
        
        if not result.success:
            raise HTTPException(
                status_code=400,
                detail=result.message
            )
        
        return {
            "success": True,
            "message": result.message,
            "profile": result.profile.dict() if result.profile else None,
            "completion_percentage": result.completion_percentage
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid update data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating enhanced profile: {str(e)}"
        )

@router.get("/profile/ai-context", response_model=Dict[str, Any])
async def get_ai_context(
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get AI context information for personalized responses"""
    firebase_service = get_firebase_service()
    
    if not firebase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )
    
    try:
        ai_context = await firebase_service.get_ai_context_for_user(user["uid"])
        
        if not ai_context:
            raise HTTPException(
                status_code=404,
                detail="AI context not found. Please complete your profile first."
            )
        
        return {
            "success": True,
            "context": ai_context.user_context,
            "personalization_active": ai_context.personalization_active,
            "quality_score": ai_context.context_quality_score,
            "last_updated": ai_context.last_updated.isoformat() if ai_context.last_updated else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving AI context: {str(e)}"
        )

@router.post("/profile/fix-existing-user", response_model=Dict[str, Any])
async def fix_existing_user_profile(
    fix_request: Dict[str, Any]
):
    """
    ONE-TIME FIX: Update existing user with enhanced profile data
    For users created before enhanced profile system was implemented
    """
    firebase_service = get_firebase_service()
    
    if not firebase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )
    
    try:
        # Extract user identifier (email or user_id)
        user_email = fix_request.get("email")
        user_id = fix_request.get("user_id")
        signup_data = fix_request.get("signup_data", {})
        
        if not (user_email or user_id):
            raise HTTPException(
                status_code=400,
                detail="Either email or user_id is required"
            )
        
        # If only email provided, find user by email
        if user_email and not user_id:
            # This is a simplified approach - in production you'd need proper user lookup
            print(f"🔍 Looking up user by email: {user_email}")
            # For now, require user_id - can be enhanced later
            raise HTTPException(
                status_code=400,
                detail="Please provide user_id for existing user fixes"
            )
        
        print(f"🔧 FIXING existing user {user_id} with signup data: {signup_data}")
        
        from app.models.user_models import (
            ProfileCreationRequest, PersonalInfo, CompleteFarmProfile,
            FarmingProfile, LocationInfo, FarmDetails, SoilInformation,
            IrrigationSystem, ExperienceLevel, SoilType, IrrigationType
        )
        
        # Use same mapping logic as public signup endpoint
        full_name = signup_data.get("name", "Farmer")
        phone_number = signup_data.get("phone", "")
        
        personal_info = PersonalInfo(
            full_name=full_name,
            phone_number=phone_number
        )
        
        # Parse location
        location_str = signup_data.get("location", "")
        location_parts = [part.strip() for part in location_str.split(",")] if location_str else []
        
        location_info = LocationInfo(
            address=location_str or "Not specified",
            district=location_parts[0] if location_parts else "",
            state=location_parts[1] if len(location_parts) > 1 else "",
            country="India"
        )
        
        # Farm details
        try:
            farm_size = float(signup_data.get("farmSize", 0))
        except (ValueError, TypeError):
            farm_size = 0.0
        
        farm_details = FarmDetails(total_area=farm_size)
        
        # Soil information
        soil_type_mapping = {
            "chalky": SoilType.CHALKY, 
            "clay": SoilType.CLAY, 
            "clayey": SoilType.CLAYEY,
            "sandy": SoilType.SANDY,
            "loamy": SoilType.LOAMY, 
            "peaty": SoilType.PEATY, 
            "silty": SoilType.SILTY,
            "alluvial": SoilType.ALLUVIAL,
            "red": SoilType.RED,
            "laterite": SoilType.LATERITE,
            "black_cotton": SoilType.BLACK_COTTON,
            "saline": SoilType.SALINE
        }
        
        soil_type = soil_type_mapping.get(
            signup_data.get("soilType", "").lower(), 
            SoilType.LOAMY
        )
        
        soil_information = SoilInformation(primary_soil_type=soil_type)
        
        # Irrigation system
        irrigation_mapping = {
            "sprinkler": IrrigationType.SPRINKLER, 
            "drip": IrrigationType.DRIP,
            "flood": IrrigationType.FLOOD, 
            "center_pivot": IrrigationType.CENTER_PIVOT,
            "furrow": IrrigationType.FURROW,
            "basin": IrrigationType.BASIN,
            "border": IrrigationType.BORDER,
            "rainfed": IrrigationType.RAINFED,
            "micro_sprinkler": IrrigationType.MICRO_SPRINKLER
        }
        
        irrigation_raw = signup_data.get("irrigationType", "")
        irrigation_normalized = irrigation_raw.lower().replace(" irrigation", "").replace("_", "").strip()
        irrigation_type = irrigation_mapping.get(irrigation_normalized, IrrigationType.SPRINKLER)
        
        irrigation_system = IrrigationSystem(primary_method=irrigation_type)
        
        # Complete farm profile
        farm_profile = CompleteFarmProfile(
            location=location_info,
            farm_details=farm_details,
            soil_information=soil_information,
            irrigation_system=irrigation_system
        )
        
        # Farming profile
        farming_profile = FarmingProfile(
            experience_level=ExperienceLevel.BEGINNER,
            years_of_experience=1
        )
        
        # Create profile request
        profile_request = ProfileCreationRequest(
            personal_info=personal_info,
            farm_profile=farm_profile,
            farming_profile=farming_profile
        )
        
        # Create/Update enhanced profile
        result = await firebase_service.create_enhanced_user_profile(
            uid=user_id,
            profile_request=profile_request
        )
        
        if not result.success:
            raise HTTPException(
                status_code=400,
                detail=result.message
            )
        
        return {
            "success": True,
            "message": f"✅ FIXED: User profile updated successfully for {full_name}",
            "profile": result.profile.dict() if result.profile else None,
            "completion_percentage": result.completion_percentage,
            "fix_applied": "Enhanced profile created for existing user"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fixing user profile: {str(e)}"
        )

@router.post("/profile/ai-interaction", response_model=Dict[str, Any])
async def update_ai_interaction_history(
    interaction_data: Dict[str, Any],
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Update AI interaction history for learning and personalization"""
    firebase_service = get_firebase_service()
    
    if not firebase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )
    
    try:
        success = await firebase_service.update_ai_interaction_history(
            uid=user["uid"],
            interaction_data=interaction_data
        )
        
        if not success:
            raise HTTPException(
                status_code=400,
                detail="Failed to update AI interaction history"
            )
        
        return {
            "success": True,
            "message": "AI interaction history updated successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating AI interaction history: {str(e)}"
        )

@router.get("/profile/completion-status", response_model=Dict[str, Any])
async def get_profile_completion_status(
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get detailed profile completion status and recommendations"""
    firebase_service = get_firebase_service()
    
    if not firebase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )
    
    try:
        completion_status = await firebase_service.get_profile_completion_status(user["uid"])
        
        return {
            "success": True,
            "completion": completion_status
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting profile completion status: {str(e)}"
        )

@router.post("/profile/setup-from-signup-public", response_model=Dict[str, Any])
async def setup_profile_from_signup_data_public(
    request_data: Dict[str, Any]
):
    """
    PUBLIC ENDPOINT: Setup enhanced profile using signup form data with user ID
    No authentication required - called immediately after Firebase user creation
    """
    firebase_service = get_firebase_service()
    
    if not firebase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )
    
    try:
        # Extract user_id and signup_data from request
        user_id = request_data.get("user_id") or request_data.get("uid")
        signup_data = request_data.get("signup_data", {})
        
        if not user_id:
            raise HTTPException(
                status_code=400,
                detail="user_id is required"
            )
        
        print(f"🔍 DEBUG: Setting up enhanced profile for user {user_id}")
        print(f"🔍 DEBUG: Signup data: {signup_data}")
        
        from app.models.user_models import (
            ProfileCreationRequest, PersonalInfo, CompleteFarmProfile,
            FarmingProfile, LocationInfo, FarmDetails, SoilInformation,
            IrrigationSystem, ExperienceLevel, SoilType, IrrigationType
        )
        
        # Extract and map signup data to enhanced profile structure  
        # Handle multiple possible field name variations from frontend
        full_name = (
            signup_data.get("name") or 
            signup_data.get("fullName") or 
            signup_data.get("full_name") or
            signup_data.get("displayName") or
            ""
        )
        
        phone_number = (
            signup_data.get("phone") or
            signup_data.get("phoneNumber") or 
            signup_data.get("phone_number") or
            ""
        )
        
        print(f"🔍 DEBUG: Extracted - name: '{full_name}', phone: '{phone_number}'")
        
        personal_info = PersonalInfo(
            full_name=full_name,
            phone_number=phone_number
        )
        
        # Parse location (e.g., "Latur, Maharashtra")
        location_str = (
            signup_data.get("location") or
            signup_data.get("farm_location") or
            signup_data.get("address") or
            ""
        )
        
        print(f"🔍 DEBUG: Extracted location: '{location_str}'")
        
        location_parts = [part.strip() for part in location_str.split(",")]
        
        location_info = LocationInfo(
            district=location_parts[0] if location_parts else "",
            state=location_parts[1] if len(location_parts) > 1 else "",
            country="India"
        )
        
        # Farm details - handle multiple field name variations
        farm_size_raw = (
            signup_data.get("farmSize") or
            signup_data.get("farm_size") or
            signup_data.get("farmArea") or  
            signup_data.get("area") or
            0
        )
        
        # Convert to float safely
        try:
            farm_size = float(farm_size_raw) if farm_size_raw else 0.0
        except (ValueError, TypeError):
            farm_size = 0.0
        
        print(f"🔍 DEBUG: Extracted farm size: {farm_size} (from {farm_size_raw})")
        
        farm_details = FarmDetails(
            total_area=farm_size
        )
        
        # Soil information
        soil_type_mapping = {
            "chalky": SoilType.CHALKY,
            "clay": SoilType.CLAY,
            "sandy": SoilType.SANDY,
            "loamy": SoilType.LOAMY,
            "peaty": SoilType.PEATY,
            "silty": SoilType.SILTY
        }
        
        # Soil type - handle multiple field name variations
        soil_type_raw = (
            signup_data.get("soilType") or
            signup_data.get("soil_type") or
            signup_data.get("soilTypeValue") or
            ""
        )
        
        print(f"🔍 DEBUG: Extracted soil type: '{soil_type_raw}'")
        
        soil_type = soil_type_mapping.get(
            soil_type_raw.lower(), 
            SoilType.LOAMY
        )
        
        soil_information = SoilInformation(
            primary_soil_type=soil_type
        )
        
        # Irrigation system
        irrigation_mapping = {
            "sprinkler": IrrigationType.SPRINKLER,
            "drip": IrrigationType.DRIP,
            "flood": IrrigationType.FLOOD,
            "center_pivot": IrrigationType.CENTER_PIVOT,
            "furrow": IrrigationType.FURROW
        }
        
        # Irrigation type - handle multiple field name variations  
        irrigation_raw = (
            signup_data.get("irrigationType") or
            signup_data.get("irrigation_type") or
            signup_data.get("irrigationTypeValue") or
            signup_data.get("irrigation") or
            ""
        )
        
        # Handle "Furrow Irrigation" -> "furrow"
        irrigation_normalized = irrigation_raw.lower().replace(" irrigation", "").replace("_", "").strip()
        
        print(f"🔍 DEBUG: Extracted irrigation: '{irrigation_raw}' -> '{irrigation_normalized}'")
        
        irrigation_type = irrigation_mapping.get(
            irrigation_normalized,
            IrrigationType.SPRINKLER
        )
        
        irrigation_system = IrrigationSystem(
            primary_method=irrigation_type
        )
        
        # Complete farm profile
        farm_profile = CompleteFarmProfile(
            location=location_info,
            farm_details=farm_details,
            soil_information=soil_information,
            irrigation_system=irrigation_system
        )
        
        # Farming profile (set as beginner initially)
        farming_profile = FarmingProfile(
            experience_level=ExperienceLevel.BEGINNER,
            years_of_experience=1
        )
        
        # Create profile request
        profile_request = ProfileCreationRequest(
            personal_info=personal_info,
            farm_profile=farm_profile,
            farming_profile=farming_profile
        )
        
        # Create enhanced profile
        result = await firebase_service.create_enhanced_user_profile(
            uid=user_id,
            profile_request=profile_request
        )
        
        if not result.success:
            raise HTTPException(
                status_code=400,
                detail=result.message
            )
        
        return {
            "success": True,
            "message": f"Enhanced profile setup completed for {personal_info.full_name}!",
            "profile": result.profile.dict() if result.profile else None,
            "completion_percentage": result.completion_percentage,
            "setup_source": "public_signup_endpoint"
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid signup data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error setting up profile from signup data: {str(e)}"
        )

@router.post("/profile/setup-from-signup", response_model=Dict[str, Any])
async def setup_profile_from_signup_data(
    signup_data: Dict[str, Any],
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Setup enhanced profile using signup form data (Authenticated version)"""
    firebase_service = get_firebase_service()
    
    if not firebase_service.is_connected():
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )
    
    try:
        from app.models.user_models import (
            ProfileCreationRequest, PersonalInfo, CompleteFarmProfile,
            FarmingProfile, LocationInfo, FarmDetails, SoilInformation,
            IrrigationSystem, ExperienceLevel, SoilType, IrrigationType
        )
        
        # DEBUG: Log the received signup data
        print(f"🔍 DEBUG: Received signup data: {signup_data}")
        
        # Extract and map signup data to enhanced profile structure  
        # Handle multiple possible field name variations from frontend
        full_name = (
            signup_data.get("name") or 
            signup_data.get("fullName") or 
            signup_data.get("full_name") or
            signup_data.get("displayName") or
            ""
        )
        
        phone_number = (
            signup_data.get("phone") or
            signup_data.get("phoneNumber") or 
            signup_data.get("phone_number") or
            ""
        )
        
        print(f"🔍 DEBUG: Extracted - name: '{full_name}', phone: '{phone_number}'")
        
        personal_info = PersonalInfo(
            full_name=full_name,
            phone_number=phone_number
        )
        
        # Parse location (e.g., "Latur, Maharashtra")
        location_str = (
            signup_data.get("location") or
            signup_data.get("farm_location") or
            signup_data.get("address") or
            ""
        )
        
        print(f"🔍 DEBUG: Extracted location: '{location_str}'")
        
        location_parts = [part.strip() for part in location_str.split(",")]
        
        location_info = LocationInfo(
            district=location_parts[0] if location_parts else "",
            state=location_parts[1] if len(location_parts) > 1 else "",
            country="India"
        )
        
        # Farm details - handle multiple field name variations
        farm_size_raw = (
            signup_data.get("farmSize") or
            signup_data.get("farm_size") or
            signup_data.get("farmArea") or  
            signup_data.get("area") or
            0
        )
        
        # Convert to float safely
        try:
            farm_size = float(farm_size_raw) if farm_size_raw else 0.0
        except (ValueError, TypeError):
            farm_size = 0.0
        
        print(f"🔍 DEBUG: Extracted farm size: {farm_size} (from {farm_size_raw})")
        
        farm_details = FarmDetails(
            total_area=farm_size
        )
        
        # Soil information
        soil_type_mapping = {
            "chalky": SoilType.CHALKY,
            "clay": SoilType.CLAY,
            "sandy": SoilType.SANDY,
            "loamy": SoilType.LOAMY,
            "peaty": SoilType.PEATY,
            "silty": SoilType.SILTY
        }
        
        # Soil type - handle multiple field name variations
        soil_type_raw = (
            signup_data.get("soilType") or
            signup_data.get("soil_type") or
            signup_data.get("soilTypeValue") or
            ""
        )
        
        print(f"🔍 DEBUG: Extracted soil type: '{soil_type_raw}'")
        
        soil_type = soil_type_mapping.get(
            soil_type_raw.lower(), 
            SoilType.LOAMY
        )
        
        soil_information = SoilInformation(
            primary_soil_type=soil_type
        )
        
        # Irrigation system
        irrigation_mapping = {
            "sprinkler": IrrigationType.SPRINKLER,
            "drip": IrrigationType.DRIP,
            "flood": IrrigationType.FLOOD,
            "center_pivot": IrrigationType.CENTER_PIVOT,
            "furrow": IrrigationType.FURROW
        }
        
        # Irrigation type - handle multiple field name variations  
        irrigation_raw = (
            signup_data.get("irrigationType") or
            signup_data.get("irrigation_type") or
            signup_data.get("irrigationTypeValue") or
            signup_data.get("irrigation") or
            ""
        )
        
        # Handle "Furrow Irrigation" -> "furrow"
        irrigation_normalized = irrigation_raw.lower().replace(" irrigation", "").replace("_", "").strip()
        
        print(f"🔍 DEBUG: Extracted irrigation: '{irrigation_raw}' -> '{irrigation_normalized}'")
        
        irrigation_type = irrigation_mapping.get(
            irrigation_normalized,
            IrrigationType.SPRINKLER
        )
        
        irrigation_system = IrrigationSystem(
            primary_method=irrigation_type
        )
        
        # Complete farm profile
        farm_profile = CompleteFarmProfile(
            location=location_info,
            farm_details=farm_details,
            soil_information=soil_information,
            irrigation_system=irrigation_system
        )
        
        # Farming profile (set as beginner initially)
        farming_profile = FarmingProfile(
            experience_level=ExperienceLevel.BEGINNER,
            years_of_experience=1
        )
        
        # Create profile request
        profile_request = ProfileCreationRequest(
            personal_info=personal_info,
            farm_profile=farm_profile,
            farming_profile=farming_profile
        )
        
        # Create enhanced profile
        result = await firebase_service.create_enhanced_user_profile(
            uid=user["uid"],
            profile_request=profile_request
        )
        
        if not result.success:
            raise HTTPException(
                status_code=400,
                detail=result.message
            )
        
        return {
            "success": True,
            "message": f"Profile setup completed for {personal_info.full_name}!",
            "profile": result.profile.dict() if result.profile else None,
            "completion_percentage": result.completion_percentage,
            "setup_source": "signup_form"
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid signup data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error setting up profile from signup data: {str(e)}"
        )

def _calculate_profile_completion(user_profile: Dict[str, Any]) -> float:
    """Calculate profile completion percentage (legacy method)"""
    profile = user_profile.get("profile", {})
    required_fields = ["farm_location", "farm_size", "farming_experience", "primary_crops"]
    completed_fields = sum(1 for field in required_fields if profile.get(field))
    return round((completed_fields / len(required_fields)) * 100, 1)

