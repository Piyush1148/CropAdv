"""
Chat API Endpoints - FastAPI routes for AI Assistant
Handles chat messages, sessions, and AI interactions
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional, Dict, Any
import asyncio
import time
from datetime import datetime

from app.models.chat_models import (
    ChatMessageRequest, AIResponse, ChatHistoryRequest, 
    ChatHistoryResponse, QuickActionsResponse, QuickAction,
    ChatSessionSummary, ErrorResponse
)
from app.utils.auth import get_current_user
from app.services.chat_service import chat_service
from app.services.ai_service import ai_service

router = APIRouter()

# Simple public test endpoint for testing (no auth required)
@router.post("/test", summary="Test chat endpoint (no auth required)")
async def test_chat(request: dict):
    """
    Simple test endpoint for AI chat without authentication
    Only for development/testing purposes
    """
    try:
        message = request.get('message', '')
        session_id = request.get('session_id', 'test-session')
        
        if not message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message is required"
            )
        
        # Try to get AI response, fallback to simple response if AI fails
        try:
            # Use the AI service for real responses
            from app.models.chat_models import ChatMessage, MessageRole
            
            # Create a simple conversation history for the AI
            conversation_history = []
            if message.strip():
                ai_response = await ai_service.generate_response(
                    user_message=message,
                    conversation_history=conversation_history,
                    user_context={"source": "test_endpoint"}
                )
                
                return {
                    "response": ai_response.content,
                    "session_id": session_id,
                    "message_id": ai_response.message_id,
                    "timestamp": datetime.now().isoformat(),
                    "status": "success",
                    "ai_used": True,
                    "model_used": ai_response.model_used,
                    "tokens_used": ai_response.tokens_used,
                    "response_time": ai_response.response_time
                }
            
        except Exception as ai_error:
            print(f"🤖 AI Service failed: {str(ai_error)}, using fallback response")
            
            # Fallback to intelligent keyword-based responses
            farming_responses = {
                "youtube": "Here are some great YouTube channels for farming: 1) Epic Gardening 2) Roots and Refuge Farm 3) Swedish Homestead 4) Self Sufficient Me. Search for 'organic farming techniques' or 'crop specific tutorials' for detailed videos.",
                "video": "For farming videos, I recommend: YouTube channels like Epic Gardening, Becky's Homestead, and MIGardener. Also check agricultural extension services in your area for local video content.",
                "links": "Great farming resources: 1) Extension.org 2) USDA NRCS 3) Rodale Institute 4) Permaculture.org 5) Your local agricultural extension office website.",
                "crop": "For winter crops, consider planting wheat, barley, rye, or winter cover crops like crimson clover. Choose based on your climate zone and soil type.",
                "soil": "To improve soil health, add organic compost, practice crop rotation, test soil pH, and consider cover cropping during off-seasons.",
                "pest": "Natural pest control includes companion planting, beneficial insects, neem oil, and crop rotation to break pest cycles.",
                "irrigation": "Efficient irrigation practices include drip irrigation, mulching, watering early morning, and monitoring soil moisture levels.",
                "default": "I'm here to help with all your farming questions! Ask me about crops, soil, pests, irrigation, or any agricultural topic. For video resources, try YouTube channels like Epic Gardening or your local extension service."
            }
            
            # More intelligent keyword matching
            message_lower = message.lower()
            response_key = "default"
            
            # Check for specific keywords
            if any(word in message_lower for word in ["youtube", "yt", "video"]):
                if any(word in message_lower for word in ["link", "links"]):
                    response_key = "youtube"
                else:
                    response_key = "video"
            elif any(word in message_lower for word in ["link", "links", "website", "resource"]):
                response_key = "links"
            elif any(word in message_lower for word in ["crop", "plant", "grow"]):
                response_key = "crop"
            elif any(word in message_lower for word in ["soil", "fertilizer"]):
                response_key = "soil"
            elif any(word in message_lower for word in ["pest", "bug", "insect"]):
                response_key = "pest"
            elif any(word in message_lower for word in ["water", "irrigation"]):
                response_key = "irrigation"
            
            return {
                "response": farming_responses[response_key],
                "session_id": session_id,
                "message_id": f"msg-{int(time.time())}",
                "timestamp": datetime.now().isoformat(),
                "status": "success",
                "ai_used": False,
                "fallback_reason": str(ai_error)
            }
        
    except Exception as e:
        return {
            "response": f"I apologize, but I encountered an error: {str(e)}",
            "session_id": request.get('session_id', 'test-session'),
            "message_id": "error",
            "timestamp": "2025-09-25T10:30:00Z",
            "status": "error"
        }

@router.post("/message", summary="Send a personalized chat message and get AI response")
async def send_message(
    request: ChatMessageRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Send a message to the personalized AI assistant and receive a contextual response
    
    - **message**: The user's message content
    - **session_id**: Optional existing session ID (creates new session if not provided)
    
    This endpoint now uses enhanced user profiles for maximum personalization!
    """
    try:
        # Comprehensive debugging logging
        print(f"🔍 DEBUG: Chat endpoint called with user type: {type(user)}")
        print(f"🔍 DEBUG: User value: {user}")
        
        # Validate user data
        if not user:
            print("❌ DEBUG: User is None or empty")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User authentication failed"
            )
        
        if not isinstance(user, dict):
            print(f"❌ DEBUG: User is not a dict, type: {type(user)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user data format"
            )
        
        user_id = user.get("uid")
        print(f"🔍 DEBUG: Extracted user_id: {user_id}")
        
        if not user_id:
            print("❌ DEBUG: No uid found in user object")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in authentication"
            )
        
        # Get enhanced AI context for personalization
        from app.services.firebase_service import get_firebase_service
        firebase_service = get_firebase_service()
        print(f"🔍 DEBUG: Firebase service obtained: {firebase_service is not None}")
        
        # Try to get enhanced user context
        enhanced_context = None
        try:
            print(f"🔍 DEBUG: Getting AI context for user: {user_id}")
            ai_context_response = await firebase_service.get_ai_context_for_user(user_id)
            print(f"🔍 DEBUG: AI context response: {ai_context_response is not None}")
            
            if ai_context_response and ai_context_response.personalization_active:
                enhanced_context = ai_context_response.user_context
                print(f"🎯 Using enhanced AI context for user {user_id} (quality: {ai_context_response.context_quality_score}/10)")
        except Exception as context_error:
            print(f"⚠️ Could not get enhanced context for user {user_id}: {str(context_error)}")
            import traceback
            traceback.print_exc()
        
        # Fallback to basic context if enhanced context not available
        if not enhanced_context:
            print(f"🔍 DEBUG: Creating fallback context, user type: {type(user)}")
            try:
                # Add extra defensive programming for user object
                if not isinstance(user, dict):
                    print(f"⚠️ WARNING: User is not a dict, type: {type(user)}, value: {user}")
                    user = {"uid": user_id, "display_name": "Farmer", "profile": {}}
                
                # Safe profile extraction with null checks
                profile = user.get("profile", {}) if isinstance(user, dict) else {}
                profile = profile or {}  # Handle null profile
                
                # Extract location safely
                location = None
                if isinstance(user, dict):
                    location = user.get("location") or (profile.get("farm_location") if profile else None)
                
                # Extract farm details safely
                farm_size = None
                if profile and profile.get("farm_size") and profile.get("farm_size") != 0:
                    farm_size = f"{profile.get('farm_size')} acres"
                
                enhanced_context = {
                    "name": user.get("display_name", "Farmer") if isinstance(user, dict) else "Farmer",
                    "location": location or "Not specified",
                    "farm_size": farm_size or "Not specified", 
                    "farming_experience": profile.get("farming_experience") if profile else "Not specified",
                    "personalization_note": "Basic profile - limited personalization available"
                }
                print(f"📝 Using basic context for user {user_id}: {enhanced_context}")
            except Exception as fallback_error:
                print(f"❌ Error creating fallback context: {str(fallback_error)}")
                import traceback
                traceback.print_exc()
                enhanced_context = {
                    "name": "Farmer",
                    "personalization_note": "No context available - using generic responses"
                }
        
        print(f"🔍 DEBUG: Final enhanced_context type: {type(enhanced_context)}")
        
        # CRITICAL: Final defensive check before sending to AI service
        if not isinstance(enhanced_context, dict):
            print(f"⚠️ CRITICAL: enhanced_context is not a dict, converting from {type(enhanced_context)}")
            enhanced_context = {
                "name": "Farmer",
                "personalization_note": f"Context conversion error - original type: {type(enhanced_context)}"
            }
        
        # Send message and get response with enhanced context
        result = await chat_service.send_message_and_get_response(
            user_id=user_id,
            message_content=request.message,
            session_id=request.session_id,
            user_context=enhanced_context
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["message"]
            )
        
        # Update AI interaction history if we have enhanced context
        if enhanced_context and "personalization_note" not in enhanced_context:
            try:
                # Extract topics from user message for learning
                message_words = request.message.lower().split()
                agricultural_keywords = [
                    "crop", "soil", "fertilizer", "pest", "disease", "irrigation", 
                    "weather", "harvest", "plant", "seed", "organic", "farm"
                ]
                detected_topics = [word for word in message_words if word in agricultural_keywords]
                
                interaction_data = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "message_length": len(request.message),
                    "topics": detected_topics[:3],  # Top 3 topics
                    "session_id": result["session_id"]
                }
                
                await firebase_service.update_ai_interaction_history(user_id, interaction_data)
                print(f"📊 Updated AI interaction history for user {user_id}")
                
            except Exception as history_error:
                print(f"⚠️ Could not update interaction history: {str(history_error)}")
        
        return {
            "success": True,
            "session_id": result["session_id"],
            "user_message": result["user_message"],
            "ai_response": result["ai_response"],
            "timestamp": result["ai_response"]["timestamp"],
            "personalization_active": enhanced_context and "personalization_note" not in enhanced_context,
            "context_quality": ai_context_response.context_quality_score if 'ai_context_response' in locals() and ai_context_response else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process message: {str(e)}"
        )

