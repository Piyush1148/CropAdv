"""
Chat Models - Pydantic models for AI Assistant chat functionality
Defines data structures for messages, sessions, and AI responses
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from enum import Enum

class MessageRole(str, Enum):
    """Message roles in chat conversation"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ChatMessage(BaseModel):
    """Individual chat message model"""
    id: str = Field(..., description="Unique message ID")
    role: MessageRole = Field(..., description="Message sender role")
    content: str = Field(..., min_length=1, max_length=10000, description="Message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Message timestamp")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Additional message metadata")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ChatSession(BaseModel):
    """Chat session model containing multiple messages"""
    session_id: str = Field(..., description="Unique session identifier")
    user_id: str = Field(..., description="Firebase user ID")
    messages: List[ChatMessage] = Field(default=[], description="List of messages in session")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Session creation time")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update time")
    title: Optional[str] = Field(None, max_length=100, description="Session title/topic")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ChatMessageRequest(BaseModel):
    """Request model for sending a chat message"""
    message: str = Field(..., min_length=1, max_length=2000, description="User message content")
    session_id: Optional[str] = Field(None, description="Existing session ID (optional for new session)")
    
    @validator('message')
    def validate_message(cls, v):
        if not v.strip():
            raise ValueError('Message cannot be empty or whitespace only')
        return v.strip()

class AIResponse(BaseModel):
    """AI assistant response model"""
    message_id: str = Field(..., description="Generated message ID")
    content: str = Field(..., description="AI response content")
    session_id: str = Field(..., description="Session ID this response belongs to")
    model_used: str = Field(default="llama-3.1-70b-versatile", description="AI model used")
    response_time: float = Field(..., ge=0, description="Response generation time in seconds")
    tokens_used: Optional[int] = Field(None, description="Number of tokens used")
    confidence: Optional[float] = Field(None, ge=0, le=1, description="Response confidence score")
    
class ChatHistoryRequest(BaseModel):
    """Request model for retrieving chat history"""
    session_id: Optional[str] = Field(None, description="Specific session ID")
    limit: int = Field(default=50, ge=1, le=100, description="Maximum number of messages")
    offset: int = Field(default=0, ge=0, description="Pagination offset")

class ChatHistoryResponse(BaseModel):
    """Response model for chat history"""
    sessions: List[ChatSession] = Field(..., description="List of chat sessions")
    total_sessions: int = Field(..., description="Total number of sessions")
    has_more: bool = Field(..., description="Whether more sessions are available")

class QuickAction(BaseModel):
    """Quick action button for farming assistance"""
    id: str = Field(..., description="Action identifier")
    label: str = Field(..., max_length=50, description="Display text")
    prompt: str = Field(..., max_length=200, description="Prompt to send when clicked")
    category: Literal["general", "crops", "weather", "diseases", "care"] = Field(..., description="Action category")
    icon: Optional[str] = Field(None, description="Icon name for UI")

class QuickActionsResponse(BaseModel):
    """Response with available quick actions"""
    actions: List[QuickAction] = Field(..., description="List of quick actions")
    categories: List[str] = Field(..., description="Available categories")

class ChatSessionSummary(BaseModel):
    """Summarized view of a chat session"""
    session_id: str = Field(..., description="Session identifier")
    title: str = Field(..., description="Session title or topic")
    message_count: int = Field(..., ge=0, description="Number of messages in session")
    last_message_at: datetime = Field(..., description="Timestamp of last message")
    preview: str = Field(..., max_length=100, description="Preview of last message")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ErrorResponse(BaseModel):
    """Standard error response model"""
    error: bool = Field(default=True, description="Error flag")
    message: str = Field(..., description="Error message")
    code: str = Field(..., description="Error code")
    details: Optional[Dict[str, Any]] = Field(default={}, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }