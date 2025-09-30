"""
Chat Service - Session Management and Firestore Integration
Handles chat sessions, message storage, and conversation management
"""

import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
import asyncio

from app.models.chat_models import (
    ChatSession, ChatMessage, MessageRole, ChatSessionSummary
)
from app.services.firebase_service import get_firebase_service
from app.services.ai_service import ai_service

class ChatService:
    """Service for managing chat sessions and messages"""
    
    def __init__(self):
        self.firebase_service = get_firebase_service()
        self.collection_name = "chat_sessions"
    
    async def create_session(self, user_id: str, title: Optional[str] = None) -> ChatSession:
        """Create a new chat session"""
        session_id = str(uuid.uuid4())
        
        session = ChatSession(
            session_id=session_id,
            user_id=user_id,
            title=title or f"Chat Session {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            messages=[],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Save to Firestore
        await self._save_session(session)
        
        return session
    
    async def get_session(self, session_id: str, user_id: str) -> Optional[ChatSession]:
        """Retrieve a chat session by ID"""
        try:
            doc_ref = self.firebase_service.db.collection(self.collection_name).document(session_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                return None
            
            data = doc.to_dict()
            
            # CRITICAL: Defensive programming to prevent str object errors
            if not isinstance(data, dict):
                print(f"⚠️ WARNING: Firestore returned non-dict data for session {session_id}: {type(data)}")
                return None
            
            if not data:
                return None
            
            # Verify user owns this session with defensive checks
            stored_user_id = data.get("user_id")
            if not isinstance(stored_user_id, str) or stored_user_id != user_id:
                print(f"⚠️ WARNING: Session {session_id} user_id mismatch or invalid type: {type(stored_user_id)}")
                return None
            
            # Convert messages to ChatMessage objects with defensive checks
            messages = []
            messages_data = data.get("messages", [])
            
            # Ensure messages is a list
            if not isinstance(messages_data, list):
                print(f"⚠️ WARNING: Session {session_id} has non-list messages: {type(messages_data)}")
                messages_data = []
            
            for msg_data in messages_data:
                # Ensure each message is a dictionary
                if not isinstance(msg_data, dict):
                    print(f"⚠️ WARNING: Skipping non-dict message in session {session_id}: {type(msg_data)}")
                    continue
                
                # Safely handle timestamp conversion
                try:
                    if isinstance(msg_data.get("timestamp"), str):
                        msg_data["timestamp"] = datetime.fromisoformat(msg_data["timestamp"])
                    
                    messages.append(ChatMessage(**msg_data))
                except Exception as msg_error:
                    print(f"⚠️ WARNING: Failed to parse message in session {session_id}: {msg_error}")
                    continue
            
            data["messages"] = messages
            
            # Convert timestamps
            if isinstance(data.get("created_at"), str):
                data["created_at"] = datetime.fromisoformat(data["created_at"])
            if isinstance(data.get("updated_at"), str):
                data["updated_at"] = datetime.fromisoformat(data["updated_at"])
            
            return ChatSession(**data)
            
        except Exception as e:
            print(f"❌ Error retrieving session {session_id}: {str(e)}")
            return None
    
    async def add_message(
        self, 
        session_id: str, 
        user_id: str, 
        content: str, 
        role: MessageRole = MessageRole.USER
    ) -> Optional[ChatMessage]:
        """Add a message to a chat session"""
        try:
            # Get existing session or create new one
            session = await self.get_session(session_id, user_id)
            if not session:
                session = await self.create_session(user_id)
                session_id = session.session_id
            
            # Create message
            message = ChatMessage(
                id=str(uuid.uuid4()),
                role=role,
                content=content,
                timestamp=datetime.utcnow(),
                metadata={}
            )
            
            # Add message to session
            session.messages.append(message)
            session.updated_at = datetime.utcnow()
            
            # Save updated session
            await self._save_session(session)
            
            return message
            
        except Exception as e:
            print(f"❌ Error adding message to session {session_id}: {str(e)}")
            return None
    
    async def send_message_and_get_response(
        self, 
        user_id: str, 
        message_content: str,
        session_id: Optional[str] = None,
        user_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Send user message and get AI response"""
        try:
            # Get or create session
            if session_id:
                session = await self.get_session(session_id, user_id)
                if not session:
                    session = await self.create_session(user_id)
            else:
                session = await self.create_session(user_id)
            
            session_id = session.session_id
            
            # Add user message
            user_message = await self.add_message(
                session_id, user_id, message_content, MessageRole.USER
            )
            
            if not user_message:
                raise Exception("Failed to add user message")
            
            # Get AI response
            ai_response = await ai_service.generate_response(
                message_content, session.messages[:-1], user_context
            )
            
            ai_response.session_id = session_id
            
            # Add AI response as message
            ai_message = await self.add_message(
                session_id, user_id, ai_response.content, MessageRole.ASSISTANT
            )
            
            if not ai_message:
                raise Exception("Failed to add AI response")
            
            # Generate session title after the first complete exchange (2+ messages)
            # This happens after user message + AI response
            try:
                updated_session = await self.get_session(session_id, user_id)
                if updated_session and len(updated_session.messages) >= 2:
                    # Check if this is the first or second exchange, good time to generate title
                    message_count = len(updated_session.messages)
                    if message_count == 2 or message_count == 4:  # After 1st or 2nd exchange
                        # Generate title in background (don't wait for it)
                        asyncio.create_task(
                            self.generate_and_update_session_title(session_id, user_id)
                        )
            except Exception as title_error:
                print(f"⚠️ Title generation failed (non-critical): {str(title_error)}")
            
            return {
                "success": True,
                "session_id": session_id,
                "user_message": {
                    "id": user_message.id if user_message else None,
                    "content": user_message.content if user_message else "",
                    "timestamp": user_message.timestamp.isoformat() if user_message and user_message.timestamp else ""
                },
                "ai_response": {
                    "id": ai_message.id if ai_message else None,
                    "content": ai_response.content if ai_response else "",
                    "model_used": ai_response.model_used if ai_response else "unknown",
                    "response_time": ai_response.response_time if ai_response else 0.0,
                    "timestamp": ai_message.timestamp.isoformat() if ai_message and ai_message.timestamp else ""
                }
            }
            
        except Exception as e:
            print(f"❌ Error in message exchange: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to process message"
            }
    
    async def generate_and_update_session_title(self, session_id: str, user_id: str) -> bool:
        """Generate and update session title based on conversation content"""
        try:
            # Get current session
            session = await self.get_session(session_id, user_id)
            if not session or len(session.messages) < 2:
                return False
            
            # Only generate title if it's still the default timestamp-based title
            # or if it's empty/generic
            current_title = session.title or ""
            if (not current_title or 
                "Chat Session" in current_title or 
                current_title.startswith("Chat Session")):
                
                # Generate new title using AI service
                new_title = await ai_service.generate_session_title(session.messages)
                
                if new_title and new_title != session.title:
                    # Update session with new title
                    session.title = new_title
                    session.updated_at = datetime.utcnow()
                    
                    # Save updated session
                    await self._save_session(session)
                    
                    print(f"✅ Updated session {session_id} title to: '{new_title}'")
                    return True
            
            return False
            
        except Exception as e:
            print(f"❌ Error generating session title for {session_id}: {str(e)}")
            return False
    
    async def get_user_sessions(
        self, 
        user_id: str, 
        limit: int = 20
    ) -> List[ChatSessionSummary]:
        """Get all chat sessions for a user"""
        try:
            # Temporary fix: Remove order_by to avoid composite index requirement
            # TODO: Create composite index for user_id + updated_at for proper ordering
            sessions_ref = (
                self.firebase_service.db.collection(self.collection_name)
                .where("user_id", "==", user_id)
                .limit(limit)
            )
            
            docs = sessions_ref.stream()
            summaries = []
            
            for doc in docs:
                data = doc.to_dict()
                if not data:
                    continue
                messages = data.get("messages", [])
                
                if messages:
                    last_message = messages[-1]
                    preview = last_message.get("content", "")[:100]
                    last_message_at = last_message.get("timestamp")
                    
                    if isinstance(last_message_at, str):
                        last_message_at = datetime.fromisoformat(last_message_at)
                    elif not isinstance(last_message_at, datetime):
                        last_message_at = datetime.utcnow()
                else:
                    preview = "No messages"
                    last_message_at = data.get("created_at", datetime.utcnow())
                    if isinstance(last_message_at, str):
                        last_message_at = datetime.fromisoformat(last_message_at)
                
                summary = ChatSessionSummary(
                    session_id=data["session_id"],
                    title=data.get("title", "Untitled Chat"),
                    message_count=len(messages),
                    last_message_at=last_message_at,
                    preview=preview
                )
                summaries.append(summary)
            
            # Sort by last_message_at in descending order (since we can't use Firestore order_by)
            summaries.sort(key=lambda x: x.last_message_at or datetime.min, reverse=True)
            
            return summaries
            
        except Exception as e:
            print(f"❌ Error retrieving user sessions: {str(e)}")
            return []
    
    async def delete_session(self, session_id: str, user_id: str) -> bool:
        """Delete a chat session"""
        try:
            # Verify ownership
            session = await self.get_session(session_id, user_id)
            if not session:
                return False
            
            # Delete from Firestore
            doc_ref = self.firebase_service.db.collection(self.collection_name).document(session_id)
            doc_ref.delete()
            
            return True
            
        except Exception as e:
            print(f"❌ Error deleting session {session_id}: {str(e)}")
            return False
    
    async def _save_session(self, session: ChatSession):
        """Save session to Firestore"""
        try:
            doc_ref = self.firebase_service.db.collection(self.collection_name).document(session.session_id)
            
            # Convert to dict for Firestore
            session_data = {
                "session_id": session.session_id,
                "user_id": session.user_id,
                "title": session.title,
                "created_at": session.created_at.isoformat(),
                "updated_at": session.updated_at.isoformat(),
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
            
            doc_ref.set(session_data)
            
        except Exception as e:
            print(f"❌ Error saving session to Firestore: {str(e)}")
            raise

# Global chat service instance
chat_service = ChatService()