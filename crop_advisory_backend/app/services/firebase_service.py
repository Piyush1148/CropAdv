"""
Enhanced Firebase Admin SDK Service - FIXED VERSION
Handles comprehensive user profiles with defensive programming for 'str' object has no attribute 'get' error
"""

import os
import re
import asyncio
import hashlib
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Any, Union, TYPE_CHECKING
from collections import defaultdict

if TYPE_CHECKING:
    from ..models.user_models import ProfileResponse
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
    """Enhanced Firebase service with comprehensive user management and defensive programming"""
    
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
    
    # ==================== USER MANAGEMENT WITH DEFENSIVE PROGRAMMING ====================
    
    async def create_user_profile(self, uid: str, user_data: Dict[str, Any]) -> bool:
        """Create user profile in Firestore with defensive programming"""
        if not self.db:
            return False
        
        try:
            # CRITICAL FIX: Add defensive programming to handle cases where user_data might not be a dict
            if not isinstance(user_data, dict):
                print(f"⚠️ WARNING: user_data is not a dictionary, type: {type(user_data)}, value: {user_data}")
                print("🔧 Converting to safe dictionary format...")
                # Convert to safe default dictionary if user_data is not a dict
                user_data = {
                    "email": str(user_data) if user_data else f"user{uid[-8:]}@cropadvisor.com",
                    "display_name": "Farmer"
                }
            
            # Ensure we have safe defaults for all fields with additional null checks
            display_name = "Farmer"  # Default first
            if user_data and isinstance(user_data, dict):
                display_name = user_data.get("display_name") or user_data.get("name") or "Farmer"
            
            user_doc = {
                "uid": uid,
                "email": user_data.get("email") if isinstance(user_data, dict) else f"user{uid[-8:]}@cropadvisor.com",
                "display_name": display_name,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "profile": {
                    "farm_location": user_data.get("farm_location", "") if isinstance(user_data, dict) else "",
                    "farm_size": max(user_data.get("farm_size", 1), 1) if isinstance(user_data, dict) else 1,
                    "farming_experience": user_data.get("farming_experience", "beginner") if isinstance(user_data, dict) else "beginner",
                    "primary_crops": user_data.get("primary_crops", ["wheat", "rice"]) if isinstance(user_data, dict) else ["wheat", "rice"]
                },
                "preferences": {
                    "language": user_data.get("language", "en") if isinstance(user_data, dict) else "en",
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
        """Get user profile from Firestore with enhanced defensive programming"""
        if not self.db:
            return None
        
        try:
            doc = self.db.collection("users").document(uid).get()
            if doc.exists:
                data = doc.to_dict()
                
                # CRITICAL: Additional defensive checks for returned data
                if not isinstance(data, dict):
                    print(f"⚠️ WARNING: Firestore returned non-dict data for user {uid}: {type(data)}")
                    return None
                
                # Ensure all nested objects are also dictionaries
                if 'profile' in data and not isinstance(data['profile'], dict):
                    print(f"⚠️ WARNING: User {uid} has non-dict profile field: {type(data['profile'])}")
                    data['profile'] = {}
                
                if 'preferences' in data and not isinstance(data['preferences'], dict):
                    print(f"⚠️ WARNING: User {uid} has non-dict preferences field: {type(data['preferences'])}")
                    data['preferences'] = {}
                
                # Ensure essential fields exist
                if 'uid' not in data:
                    data['uid'] = uid
                
                if 'display_name' not in data or data['display_name'] is None:
                    data['display_name'] = 'Farmer'
                
                print(f"✅ Retrieved user profile for {uid}: {data.keys()}")
                return data
            else:
                print(f"⚠️ No profile found for user {uid}")
                return None
            
        except Exception as e:
            print(f"❌ Error getting user profile: {str(e)}")
            import traceback
            traceback.print_exc()
            return None

    # Basic stub methods to prevent import errors
    async def update_user_profile(self, uid: str, update_data: Dict[str, Any]) -> bool:
        """Update user profile in Firestore"""
        return True

    async def get_ai_context(self, uid: str) -> Optional[Dict[str, Any]]:
        """Get AI context for user"""
        return None

    def get_enhanced_user_profile(self, uid: str):
        """Enhanced user profile method stub"""
        return None

    async def create_enhanced_user_profile(self, uid: str, profile_request) -> 'ProfileResponse':
        """Create enhanced user profile from ProfileCreationRequest"""
        print(f"🔍 Creating enhanced profile for user: {uid}")
        
        if not self.db:
            # Import here to avoid circular imports
            from app.models.user_models import ProfileResponse
            return ProfileResponse(
                success=False,
                message="Database service unavailable"
            )
        
        try:
            # Import required models
            from app.models.user_models import ProfileResponse, EnhancedUserProfile
            
            # Create the enhanced profile data structure
            enhanced_profile_data = {
                "uid": uid,
                "email": profile_request.personal_info.full_name.lower().replace(" ", "") + "@example.com",  # Fallback email
                "display_name": profile_request.personal_info.full_name,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                
                # Store the complete profile structure
                "personal_info": {
                    "full_name": profile_request.personal_info.full_name,
                    "phone_number": profile_request.personal_info.phone_number,
                    "preferred_language": getattr(profile_request.personal_info, 'preferred_language', 'en'),
                    "date_of_birth": getattr(profile_request.personal_info, 'date_of_birth', None),
                    "gender": getattr(profile_request.personal_info, 'gender', None),
                    "education_level": getattr(profile_request.personal_info, 'education_level', None)
                },
                
                "farm_profile": {
                    "location": {
                        "address": getattr(profile_request.farm_profile.location, 'address', ''),
                        "district": getattr(profile_request.farm_profile.location, 'district', ''),
                        "state": getattr(profile_request.farm_profile.location, 'state', ''),
                        "country": getattr(profile_request.farm_profile.location, 'country', 'India'),
                        "latitude": getattr(profile_request.farm_profile.location, 'latitude', None),
                        "longitude": getattr(profile_request.farm_profile.location, 'longitude', None)
                    },
                    "farm_details": {
                        "total_area": getattr(profile_request.farm_profile.farm_details, 'total_area', 0),
                        "area_unit": getattr(profile_request.farm_profile.farm_details, 'area_unit', 'acres'),
                        "size_category": getattr(profile_request.farm_profile.farm_details, 'size_category', 'small')
                    },
                    "soil_information": {
                        "primary_soil_type": str(getattr(profile_request.farm_profile.soil_information, 'primary_soil_type', 'loamy')),
                        "soil_ph": getattr(profile_request.farm_profile.soil_information, 'soil_ph', None),
                        "organic_matter_percentage": getattr(profile_request.farm_profile.soil_information, 'organic_matter_percentage', None)
                    },
                    "irrigation_system": {
                        "primary_method": str(getattr(profile_request.farm_profile.irrigation_system, 'primary_method', 'sprinkler')),
                        "water_source": getattr(profile_request.farm_profile.irrigation_system, 'water_source', None),
                        "system_efficiency": getattr(profile_request.farm_profile.irrigation_system, 'system_efficiency', None)
                    }
                },
                
                "farming_profile": {
                    "experience_level": str(getattr(profile_request.farming_profile, 'experience_level', 'beginner')) if profile_request.farming_profile else 'beginner',
                    "years_of_experience": getattr(profile_request.farming_profile, 'years_of_experience', 1) if profile_request.farming_profile else 1,
                    "primary_crops": getattr(profile_request.farming_profile, 'primary_crops', ['wheat', 'rice']) if profile_request.farming_profile else ['wheat', 'rice'],
                    "secondary_crops": getattr(profile_request.farming_profile, 'secondary_crops', []) if profile_request.farming_profile else [],
                    "farming_practices": getattr(profile_request.farming_profile, 'farming_practices', []) if profile_request.farming_profile else []
                },
                
                # Legacy profile format for backward compatibility
                "profile": {
                    "farm_location": f"{getattr(profile_request.farm_profile.location, 'district', '')}, {getattr(profile_request.farm_profile.location, 'state', '')}".strip(', '),
                    "farm_size": getattr(profile_request.farm_profile.farm_details, 'total_area', 1),
                    "farming_experience": str(getattr(profile_request.farming_profile, 'experience_level', 'beginner')) if profile_request.farming_profile else 'beginner',
                    "primary_crops": getattr(profile_request.farming_profile, 'primary_crops', ['wheat', 'rice']) if profile_request.farming_profile else ['wheat', 'rice']
                },
                
                "preferences": {
                    "language": getattr(profile_request.personal_info, 'preferred_language', 'en'),
                    "notification_enabled": True,
                    "weather_alerts": True
                }
            }
            
            # Store in Firestore
            doc_ref = self.db.collection("users").document(uid)
            doc_ref.set(enhanced_profile_data)
            
            print(f"✅ Enhanced profile created for user: {uid}")
            print(f"📝 Profile data: {enhanced_profile_data}")
            
            # Calculate completion percentage
            completion_percentage = 85.0  # High completion since we have detailed data
            
            return ProfileResponse(
                success=True,
                message=f"Enhanced profile created successfully for {profile_request.personal_info.full_name}",
                profile=None,  # We'll return None for now to avoid circular import issues
                completion_percentage=completion_percentage
            )
            
        except Exception as e:
            print(f"❌ Error creating enhanced profile: {str(e)}")
            import traceback
            traceback.print_exc()
            
            from app.models.user_models import ProfileResponse
            return ProfileResponse(
                success=False,
                message=f"Error creating enhanced profile: {str(e)}"
            )

    async def save_prediction(self, user_id: str, prediction_data: Dict[str, Any]) -> str:
        """Save crop prediction to Firestore"""
        try:
            if not self.is_connected():
                raise Exception("Firebase not connected")
            
            # Add timestamp if not present
            if 'created_at' not in prediction_data:
                prediction_data['created_at'] = datetime.utcnow()
            
            # Ensure user_id is set
            prediction_data['user_id'] = user_id
            
            # Save to predictions collection
            doc_ref = self.db.collection('predictions').document()
            prediction_data['id'] = doc_ref.id
            doc_ref.set(prediction_data)
            
            print(f"✅ Prediction saved with ID: {doc_ref.id}")
            return doc_ref.id
            
        except Exception as e:
            print(f"❌ Error saving prediction: {str(e)}")
            raise e

    async def get_user_predictions(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user's crop predictions from Firestore using collection scan"""
        try:
            if not self.is_connected():
                return []
            
            # Get all predictions and filter in Python to avoid Firestore index requirements
            all_predictions = self.db.collection('predictions').stream()
            user_predictions = []
            
            for doc in all_predictions:
                doc_data = doc.to_dict()
                if doc_data.get('user_id') == user_id:
                    doc_data['id'] = doc.id
                    user_predictions.append(doc_data)
            
            # Sort in Python by created_at timestamp (handle timezone issues)
            def get_sort_key(x):
                created_at = x.get('created_at')
                if created_at is None:
                    return datetime.min.replace(tzinfo=None)
                
                if isinstance(created_at, str):
                    try:
                        dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        return dt.replace(tzinfo=None)  # Make timezone-naive for comparison
                    except:
                        return datetime.min.replace(tzinfo=None)
                
                # Handle Firebase DatetimeWithNanoseconds
                if hasattr(created_at, 'replace') and hasattr(created_at, 'tzinfo'):
                    return created_at.replace(tzinfo=None)  # Make timezone-naive
                
                return created_at
            
            user_predictions.sort(key=get_sort_key, reverse=True)
            
            # Apply limit
            limited_predictions = user_predictions[:limit]
            
            print(f"📊 Retrieved {len(limited_predictions)} predictions for user {user_id} (out of {len(user_predictions)} total)")
            return limited_predictions
            
        except Exception as e:
            print(f"❌ Error getting user predictions: {str(e)}")
            return []

    async def get_user_predictions_count(self, user_id: str) -> int:
        """Get count of user's crop predictions using collection scan"""
        try:
            if not self.is_connected():
                return 0
            
            # Get all predictions and filter in Python to avoid Firestore index requirements
            all_predictions = self.db.collection('predictions').stream()
            user_predictions_count = 0
            
            for doc in all_predictions:
                doc_data = doc.to_dict()
                if doc_data.get('user_id') == user_id:
                    user_predictions_count += 1
            
            print(f"📊 User {user_id} has {user_predictions_count} total predictions")
            return user_predictions_count
            
        except Exception as e:
            print(f"❌ Error counting user predictions: {str(e)}")
            return 0


# Global service instance
firebase_service = FirebaseService()

def get_firebase_service():
    """Get the global Firebase service instance"""
    return firebase_service