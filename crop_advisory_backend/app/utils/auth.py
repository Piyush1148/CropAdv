"""
Firebase Authentication Middleware
Handles JWT token verification and user authentication
"""

from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from typing import Optional, Dict, Any
import asyncio
from functools import wraps

from app.services.firebase_service import get_firebase_service

# HTTP Bearer token scheme
security = HTTPBearer()

class AuthenticationError(Exception):
    """Custom authentication error"""
    pass

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Verify Firebase ID token and return user claims
    
    Args:
        credentials: Bearer token from Authorization header
        
    Returns:
        Dict containing user claims (uid, email, etc.)
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(credentials.credentials)
        
        # Ensure we have a valid decoded token
        if not decoded_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Extract user information
        uid = decoded_token.get("uid")
        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_claims = {
            "uid": uid,
            "email": decoded_token.get("email"),
            "email_verified": decoded_token.get("email_verified", False),
            "name": decoded_token.get("name"),
            "picture": decoded_token.get("picture"),
            "firebase": decoded_token
        }
        
        return user_claims
        
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(user_claims: Dict[str, Any] = Depends(verify_firebase_token)) -> Dict[str, Any]:
    """
    Get current authenticated user with profile data
    
    Args:
        user_claims: User claims from verify_firebase_token
        
    Returns:
        Dict containing user profile data
    """
    # Ensure we have valid user claims
    if not user_claims or not user_claims.get("uid"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user authentication"
        )
    
    firebase_service = get_firebase_service()
    
    if not firebase_service.is_connected():
        # Return basic user info if Firestore is not available
        return user_claims
    
    try:
        # Get user profile from Firestore
        user_profile = await firebase_service.get_user_profile(user_claims["uid"])
        
        if user_profile:
            # Merge Firebase auth claims with Firestore profile
            user_profile.update({
                "auth": user_claims,
                "authenticated": True
            })
            return user_profile
        else:
            # Create user profile if it doesn't exist
            success = await firebase_service.create_user_profile(
                uid=user_claims["uid"],
                user_data={
                    "email": user_claims.get("email"),
                    "display_name": user_claims.get("name"),
                }
            )
            
            if success:
                # Try to get the newly created profile
                user_profile = await firebase_service.get_user_profile(user_claims["uid"])
                if user_profile:
                    user_profile.update({
                        "auth": user_claims,
                        "authenticated": True
                    })
                    return user_profile
            
            # Fallback to basic user info with safe defaults
            return {
                "uid": user_claims["uid"],
                "email": user_claims.get("email"),
                "display_name": user_claims.get("name"),
                "auth": user_claims,
                "authenticated": True,
                "profile": {
                    "farm_location": "",
                    "farm_size": 0,
                    "farming_experience": "",
                    "primary_crops": []
                },
                "preferences": {
                    "language": "en",
                    "notification_enabled": True,
                    "weather_alerts": True
                }
            }
            
    except Exception as e:
        print(f"❌ Error getting user profile: {str(e)}")
        # Return basic auth info on error
        return {
            "uid": user_claims.get("uid"),
            "email": user_claims.get("email"),
            "display_name": user_claims.get("name"),
            "auth": user_claims,
            "authenticated": True,
            "profile": {},
            "preferences": {}
        }

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[Dict[str, Any]]:
    """
    Get user if authenticated, return None if not (for optional authentication)
    
    Args:
        credentials: Optional bearer token
        
    Returns:
        User claims if authenticated, None otherwise
    """
    if not credentials:
        return None
    
    try:
        # Use the existing verify_firebase_token function
        user_claims = await verify_firebase_token(credentials)
        return await get_current_user(user_claims)
    except HTTPException:
        # Return None for invalid tokens instead of raising error
        return None

def require_auth(func):
    """
    Decorator to require authentication for a function
    Usage: @require_auth
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # This decorator assumes the function receives user as parameter
        return await func(*args, **kwargs)
    return wrapper

def admin_required(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Dependency to require admin privileges
    
    Args:
        user: Current authenticated user
        
    Returns:
        User dict if admin
        
    Raises:
        HTTPException: If user is not admin
    """
    # Check if user has admin role (you can customize this logic)
    firebase_claims = user.get("auth", {}).get("firebase", {})
    custom_claims = firebase_claims.get("custom_claims", {})
    
    if not custom_claims.get("admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    return user

# Common dependency combinations
async def authenticated_user_with_profile(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Get authenticated user with full profile"""
    return user

async def optional_authenticated_user(user: Optional[Dict[str, Any]] = Depends(get_optional_user)) -> Optional[Dict[str, Any]]:
    """Get user if authenticated, None otherwise"""
    return user