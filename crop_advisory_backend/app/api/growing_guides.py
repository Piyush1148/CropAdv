# app/api/growing_guides.py

"""
Growing Guides API Endpoints
Handles saving and retrieving AI-generated growing guides
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from ..services.firebase_service import FirebaseService
from .auth import get_current_user

router = APIRouter(tags=["Growing Guides"])  # Remove prefix here, will be set in main.py

# Initialize Firebase service
firebase_service = FirebaseService()


# ==================== MODELS ====================

class GrowingGuideCreate(BaseModel):
    """Model for creating a growing guide"""
    prediction_id: str = Field(..., description="ID of the prediction this guide is for")
    cropName: str
    location: str
    season: str
    generatedAt: str
    summary: dict
    timeline: dict
    sections: List[dict]
    resources: Optional[dict] = None
    metadata: Optional[dict] = None


class GrowingGuideResponse(BaseModel):
    """Model for growing guide response"""
    id: str
    user_id: str
    prediction_id: str
    cropName: str
    location: str
    season: str
    generatedAt: str
    summary: dict
    timeline: dict
    sections: List[dict]
    resources: Optional[dict] = None
    metadata: Optional[dict] = None
    created_at: str


# ==================== ENDPOINTS ====================

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def save_growing_guide(
    guide: GrowingGuideCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Save a growing guide for a prediction
    """
    try:
        user_id = current_user["uid"]
        
        guide_data = guide.dict()
        
        # Save to Firestore
        guide_id = await firebase_service.save_growing_guide(
            user_id=user_id,
            prediction_id=guide.prediction_id,
            guide_data=guide_data
        )
        
        return {
            "message": "Growing guide saved successfully",
            "guide_id": guide_id,
            "prediction_id": guide.prediction_id
        }
    
    except Exception as e:
        print(f"❌ Error saving growing guide: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save growing guide: {str(e)}"
        )


@router.get("/{guide_id}", response_model=dict)
async def get_growing_guide(
    guide_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific growing guide by ID
    """
    try:
        guide = await firebase_service.get_growing_guide(guide_id)
        
        if not guide:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Growing guide not found"
            )
        
        # Verify user owns this guide
        if guide.get('user_id') != current_user['uid']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this guide"
            )
        
        return guide
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting growing guide: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get growing guide: {str(e)}"
        )


@router.get("/prediction/{prediction_id}", response_model=dict)
async def get_guide_by_prediction(
    prediction_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get growing guide linked to a specific prediction
    """
    try:
        guide = await firebase_service.get_growing_guide_by_prediction(prediction_id)
        
        if not guide:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No growing guide found for this prediction"
            )
        
        # Verify user owns this guide
        if guide.get('user_id') != current_user['uid']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this guide"
            )
        
        return guide
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting growing guide by prediction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get growing guide: {str(e)}"
        )


@router.get("", response_model=List[dict])
async def get_user_guides(
    limit: int = 5,
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's recent growing guides
    """
    try:
        user_id = current_user["uid"]
        guides = await firebase_service.get_user_growing_guides(user_id, limit)
        
        return guides
    
    except Exception as e:
        print(f"❌ Error getting user guides: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get growing guides: {str(e)}"
        )
