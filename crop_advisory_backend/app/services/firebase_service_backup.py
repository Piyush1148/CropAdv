"""
Enhanced Firebase Admin SDK Service
Handles comprehensive user profiles, farm data, AI personalization,
analytics, and intelligent recommendations.

This service integrates with Firestore to provide:
- User profile management with enhanced validation  
- Farm and agricultural data tracking
- AI personalization and context generation
- Chat session and interaction management
- Analytics and performance insights

Key Features:
- Legacy profile conversion for backward compatibility
- Comprehensive null-safe operations
- Enhanced user profiling with Pydantic validation
- Intelligent context generation for AI responses
"""

import os
import re
import asyncio
import hashlib
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Any, Union
from collections import defaultdict
import firebase_admin
from firebase_admin import credentials, firestore, auth
from firebase_admin.exceptions import FirebaseError
import logging
from google.api_core.exceptions import NotFound
from google.cloud import firestore as gcp_firestore
from google.cloud.firestore_v1.base_query import FieldFilter

# Configure logging for this module  
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FirebaseService:
    """Enhanced Firebase service with comprehensive user management"""
    
    def __init__(self):
        self.db = None
        self.admin_sdk_initialized = False
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            if not firebase_admin._apps:
                # Check for service account key file first
                service_account_path = "./serviceAccountKey.json"
                if os.path.exists(service_account_path):
                    cred = credentials.Certificate(service_account_path)
                    print(f"✅ Using service account file: {service_account_path}")
                else:
                    # Fallback to environment variables
                    cred = self._create_credentials_from_env()
                    print("✅ Using environment variables for Firebase credentials")
                
                firebase_admin.initialize_app(cred)
                print("✅ Firebase Admin SDK initialized")
            
            self.db = firestore.client()
            self.admin_sdk_initialized = True
            print("✅ Firestore client initialized")
            
        except Exception as e:
            print(f"❌ Error initializing Firebase: {str(e)}")
            self.db = None
            self.admin_sdk_initialized = False

    def _create_credentials_from_env(self):
        """Create Firebase credentials from environment variables"""
        project_id = os.getenv("FIREBASE_PROJECT_ID")
        if not project_id:
            raise ValueError("FIREBASE_PROJECT_ID environment variable is required")
        
        firebase_config = {
            "type": "service_account",
            "project_id": project_id,
            "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
            "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.getenv("FIREBASE_CLIENT_ID"),
            "auth_uri": os.getenv("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth"),
            "token_uri": os.getenv("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
        }
        
        return credentials.Certificate(firebase_config)
    
    def is_connected(self) -> bool:
        """Check if Firestore is connected"""
        return self.db is not None
    
    # ==================== USER MANAGEMENT ====================
    
    async def create_user_profile(self, uid: str, user_data: Dict[str, Any]) -> bool:
        """Create user profile in Firestore"""
        if not self.db:
            return False
        
        try:
            # Add defensive programming to handle cases where user_data might not be a dict
            if not isinstance(user_data, dict):
                print(f"⚠️ WARNING: user_data is not a dictionary, type: {type(user_data)}, value: {user_data}")
                # Convert to safe default dictionary if user_data is not a dict
                user_data = {
                    "email": str(user_data) if user_data else f"user{uid[-8:]}@cropadvisor.com",
                    "display_name": "Farmer"
                }
            
            # Ensure we have safe defaults for all fields
                print(f"⚠️ WARNING: user_data is not a dictionary, type: {type(user_data)}, value: {user_data}")
                # Convert to safe default dictionary if user_data is not a dict
                user_data = {
                    "email": str(user_data) if user_data else f"user{uid[-8:]}@cropadvisor.com",
                    "display_name": "Farmer"
                }
            
            # Ensure we have safe defaults for all fields
            display_name = user_data.get("display_name") or user_data.get("name") or "Farmer"abase operations
Supports complete personal AI assistant functionality with detailed agricultural context
"""

import firebase_admin
from firebase_admin import credentials, firestore, auth
from typing import Optional, Dict, Any, List, Union
import json
import os
import logging
from datetime import datetime, date
from google.cloud.firestore_v1.base_query import FieldFilter

# Import our comprehensive user models
try:
    from app.models.user_models import (
        EnhancedUserProfile, PersonalInfo, CompleteFarmProfile, FarmingProfile,
        AIPersonalization, ProfileMetadata, ProfileCreationRequest, ProfileUpdateRequest,
        ProfileResponse, AIContextResponse, LocationInfo, Coordinates, FarmDetails,
        SoilInformation, IrrigationSystem, Infrastructure, VerificationStatus
    )
    ENHANCED_MODELS_AVAILABLE = True
except ImportError as e:
    # Fallback if models not available yet
    logging.warning(f"Enhanced user models not found: {e}, using basic functionality")
    ENHANCED_MODELS_AVAILABLE = False
    
    # Define minimal placeholders to prevent NameError
    class ProfileCreationRequest:
        pass
    class ProfileUpdateRequest:
        pass
    class ProfileResponse:
        pass
    class AIContextResponse:
        pass
    class EnhancedUserProfile:
        pass

# Configure logging for detailed operation tracking
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FirebaseService:
    """Firebase Admin SDK service for Firestore and Auth operations"""
    
    def __init__(self):
        self.db = None
        self.app = None
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if already initialized
            if firebase_admin._DEFAULT_APP_NAME in firebase_admin._apps:
                self.app = firebase_admin.get_app()
                print("✅ Using existing Firebase app")
            else:
                # Initialize from service account key or environment variables
                cred = self._get_credentials()
                self.app = firebase_admin.initialize_app(cred)
                print("✅ Firebase Admin SDK initialized")
            
            # Initialize Firestore
            self.db = firestore.client()
            print("✅ Firestore client initialized")
            
        except Exception as e:
            print(f"❌ Firebase initialization error: {str(e)}")
            self.db = None
    
    def _get_credentials(self) -> credentials.Certificate:
        """Get Firebase credentials from environment or service account file"""
        
        # Option 1: Try service account file
        service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "./firebase-service-account.json")
        if os.path.exists(service_account_path):
            return credentials.Certificate(service_account_path)
        
        # Option 2: Use environment variables
        project_id = os.getenv("FIREBASE_PROJECT_ID")
        if not project_id:
            raise ValueError("Firebase project ID not found in environment variables")
        
        # Create credentials from environment variables
        firebase_config = {
            "type": "service_account",
            "project_id": project_id,
            "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
            "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.getenv("FIREBASE_CLIENT_ID"),
            "auth_uri": os.getenv("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth"),
            "token_uri": os.getenv("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
        }
        
        return credentials.Certificate(firebase_config)
    
    def is_connected(self) -> bool:
        """Check if Firestore is connected"""
        return self.db is not None
    
    # ==================== USER MANAGEMENT ====================
    
    async def create_user_profile(self, uid: str, user_data: Dict[str, Any]) -> bool:
        """Create user profile in Firestore"""
        if not self.db:
            return False
        
        try:
            # Add defensive programming to handle cases where user_data might not be a dict
            if not isinstance(user_data, dict):
                print(f"⚠️ WARNING: user_data is not a dictionary, type: {type(user_data)}, value: {user_data}")
                # Convert to safe default dictionary if user_data is not a dict
                user_data = {
                    "email": str(user_data) if user_data else f"user{uid[-8:]}@cropadvisor.com",
                    "display_name": "Farmer"
                }
            
            # Ensure we have safe defaults for all fields
            display_name = user_data.get("display_name") or user_data.get("name") or "Farmer"
            
            user_doc = {
                "uid": uid,
                "email": user_data.get("email") or f"user{uid[-8:]}@cropadvisor.com",
                "display_name": display_name,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "profile": {
                    "farm_location": user_data.get("farm_location") or "",
                    "farm_size": max(user_data.get("farm_size", 1), 1),  # Minimum 1 acre
                    "farming_experience": user_data.get("farming_experience") or "beginner",
                    "primary_crops": user_data.get("primary_crops", ["wheat", "rice"])  # Default crops
                },
                "preferences": {
                    "language": user_data.get("language", "en"),
                    "notification_enabled": True,
                    "weather_alerts": True
                }
            }
            
            self.db.collection("users").document(uid).set(user_doc)
            print(f"✅ User profile created for UID: {uid}")
            return True
            
        except Exception as e:
            print(f"❌ Error creating user profile: {str(e)}")
            return False
    
    async def get_user_profile(self, uid: str) -> Optional[Dict[str, Any]]:
        """Get user profile from Firestore"""
        if not self.db:
            return None
        
        try:
            doc = self.db.collection("users").document(uid).get()
            if doc.exists:
                return doc.to_dict()
            return None
            
        except Exception as e:
            print(f"❌ Error getting user profile: {str(e)}")
            return None
    
    async def update_user_profile(self, uid: str, update_data: Dict[str, Any]) -> bool:
        """Update user profile in Firestore"""
        if not self.db:
            return False
        
        try:
            update_data["updated_at"] = datetime.utcnow()
            self.db.collection("users").document(uid).update(update_data)
            print(f"✅ User profile updated for UID: {uid}")
            return True
            
        except Exception as e:
            print(f"❌ Error updating user profile: {str(e)}")
            return False
    
    # ==================== ENHANCED USER PROFILE MANAGEMENT ====================
    
    async def create_enhanced_user_profile(self, uid: str, profile_request: ProfileCreationRequest) -> ProfileResponse:
        """Create comprehensive user profile with farm details and AI personalization"""
        if not ENHANCED_MODELS_AVAILABLE:
            return ProfileResponse(
                success=False,
                message="Enhanced models not available",
                profile=None
            )
        
        if not self.db:
            return ProfileResponse(
                success=False,
                message="Database service unavailable",
                profile=None
            )
        
        try:
            logger.info(f"Creating enhanced profile for user: {uid}")
            
            # Create the enhanced user profile
            enhanced_profile = EnhancedUserProfile(
                uid=uid,
                email=profile_request.personal_info.full_name + "@temp.com",  # Will be updated with real email
                display_name=profile_request.personal_info.full_name,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                personal_info=profile_request.personal_info,
                farm_profile=profile_request.farm_profile,
                farming_profile=profile_request.farming_profile or FarmingProfile(experience_level="beginner"),
                ai_personalization=profile_request.ai_personalization or AIPersonalization()
            )
            
            # Calculate and update metadata
            enhanced_profile.update_metadata()
            
            # Convert to dictionary for Firestore storage
            profile_dict = self._profile_to_firestore_dict(enhanced_profile)
            
            # Save to Firestore
            self.db.collection("users").document(uid).set(profile_dict)
            
            # Also create user preferences collection for quick AI context access
            ai_context = {
                "user_id": uid,
                "context_summary": enhanced_profile.ai_context_summary,
                "last_updated": datetime.utcnow(),
                "personalization_active": True
            }
            self.db.collection("user_preferences").document(uid).set(ai_context)
            
            logger.info(f"✅ Enhanced profile created for UID: {uid} with {enhanced_profile.metadata.profile_completion_percentage}% completion")
            
            return ProfileResponse(
                success=True,
                message="Enhanced profile created successfully",
                profile=enhanced_profile,
                completion_percentage=enhanced_profile.metadata.profile_completion_percentage
            )
            
        except Exception as e:
            logger.error(f"❌ Error creating enhanced profile for {uid}: {str(e)}")
            return ProfileResponse(
                success=False,
                message=f"Failed to create profile: {str(e)}",
                profile=None
            )
    
    async def get_enhanced_user_profile(self, uid: str) -> Optional[EnhancedUserProfile]:
        """Get comprehensive enhanced user profile"""
        if not self.db:
            return None
        
        try:
            logger.info(f"Retrieving enhanced profile for user: {uid}")
            
            # Get profile document from Firestore
            doc = self.db.collection("users").document(uid).get()
            
            if not doc.exists:
                logger.warning(f"No profile found for user: {uid}")
                return None
            
            profile_data = doc.to_dict()
            
            # Convert Firestore document back to EnhancedUserProfile
            enhanced_profile = self._firestore_dict_to_profile(profile_data)
            
            logger.info(f"✅ Retrieved enhanced profile for {uid}")
            return enhanced_profile
            
        except Exception as e:
            logger.error(f"❌ Error retrieving enhanced profile for {uid}: {str(e)}")
            return None
    
    async def update_enhanced_user_profile(self, uid: str, update_request: ProfileUpdateRequest) -> ProfileResponse:
        """Update specific sections of enhanced user profile"""
        if not self.db:
            return ProfileResponse(
                success=False,
                message="Database service unavailable"
            )
        
        try:
            logger.info(f"Updating enhanced profile for user: {uid}")
            
            # Get existing profile
            existing_profile = await self.get_enhanced_user_profile(uid)
            if not existing_profile:
                return ProfileResponse(
                    success=False,
                    message="Profile not found for update"
                )
            
            # Apply updates selectively
            if update_request.personal_info:
                existing_profile.personal_info = update_request.personal_info
            
            if update_request.farm_profile:
                existing_profile.farm_profile = update_request.farm_profile
            
            if update_request.farming_profile:
                existing_profile.farming_profile = update_request.farming_profile
            
            if update_request.ai_personalization:
                existing_profile.ai_personalization = update_request.ai_personalization
            
            # Update metadata
            existing_profile.update_metadata()
            
            # Convert and save to Firestore
            profile_dict = self._profile_to_firestore_dict(existing_profile)
            self.db.collection("users").document(uid).update(profile_dict)
            
            # Update AI context cache
            await self._update_ai_context_cache(uid, existing_profile)
            
            logger.info(f"✅ Enhanced profile updated for {uid}")
            
            return ProfileResponse(
                success=True,
                message="Profile updated successfully",
                profile=existing_profile,
                completion_percentage=existing_profile.metadata.profile_completion_percentage
            )
            
        except Exception as e:
            logger.error(f"❌ Error updating enhanced profile for {uid}: {str(e)}")
            return ProfileResponse(
                success=False,
                message=f"Failed to update profile: {str(e)}"
            )
    
    async def get_ai_context_for_user(self, uid: str) -> Optional[AIContextResponse]:
        """Get AI context information for personalized responses"""
        if not self.db:
            return None
        
        try:
            logger.info(f"Retrieving AI context for user: {uid}")
            
            # Try to get from cache first (user_preferences collection)
            cache_doc = self.db.collection("user_preferences").document(uid).get()
            
            if cache_doc.exists:
                cache_data = cache_doc.to_dict()
                
                # Check if cache is fresh (less than 24 hours old)
                last_updated = cache_data.get("last_updated")
                if last_updated and (datetime.utcnow() - last_updated).total_seconds() < 86400:
                    return AIContextResponse(
                        user_context=cache_data.get("context_summary", {}),
                        personalization_active=cache_data.get("personalization_active", False),
                        context_quality_score=cache_data.get("quality_score"),
                        last_updated=last_updated
                    )
            
            # If no cache or stale cache, get from main profile
            enhanced_profile = await self.get_enhanced_user_profile(uid)
            
            if not enhanced_profile:
                logger.warning(f"No profile found for AI context: {uid}")
                return None
            
            # Generate fresh AI context
            ai_context = enhanced_profile.ai_context_summary
            quality_score = self._calculate_context_quality_score(enhanced_profile)
            
            # Update cache
            cache_data = {
                "user_id": uid,
                "context_summary": ai_context,
                "last_updated": datetime.utcnow(),
                "personalization_active": True,
                "quality_score": quality_score
            }
            self.db.collection("user_preferences").document(uid).set(cache_data)
            
            logger.info(f"✅ AI context retrieved for {uid} with quality score: {quality_score}")
            
            return AIContextResponse(
                user_context=ai_context,
                personalization_active=True,
                context_quality_score=quality_score,
                last_updated=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"❌ Error retrieving AI context for {uid}: {str(e)}")
            return None
    
    async def update_ai_interaction_history(self, uid: str, interaction_data: Dict[str, Any]) -> bool:
        """Update AI interaction history for learning and personalization"""
        if not self.db:
            return False
        
        try:
            logger.info(f"Updating AI interaction history for user: {uid}")
            
            # Get current profile
            profile = await self.get_enhanced_user_profile(uid)
            if not profile:
                return False
            
            # Update interaction history
            interaction_history = profile.ai_personalization.interaction_history
            
            # Increment conversation count
            interaction_history.total_conversations += 1
            
            # Add topics from current interaction
            topics = interaction_data.get("topics", [])
            for topic in topics:
                if topic not in interaction_history.favorite_topics:
                    interaction_history.favorite_topics.append(topic)
            
            # Keep only top 10 topics
            interaction_history.favorite_topics = interaction_history.favorite_topics[-10:]
            
            # Add rating if provided
            rating = interaction_data.get("rating")
            if rating is not None and 1 <= rating <= 5:
                interaction_history.response_ratings.append(float(rating))
                # Keep only last 50 ratings
                interaction_history.response_ratings = interaction_history.response_ratings[-50:]
            
            # Track successful recommendations
            if interaction_data.get("recommendation_followed"):
                rec_id = interaction_data.get("recommendation_id", "unknown")
                interaction_history.successful_recommendations.append(rec_id)
                interaction_history.successful_recommendations = interaction_history.successful_recommendations[-20:]
            
            # Update last interaction timestamp
            profile.ai_personalization.last_interaction = datetime.utcnow()
            
            # Save updated profile
            profile_dict = self._profile_to_firestore_dict(profile)
            self.db.collection("users").document(uid).update({
                "ai_personalization": profile_dict["ai_personalization"],
                "updated_at": datetime.utcnow()
            })
            
            # Update AI context cache
            await self._update_ai_context_cache(uid, profile)
            
            logger.info(f"✅ AI interaction history updated for {uid}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error updating AI interaction history for {uid}: {str(e)}")
            return False
    
    async def get_profile_completion_status(self, uid: str) -> Dict[str, Any]:
        """Get detailed profile completion status and missing fields"""
        try:
            profile = await self.get_enhanced_user_profile(uid)
            
            if not profile:
                return {
                    "completion_percentage": 0,
                    "missing_fields": ["All profile data"],
                    "recommendations": ["Complete initial profile setup"]
                }
            
            missing_fields = []
            recommendations = []
            
            # Check essential fields
            if not profile.personal_info.phone_number:
                missing_fields.append("Phone number")
                recommendations.append("Add phone number for account security")
            
            if not profile.farm_profile.location.coordinates:
                missing_fields.append("Farm location coordinates")
                recommendations.append("Set precise farm location for weather integration")
            
            if not profile.farming_profile.primary_crops:
                missing_fields.append("Primary crops")
                recommendations.append("Add your main crops for better recommendations")
            
            if profile.farming_profile.experience_level.value == "beginner" and not profile.farming_profile.years_of_experience:
                missing_fields.append("Years of experience")
                recommendations.append("Add farming experience for personalized advice")
            
            if not profile.farm_profile.soil_information.soil_ph:
                missing_fields.append("Soil pH level")
                recommendations.append("Add soil test results for precise fertilizer recommendations")
            
            return {
                "completion_percentage": profile.metadata.profile_completion_percentage,
                "missing_fields": missing_fields,
                "recommendations": recommendations,
                "profile_quality_score": self._calculate_context_quality_score(profile),
                "last_updated": profile.metadata.last_profile_update
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting profile completion status for {uid}: {str(e)}")
            return {"completion_percentage": 0, "error": str(e)}
    
    # ==================== UTILITY METHODS FOR PROFILE MANAGEMENT ====================
    
    def _profile_to_firestore_dict(self, profile: EnhancedUserProfile) -> Dict[str, Any]:
        """Convert EnhancedUserProfile to Firestore-compatible dictionary"""
        try:
            # Convert Pydantic model to dict and handle special types
            profile_dict = profile.dict()
            
            # Convert datetime objects to Firestore timestamps
            for key, value in profile_dict.items():
                if isinstance(value, datetime):
                    profile_dict[key] = value
                elif isinstance(value, dict):
                    profile_dict[key] = self._convert_nested_datetimes(value)
            
            return profile_dict
            
        except Exception as e:
            logger.error(f"Error converting profile to Firestore dict: {str(e)}")
            raise
    
    def _firestore_dict_to_profile(self, profile_data: Dict[str, Any]) -> EnhancedUserProfile:
        """Convert Firestore dictionary back to EnhancedUserProfile with legacy support"""
        try:
            # Check if this is a legacy profile (missing enhanced fields)
            is_legacy = not all(key in profile_data for key in ['personal_info', 'farm_profile', 'farming_profile'])
            
            if is_legacy:
                logger.info(f"Converting legacy profile to enhanced profile format")
                return self._convert_legacy_profile_to_enhanced(profile_data)
            
            # Convert Firestore timestamps back to datetime objects
            converted_data = self._convert_firestore_timestamps(profile_data)
            
            # Create EnhancedUserProfile from converted data
            return EnhancedUserProfile(**converted_data)
            
        except Exception as e:
            logger.error(f"Error converting Firestore dict to profile: {str(e)}")
            # Try legacy conversion as fallback
            try:
                return self._convert_legacy_profile_to_enhanced(profile_data)
            except:
                raise e
    
    def _convert_nested_datetimes(self, data: Union[Dict, List, Any]) -> Any:
        """Recursively convert datetime objects in nested structures"""
        if isinstance(data, dict):
            return {k: self._convert_nested_datetimes(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._convert_nested_datetimes(item) for item in data]
        elif isinstance(data, datetime):
            return data  # Firestore handles datetime objects
        elif isinstance(data, date):
            return datetime.combine(data, datetime.min.time())  # Convert date to datetime
        else:
            return data
    
    def _convert_firestore_timestamps(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert Firestore timestamps back to datetime objects"""
        converted = {}
        for key, value in data.items():
            if hasattr(value, 'timestamp'):  # Firestore timestamp
                converted[key] = value.timestamp()
            elif isinstance(value, dict):
                converted[key] = self._convert_firestore_timestamps(value)
            else:
                converted[key] = value
        return converted
    
    def _calculate_context_quality_score(self, profile: EnhancedUserProfile) -> float:
        """Calculate quality score for AI context (0-10 scale)"""
        try:
            score = 0.0
            max_score = 10.0
            
            # Essential information (40% of score)
            if profile.personal_info.full_name:
                score += 1.0
            if profile.farm_profile.location.coordinates:
                score += 1.5
            if profile.farm_profile.farm_details.total_area > 0:
                score += 1.0
            if profile.farm_profile.soil_information.primary_soil_type:
                score += 0.5
            
            # Farm details (30% of score)
            if profile.farming_profile.primary_crops:
                score += 1.0
            if profile.farming_profile.experience_level:
                score += 0.5
            if profile.farm_profile.irrigation_system.primary_method:
                score += 0.5
            if profile.farm_profile.soil_information.soil_ph:
                score += 1.0
            
            # AI personalization (30% of score)
            if profile.ai_personalization.interaction_history.total_conversations > 0:
                score += 1.0
            if profile.ai_personalization.interaction_history.response_ratings:
                score += 1.0
            
            return round(min(score, max_score), 1)
            
        except Exception as e:
            logger.error(f"Error calculating context quality score: {str(e)}")
            return 0.0
    
    async def _update_ai_context_cache(self, uid: str, profile: EnhancedUserProfile) -> bool:
        """Update AI context cache in user_preferences collection"""
        try:
            ai_context = {
                "user_id": uid,
                "context_summary": profile.ai_context_summary,
                "last_updated": datetime.utcnow(),
                "personalization_active": True,
                "quality_score": self._calculate_context_quality_score(profile)
            }
            
            self.db.collection("user_preferences").document(uid).set(ai_context)
            return True
            
        except Exception as e:
            logger.error(f"Error updating AI context cache for {uid}: {str(e)}")
            return False
    
    def _convert_legacy_profile_to_enhanced(self, legacy_data: Dict[str, Any]) -> EnhancedUserProfile:
        """Convert legacy user profile to enhanced profile format"""
        try:
            if not ENHANCED_MODELS_AVAILABLE:
                raise Exception("Enhanced models not available for legacy conversion")
            
            from app.models.user_models import (
                PersonalInfo, LocationInfo, FarmDetails, SoilInformation, 
                IrrigationSystem, CompleteFarmProfile, FarmingProfile,
                SoilType, IrrigationType, ExperienceLevel, AIPersonalization
            )
            
            # Extract basic user info
            uid = legacy_data.get('uid', 'unknown')
            email = legacy_data.get('email', 'unknown@legacy.com')
            display_name = legacy_data.get('display_name') or legacy_data.get('name', 'Unknown User')
            created_at = legacy_data.get('created_at', datetime.utcnow())
            updated_at = legacy_data.get('updated_at', datetime.utcnow())
            
            # Create personal info from legacy data with safe defaults
            phone_number = legacy_data.get('phone_number') or legacy_data.get('phone')
            # If no phone number, generate a safe default based on user ID
            if not phone_number:
                phone_number = f"+91{uid[-10:].zfill(10)}"  # Use last 10 chars of UID as phone number
            
            personal_info = PersonalInfo(
                full_name=display_name if display_name and display_name != "null" else "Farmer",
                phone_number=phone_number,
                date_of_birth=None,
                gender=None
            )
            
            # Create location info from legacy data with safe handling
            profile = legacy_data.get('profile', {}) or {}
            farm_location = legacy_data.get('location', '') or profile.get('farm_location', '') or ''
            
            # Handle empty or null location values
            if not farm_location or farm_location.strip() == '' or farm_location.lower() == 'null':
                farm_location = 'Unknown Location, Uttar Pradesh'
            
            # Parse location string (e.g., "City, State")
            location_parts = [part.strip() for part in farm_location.split(',') if part.strip()]
            
            # Provide defaults for required fields
            district_name = location_parts[0] if location_parts else 'Unknown District'
            state_name = location_parts[1] if len(location_parts) > 1 else 'uttar pradesh'  # Default to UP as most common
            
            location_info = LocationInfo(
                address=farm_location if farm_location != 'Unknown Location' else f"{district_name}, {state_name.title()}, India",
                district=district_name,
                state=state_name.lower(),  # Ensure lowercase for validation
                country='India',
                postal_code=None
            )
            
            # Create farm details with safe parsing
            # Parse farm size from string like "10 acres" or just "10"
            farm_size_str = legacy_data.get('farm_size') or profile.get('farm_size') or '1'
            
            # Handle null, empty, or zero farm size
            if not farm_size_str or farm_size_str == 0 or str(farm_size_str).lower() == 'null':
                farm_size_str = '1'
                
            try:
                # Extract numeric value from string like "10 acres" or "10.5"
                import re
                numeric_match = re.search(r'[\d.]+', str(farm_size_str))
                total_area = float(numeric_match.group()) if numeric_match else 1.0
                # Ensure minimum area of 0.1 for validation
                total_area = max(total_area, 0.1)
            except (ValueError, AttributeError):
                total_area = 1.0  # Default fallback
                
            farm_details = FarmDetails(
                total_area=total_area,
                cultivated_area=None,
                area_unit='acres',  # Default assumption
                farm_type='mixed',
                ownership_type='owned'
            )
            
            # Create soil information with defaults
            soil_information = SoilInformation(
                primary_soil_type=SoilType.LOAMY,  # Default
                soil_ph=None,
                organic_content=None,
                nitrogen_level='medium',
                phosphorus_level='medium',
                potassium_level='medium',
                salinity_level='none'
            )
            
            # Create irrigation system with defaults
            irrigation_system = IrrigationSystem(
                primary_method=IrrigationType.FLOOD,  # Default assumption
                water_source=['borewell'],  # Must be a list with valid sources
                automation_level='manual',
                water_availability='moderate',
                efficiency_rating=None
            )
            
            # Create complete farm profile
            farm_profile = CompleteFarmProfile(
                location=location_info,
                farm_details=farm_details,
                soil_information=soil_information,
                irrigation_system=irrigation_system
            )
            
            # Create farming profile
            experience = profile.get('farming_experience', 'beginner')
            experience_level = ExperienceLevel.BEGINNER
            
            if 'intermediate' in str(experience).lower():
                experience_level = ExperienceLevel.INTERMEDIATE
            elif 'expert' in str(experience).lower() or 'advanced' in str(experience).lower():
                experience_level = ExperienceLevel.EXPERT
            
            # Parse primary crops from legacy data
            primary_crops = profile.get('primary_crops', [])
            if isinstance(primary_crops, str):
                primary_crops = [crop.strip() for crop in primary_crops.split(',') if crop.strip()]
            elif not isinstance(primary_crops, list):
                primary_crops = []
            
            farming_profile = FarmingProfile(
                experience_level=experience_level,
                years_of_experience=None,
                primary_crops=primary_crops[:5],  # Limit to 5 crops
                farming_methods=['traditional'],  # Default assumption
                certifications=[]
            )
            
            # Create AI personalization with defaults
            ai_personalization = AIPersonalization()
            
            # Create enhanced profile
            enhanced_profile = EnhancedUserProfile(
                uid=uid,
                email=email,
                display_name=display_name,
                created_at=created_at,
                updated_at=updated_at,
                personal_info=personal_info,
                farm_profile=farm_profile,
                farming_profile=farming_profile,
                ai_personalization=ai_personalization
            )
            
            # Update metadata
            enhanced_profile.update_metadata()
            
            logger.info(f"Successfully converted legacy profile for user {uid}")
            return enhanced_profile
            
        except Exception as e:
            logger.error(f"Failed to convert legacy profile: {str(e)}")
            raise

    # ==================== CROP RECOMMENDATIONS ====================
    
    async def save_prediction(self, uid: str, prediction_data: Dict[str, Any]) -> str:
        """Save crop prediction to Firestore"""
        if not self.db:
            return ""
        
        try:
            prediction_doc = {
                "user_id": uid,
                "timestamp": datetime.utcnow(),
                "input_data": prediction_data.get("input_data", {}),
                "recommendations": prediction_data.get("recommendations", []),
                "model_version": prediction_data.get("model_version", "1.0.0"),
                "accuracy": prediction_data.get("accuracy", 0),
                "location": prediction_data.get("location", ""),
                "season": prediction_data.get("season", "")
            }
            
            # Add document to predictions collection
            doc_ref = self.db.collection("predictions").add(prediction_doc)[1]
            print(f"✅ Prediction saved with ID: {doc_ref.id}")
            return doc_ref.id
            
        except Exception as e:
            print(f"❌ Error saving prediction: {str(e)}")
            return ""
    
    async def get_user_predictions(self, uid: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user's recent predictions"""
        if not self.db:
            return []
        
        try:
            # Query without order_by to avoid composite index requirement
            query = (self.db.collection("predictions")
                    .where("user_id", "==", uid))
            
            docs = query.stream()
            predictions = []
            
            for doc in docs:
                prediction = doc.to_dict()
                prediction["id"] = doc.id
                predictions.append(prediction)
            
            # Sort by timestamp in Python (most recent first)
            predictions.sort(key=lambda x: x.get("timestamp", datetime.min), reverse=True)
            
            # Apply limit after sorting
            return predictions[:limit]
            
        except Exception as e:
            print(f"❌ Error getting user predictions: {str(e)}")
            return []
    
    # ==================== CHAT HISTORY ====================
    
    async def save_chat_message(self, uid: str, message_data: Dict[str, Any]) -> str:
        """Save chat message to Firestore"""
        if not self.db:
            return ""
        
        try:
            message_doc = {
                "user_id": uid,
                "timestamp": datetime.utcnow(),
                "message": message_data.get("message", ""),
                "response": message_data.get("response", ""),
                "message_type": message_data.get("type", "question"),  # question, advice, prediction
                "context": message_data.get("context", {}),
                "helpful": None,  # User can rate later
                "tags": message_data.get("tags", [])
            }
            
            doc_ref = self.db.collection("chat_history").add(message_doc)[1]
            print(f"✅ Chat message saved with ID: {doc_ref.id}")
            return doc_ref.id
            
        except Exception as e:
            print(f"❌ Error saving chat message: {str(e)}")
            return ""
    
    async def get_chat_history(self, uid: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get user's chat history"""
        if not self.db:
            return []
        
        try:
            query = (self.db.collection("chat_history")
                    .where("user_id", "==", uid)
                    .order_by("timestamp", direction=firestore.Query.DESCENDING)
                    .limit(limit))
            
            docs = query.stream()
            messages = []
            
            for doc in docs:
                message = doc.to_dict()
                message["id"] = doc.id
                messages.append(message)
            
            return messages
            
        except Exception as e:
            print(f"❌ Error getting chat history: {str(e)}")
            return []
    
    # ==================== ANALYTICS ====================
    
    async def get_analytics_data(self, uid: str) -> Dict[str, Any]:
        """Get user analytics data"""
        if not self.db:
            return {}
        
        try:
            # Get prediction count
            predictions = await self.get_user_predictions(uid, limit=100)
            
            # Get chat interactions
            chat_messages = await self.get_chat_history(uid, limit=100)
            
            # Calculate analytics
            analytics = {
                "total_predictions": len(predictions),
                "total_chat_interactions": len(chat_messages),
                "most_recommended_crops": self._get_top_crops(predictions),
                "recent_activity": {
                    "last_prediction": predictions[0].get("timestamp") if predictions else None,
                    "last_chat": chat_messages[0].get("timestamp") if chat_messages else None
                },
                "success_metrics": {
                    "average_confidence": self._calculate_average_confidence(predictions),
                    "prediction_frequency": len(predictions) # Can be enhanced with time-based calculations
                }
            }
            
            return analytics
            
        except Exception as e:
            print(f"❌ Error getting analytics: {str(e)}")
            return {}
    
    def _get_top_crops(self, predictions: List[Dict]) -> List[str]:
        """Get most frequently recommended crops"""
        crop_counts = {}
        
        for prediction in predictions:
            recommendations = prediction.get("recommendations", [])
            for rec in recommendations:
                crop = rec.get("crop_name", "")
                crop_counts[crop] = crop_counts.get(crop, 0) + 1
        
        # Sort by count and return top 5
        sorted_crops = sorted(crop_counts.items(), key=lambda x: x[1], reverse=True)
        return [crop for crop, count in sorted_crops[:5]]
    
    def _calculate_average_confidence(self, predictions: List[Dict]) -> float:
        """Calculate average confidence of predictions"""
        if not predictions:
            return 0.0
        
        total_confidence = 0
        count = 0
        
        for prediction in predictions:
            recommendations = prediction.get("recommendations", [])
            for rec in recommendations:
                confidence = rec.get("confidence_score", 0)
                total_confidence += confidence
                count += 1
        
        return total_confidence / count if count > 0 else 0.0

# Global Firebase service instance
firebase_service = FirebaseService()

def get_firebase_service() -> FirebaseService:
    """Get Firebase service instance"""
    return firebase_service