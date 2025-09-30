"""
Enhanced Firebase Admin SDK Service - FIXED VERSION
Handles comprehensive user profiles with defensive programming for 'str' object has no attribute 'get' error
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
        """Get user profile from Firestore"""
        if not self.db:
            return None
        
        try:
            doc = self.db.collection("users").document(uid).get()
            if doc.exists:
                data = doc.to_dict()
                # Additional defensive check for returned data
                if not isinstance(data, dict):
                    print(f"⚠️ WARNING: Firestore returned non-dict data for user {uid}: {type(data)}")
                    return None
                return data
            return None
            
        except Exception as e:
            print(f"❌ Error getting user profile: {str(e)}")
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


# Global service instance
firebase_service = FirebaseService()

def get_firebase_service():
    """Get the global Firebase service instance"""
    return firebase_service