@router.post("/rate-response", summary="Rate AI response for personalization learning")
async def rate_ai_response(
    rating_data: Dict[str, Any],
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Rate an AI response to improve personalization (1-5 stars)
    
    Expected data:
    - **message_id**: ID of the AI message being rated
    - **rating**: Rating from 1-5 (5 being excellent)
    - **feedback**: Optional text feedback
    - **recommendation_followed**: Whether user followed the recommendation (boolean)
    """
    try:
        user_id = user["uid"]
        
        # Validate rating data
        message_id = rating_data.get("message_id")
        rating = rating_data.get("rating")
        feedback = rating_data.get("feedback", "")
        recommendation_followed = rating_data.get("recommendation_followed", False)
        
        if not message_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="message_id is required"
            )
        
        if not rating or not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="rating must be between 1 and 5"
            )
        
        # Update AI interaction history with rating
        from app.services.firebase_service import get_firebase_service
        firebase_service = get_firebase_service()
        
        interaction_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "rating": float(rating),
            "feedback": feedback,
            "recommendation_followed": recommendation_followed,
            "message_id": message_id
        }
        
        success = await firebase_service.update_ai_interaction_history(user_id, interaction_data)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save rating"
            )
        
        return {
            "success": True,
            "message": "Rating saved successfully",
            "rating": rating,
            "message_id": message_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save rating: {str(e)}"
        )

@router.get("/sessions", response_model=List[ChatSessionSummary])
async def get_chat_sessions(
    limit: int = 20,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get all chat sessions for the current user
    
    - **limit**: Maximum number of sessions to return (default: 20, max: 50)
    """
    try:
        if limit > 50:
            limit = 50
        
        sessions = await chat_service.get_user_sessions(
            user_id=user["uid"],
            limit=limit
        )
        
        return sessions
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve chat sessions: {str(e)}"
        )

