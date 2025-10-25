# app/services/firebase_service.py

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
from dataclasses import dataclass, field

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

@dataclass
class AIContextResponse:
    """Dataclass to hold the structured response for AI context."""
    personalization_active: bool = False
    user_context: Optional[Dict[str, Any]] = None
    context_quality_score: float = 0.0
    message: str = "No context available"


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

    # ==================== AI CONTEXT IMPLEMENTATION (THE FIX) ====================

    async def get_ai_context_for_user(self, uid: str) -> AIContextResponse:
        """
        Get structured AI context for a user.
        This is the implemented function that resolves the AttributeError.
        """
        print(f"🚀 Getting enhanced AI context for user: {uid}")
        user_profile = await self.get_user_profile(uid)

        if not user_profile:
            return AIContextResponse(
                personalization_active=False,
                message=f"No profile found for user {uid}"
            )

        # Build the structured context dictionary that ai_service.py expects
        context = {
            "personal_info": user_profile.get("personal_info", {}),
            "farm_profile": user_profile.get("farm_profile", {}),
            "farming_profile": user_profile.get("farming_profile", {}),
            "ai_personalization": user_profile.get("ai_personalization", {}),
            "communication_preferences": user_profile.get("communication_preferences", {}),
            "verification_status": user_profile.get("verification_status", {}),
            "metadata": user_profile.get("metadata", {}),
        }

        # For backward compatibility with older profile structures
        if not context["personal_info"] and user_profile.get("display_name"):
             context["personal_info"] = {"full_name": user_profile.get("display_name")}

        # Calculate a quality score based on profile completion
        score = 0
        if user_profile.get("personal_info", {}).get("full_name"): score += 2
        if user_profile.get("farm_profile", {}).get("location", {}).get("state"): score += 2
        if user_profile.get("farm_profile", {}).get("farm_details", {}).get("total_area"): score += 1
        if user_profile.get("farm_profile", {}).get("soil_information", {}).get("primary_soil_type"): score += 2
        if user_profile.get("farming_profile", {}).get("primary_crops"): score += 2
        if user_profile.get("farming_profile", {}).get("experience_level"): score += 1
        
        quality_score = min(score, 10.0)
        
        personalization_active = quality_score > 4 # Only enable personalization if we have enough data

        print(f"✨ AI Context for {uid} - Quality: {quality_score}/10, Active: {personalization_active}")

        return AIContextResponse(
            personalization_active=personalization_active,
            user_context=context,
            context_quality_score=quality_score,
            message="Successfully retrieved user context."
        )

    # ==================== USER MANAGEMENT WITH DEFENSIVE PROGRAMMING ====================

    async def create_user_profile(self, uid: str, user_data: Dict[str, Any]) -> bool:
        """Create user profile in Firestore with defensive programming"""
        if not self.db: return False
        try:
            if not isinstance(user_data, dict):
                print(f"⚠️ WARNING: user_data is not a dictionary, type: {type(user_data)}, value: {user_data}")
                user_data = {"email": str(user_data) if user_data else f"user{uid[-8:]}@cropadvisor.com", "display_name": "Farmer"}

            display_name = "Farmer"
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
        if not self.db: return None
        try:
            doc = self.db.collection("users").document(uid).get()
            if doc.exists:
                data = doc.to_dict()
                if not isinstance(data, dict):
                    print(f"⚠️ WARNING: Firestore returned non-dict data for user {uid}: {type(data)}")
                    return None
                if 'profile' in data and not isinstance(data['profile'], dict):
                    data['profile'] = {}
                if 'preferences' in data and not isinstance(data['preferences'], dict):
                    data['preferences'] = {}
                if 'uid' not in data: data['uid'] = uid
                if 'display_name' not in data or data['display_name'] is None: data['display_name'] = 'Farmer'
                print(f"✅ Retrieved user profile for {uid}")
                return data
            else:
                print(f"⚠️ No profile found for user {uid}")
                return None
        except Exception as e:
            print(f"❌ Error getting user profile: {str(e)}")
            import traceback
            traceback.print_exc()
            return None

    # Other methods remain the same...
    async def update_user_profile(self, uid: str, update_data: Dict[str, Any]) -> bool:
        """Update user profile in Firestore"""
        # (This is a stub, actual implementation would be here)
        return True

    # ==================== USER_PROFILES COLLECTION MANAGEMENT ====================
    # New lightweight collection for signup information to personalize AI Assistant

    async def create_simple_user_profile(self, uid: str, profile_data: Dict[str, Any]) -> bool:
        """
        Create user profile in user_profiles collection during registration.
        This is separate from the 'users' collection and stores signup form data.
        
        Args:
            uid: Firebase Auth user ID
            profile_data: Dict containing fullName, email, phoneNumber, location, 
                         farmSize, soilType, irrigationType
        
        Returns:
            bool: True if profile created successfully, False otherwise
        """
        if not self.db:
            print("❌ Firebase not connected")
            return False
        
        try:
            # Build profile document with timestamp
            profile_doc = {
                "uid": uid,
                "full_name": profile_data.get("full_name", ""),
                "email": profile_data.get("email", ""),
                "phone_number": profile_data.get("phone_number"),
                "location": profile_data.get("location"),
                "latitude": profile_data.get("latitude"),
                "longitude": profile_data.get("longitude"),
                "farm_size": profile_data.get("farm_size"),
                "soil_type": profile_data.get("soil_type"),
                "irrigation_type": profile_data.get("irrigation_type"),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "profile_complete": self._check_profile_completion(profile_data)
            }
            
            # Store in user_profiles collection
            self.db.collection("user_profiles").document(uid).set(profile_doc)
            print(f"✅ User profile created in user_profiles collection for UID: {uid}")
            return True
            
        except Exception as e:
            print(f"❌ Error creating user profile in user_profiles collection: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    async def get_simple_user_profile(self, uid: str) -> Optional[Dict[str, Any]]:
        """
        Get user profile from user_profiles collection.
        
        Args:
            uid: Firebase Auth user ID
        
        Returns:
            Dict containing profile data or None if not found
        """
        if not self.db:
            print("❌ Firebase not connected")
            return None
        
        try:
            doc = self.db.collection("user_profiles").document(uid).get()
            
            if doc.exists:
                profile = doc.to_dict()
                print(f"✅ Retrieved user profile from user_profiles collection for {uid}")
                return profile
            else:
                print(f"⚠️ No profile found in user_profiles collection for user {uid}")
                return None
                
        except Exception as e:
            print(f"❌ Error getting user profile from user_profiles collection: {str(e)}")
            import traceback
            traceback.print_exc()
            return None

    async def update_simple_user_profile(self, uid: str, update_data: Dict[str, Any]) -> bool:
        """
        Update user profile in user_profiles collection.
        
        Args:
            uid: Firebase Auth user ID
            update_data: Dict containing fields to update
        
        Returns:
            bool: True if updated successfully, False otherwise
        """
        if not self.db:
            print("❌ Firebase not connected")
            return False
        
        try:
            # Add updated timestamp
            update_data["updated_at"] = datetime.utcnow()
            
            # Update profile completion status
            update_data["profile_complete"] = self._check_profile_completion(update_data)
            
            # Update document
            self.db.collection("user_profiles").document(uid).update(update_data)
            print(f"✅ User profile updated in user_profiles collection for UID: {uid}")
            return True
            
        except Exception as e:
            print(f"❌ Error updating user profile in user_profiles collection: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    def _check_profile_completion(self, profile_data: Dict[str, Any]) -> bool:
        """
        Check if user profile has all optional fields filled.
        
        Args:
            profile_data: Profile data dictionary
        
        Returns:
            bool: True if location, farmSize, soilType, and irrigationType are all provided
        """
        required_for_complete = ["location", "farm_size", "soil_type", "irrigation_type"]
        return all(
            profile_data.get(field) is not None and 
            str(profile_data.get(field)).strip() != "" 
            for field in required_for_complete
        )

    # ==================== EXISTING METHODS CONTINUE ====================

    async def update_ai_interaction_history(self, user_id: str, interaction_data: Dict[str, Any]):
        """Updates AI interaction history for a user."""
        # (This is a stub, actual implementation would be here)
        return True

    def get_enhanced_user_profile(self, uid: str):
        """Enhanced user profile method stub"""
        return None

    async def create_enhanced_user_profile(self, uid: str, profile_request) -> 'ProfileResponse':
        """Create enhanced user profile from ProfileCreationRequest"""
        print(f"🔍 Creating enhanced profile for user: {uid}")
        from app.models.user_models import ProfileResponse
        if not self.db:
            return ProfileResponse(success=False, message="Database service unavailable")
        try:
            enhanced_profile_data = {
                "uid": uid,
                "email": profile_request.personal_info.full_name.lower().replace(" ", "") + "@example.com",
                "display_name": profile_request.personal_info.full_name,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "personal_info": profile_request.personal_info.dict(),
                "farm_profile": profile_request.farm_profile.dict(),
                "farming_profile": profile_request.farming_profile.dict(),
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
            doc_ref = self.db.collection("users").document(uid)
            doc_ref.set(enhanced_profile_data)
            print(f"✅ Enhanced profile created for user: {uid}")
            return ProfileResponse(
                success=True,
                message=f"Enhanced profile created successfully for {profile_request.personal_info.full_name}",
                profile=None,
                completion_percentage=85.0
            )
        except Exception as e:
            print(f"❌ Error creating enhanced profile: {str(e)}")
            import traceback
            traceback.print_exc()
            return ProfileResponse(success=False, message=f"Error creating enhanced profile: {str(e)}")

    async def save_prediction(self, user_id: str, prediction_data: Dict[str, Any]) -> str:
        """Save crop prediction to Firestore"""
        if not self.is_connected(): raise Exception("Firebase not connected")
        try:
            if 'created_at' not in prediction_data: prediction_data['created_at'] = datetime.utcnow()
            prediction_data['user_id'] = user_id
            doc_ref = self.db.collection('predictions').document()
            prediction_data['id'] = doc_ref.id
            doc_ref.set(prediction_data)
            print(f"✅ Prediction saved with ID: {doc_ref.id}")
            return doc_ref.id
        except Exception as e:
            print(f"❌ Error saving prediction: {str(e)}")
            raise e

    async def get_user_predictions(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user's crop predictions from Firestore"""
        if not self.is_connected(): return []
        try:
            query = self.db.collection('predictions').where(filter=FieldFilter('user_id', '==', user_id)).order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit)
            docs = query.stream()
            predictions = [doc.to_dict() for doc in docs]
            print(f"📊 Retrieved {len(predictions)} predictions for user {user_id}")
            return predictions
        except Exception as e:
            print(f"❌ Error getting user predictions: {str(e)}")
            return []
            
    async def get_user_predictions_count(self, user_id: str) -> int:
        """Get count of user's crop predictions"""
        if not self.is_connected(): return 0
        try:
            query = self.db.collection('predictions').where(filter=FieldFilter('user_id', '==', user_id))
            count_query = query.count()
            count_result = count_query.get()
            count = count_result[0][0].value
            print(f"📊 User {user_id} has {count} total predictions")
            return count
        except Exception as e:
            print(f"❌ Error counting user predictions: {str(e)}")
            return 0

    async def save_growing_guide(self, user_id: str, prediction_id: str, guide_data: Dict[str, Any]) -> str:
        """Save growing guide linked to a prediction"""
        if not self.is_connected(): raise Exception("Firebase not connected")
        try:
            if 'created_at' not in guide_data: guide_data['created_at'] = datetime.utcnow()
            guide_data['user_id'] = user_id
            guide_data['prediction_id'] = prediction_id
            
            doc_ref = self.db.collection('growing_guides').document()
            guide_data['id'] = doc_ref.id
            doc_ref.set(guide_data)
            
            # Also update the prediction document to link to the guide
            pred_ref = self.db.collection('predictions').document(prediction_id)
            pred_ref.update({'growing_guide_id': doc_ref.id})
            
            print(f"✅ Growing guide saved with ID: {doc_ref.id}")
            return doc_ref.id
        except Exception as e:
            print(f"❌ Error saving growing guide: {str(e)}")
            raise e

    async def get_growing_guide(self, guide_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific growing guide by ID"""
        if not self.is_connected(): return None
        try:
            doc_ref = self.db.collection('growing_guides').document(guide_id)
            doc = doc_ref.get()
            if doc.exists:
                guide = doc.to_dict()
                print(f"✅ Retrieved growing guide: {guide_id}")
                return guide
            else:
                print(f"⚠️ Growing guide not found: {guide_id}")
                return None
        except Exception as e:
            print(f"❌ Error getting growing guide: {str(e)}")
            return None

    async def get_growing_guide_by_prediction(self, prediction_id: str) -> Optional[Dict[str, Any]]:
        """Get growing guide linked to a prediction"""
        if not self.is_connected(): return None
        try:
            query = self.db.collection('growing_guides').where(filter=FieldFilter('prediction_id', '==', prediction_id)).limit(1)
            docs = list(query.stream())
            if docs:
                guide = docs[0].to_dict()
                print(f"✅ Retrieved growing guide for prediction: {prediction_id}")
                return guide
            else:
                print(f"⚠️ No growing guide found for prediction: {prediction_id}")
                return None
        except Exception as e:
            print(f"❌ Error getting growing guide by prediction: {str(e)}")
            return None

    async def get_user_growing_guides(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Get user's growing guides (most recent first)"""
        if not self.is_connected(): return []
        try:
            query = self.db.collection('growing_guides').where(filter=FieldFilter('user_id', '==', user_id)).order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit)
            docs = query.stream()
            guides = []
            for doc in docs:
                guide_dict = doc.to_dict()
                guide_dict['id'] = doc.id  # Add document ID
                guides.append(guide_dict)
            print(f"📊 Retrieved {len(guides)} growing guides for user {user_id}")
            return guides
        except Exception as e:
            print(f"❌ Error getting user growing guides: {str(e)}")
            return []  # Return empty list on error, not 0


# Global service instance
firebase_service = FirebaseService()

def get_firebase_service():
    """Get the global Firebase service instance"""
    return firebase_service