@router.get("/sessions/{session_id}")
async def get_chat_session(
    session_id: str,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get a specific chat session with all messages
    
    - **session_id**: The ID of the chat session to retrieve
    """
    try:
        session = await chat_service.get_session(session_id, user["uid"])
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found or access denied"
            )
        
        # Convert to response format
        return {
            "session_id": session.session_id,
            "title": session.title,
            "created_at": session.created_at.isoformat(),
            "updated_at": session.updated_at.isoformat(),
            "message_count": len(session.messages),
            "messages": [
                {
                    "id": msg.id,
                    "role": msg.role.value,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat(),
                    "metadata": msg.metadata
                }
                for msg in session.messages
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve chat session: {str(e)}"
        )

@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: str,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Delete a chat session
    
    - **session_id**: The ID of the chat session to delete
    """
    try:
        success = await chat_service.delete_session(session_id, user["uid"])
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found or access denied"
            )
        
        return {"success": True, "message": "Chat session deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete chat session: {str(e)}"
        )

@router.get("/quick-actions", response_model=QuickActionsResponse)
async def get_quick_actions():
    """
    Get available quick action buttons for farming assistance
    
    Returns predefined farming-related questions that users can quickly select
    """
    try:
        actions_data = ai_service.get_quick_actions()
        
        actions = [
            QuickAction(
                id=action["id"],
                label=action["label"],
                prompt=action["prompt"],
                category=action["category"],
                icon=action.get("icon")
            )
            for action in actions_data
        ]
        
        categories = list(set(action.category for action in actions))
        
        return QuickActionsResponse(
            actions=actions,
            categories=categories
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get quick actions: {str(e)}"
        )

@router.post("/quick-action/{action_id}")
async def execute_quick_action(
    action_id: str,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Execute a quick action by sending its predefined prompt
    
    - **action_id**: The ID of the quick action to execute
    """
    try:
        # Get available actions
        actions_data = ai_service.get_quick_actions()
        action = next((a for a in actions_data if a["id"] == action_id), None)
        
        if not action:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quick action not found"
            )
        
        # Create message request with action prompt
        message_request = ChatMessageRequest(
            message=action["prompt"],
            session_id=None  # Create new session for quick actions
        )
        
        # Process the message
        return await send_message(message_request, user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute quick action: {str(e)}"
        )

@router.get("/health")
async def chat_health_check():
    """
    Check the health of the AI chat service
    
    Tests connection to GROQ API and returns service status
    """
    try:
        # Check AI service health
        ai_health = await ai_service.health_check()
        
        return {
            "chat_service": "healthy",
            "ai_service": ai_health,
            "timestamp": "2025-09-25T10:30:00Z",
            "features": {
                "groq_integration": True,
                "firestore_storage": True,
                "session_management": True,
                "quick_actions": True
            }
        }
        
    except Exception as e:
        return {
            "chat_service": "unhealthy",
            "error": str(e),
            "timestamp": "2025-09-25T10:30:00Z"
        }

@router.get("/stats")
async def get_chat_stats(
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get chat statistics for the current user
    
    Returns usage statistics and session information
    """
    try:
        sessions = await chat_service.get_user_sessions(user["uid"], limit=100)
        
        total_sessions = len(sessions)
        total_messages = sum(session.message_count for session in sessions)
        
        # Get recent activity (last 7 days)
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_sessions = [
            s for s in sessions 
            if s.last_message_at and s.last_message_at >= week_ago
        ]
        
        return {
            "total_sessions": total_sessions,
            "total_messages": total_messages,
            "recent_sessions": len(recent_sessions),
            "average_messages_per_session": total_messages / max(total_sessions, 1),
            "last_activity": sessions[0].last_message_at.isoformat() if sessions else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat statistics: {str(e)}"
        )

@router.post("/sessions/{session_id}/generate-title")
async def generate_session_title(
    session_id: str,
    user: Dict = Depends(get_current_user)
):
    """
    Manually generate/regenerate title for a specific session
    Useful for testing and updating titles for existing sessions
    """
    try:
        success = await chat_service.generate_and_update_session_title(session_id, user["uid"])
        
        if success:
            # Get the updated session to return the new title
            updated_session = await chat_service.get_session(session_id, user["uid"])
            return {
                "success": True,
                "message": "Title generated successfully",
                "new_title": updated_session.title if updated_session else None
            }
        else:
            return {
                "success": False,
                "message": "Title generation skipped (session not found or already has a custom title)"
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate session title: {str(e)}"
        )