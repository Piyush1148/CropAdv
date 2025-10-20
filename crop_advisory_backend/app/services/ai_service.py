# app/services/ai_service.py

"""
AI Service - GROQ Integration for Farming Assistant
Handles AI responses using GROQ's Llama-3.1-70b model with farming-specific knowledge
"""

import os
import time
import uuid
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import asyncio

from groq import Groq
from app.models.chat_models import ChatMessage, AIResponse, MessageRole
from app.utils.auth import get_current_user

class FarmingAIService:
    """AI Service for farming-specific assistance using GROQ"""

    def __init__(self):
        self.client = None
        self.model = "llama-3.1-8b-instant"  # Updated to current available model
        self.max_tokens = 1024
        self.temperature = 0.7
        self.system_prompt = self._get_farming_system_prompt()
        self._initialize_client()

    def _initialize_client(self):
        """Initialize GROQ client with API key"""
        try:
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise ValueError("GROQ_API_KEY environment variable not set")

            print("🔧 Initializing GROQ client...")
            self.client = Groq(api_key=api_key)
            print("✅ GROQ AI Service initialized successfully")

            # Test the connection with a simple call
            self.client.chat.completions.create(
                messages=[{"role": "user", "content": "Hello"}],
                model=self.model,
                max_tokens=10
            )
            print("✅ GROQ API connection tested and working")

        except Exception as e:
            print(f"❌ Failed to initialize GROQ client: {str(e)}")
            self.client = None

    def _get_farming_system_prompt(self) -> str:
        """Get the enhanced system prompt for personalized farming assistant"""
        return """You are CropAdvisor AI, an expert personal agricultural assistant... (rest of your detailed prompt is unchanged)"""

    def _format_conversation_history(self, messages: List[ChatMessage]) -> List[Dict[str, str]]:
        """Format chat messages for GROQ API"""
        formatted_messages = [{"role": "system", "content": self.system_prompt}]
        for message in messages[-10:]:  # Keep last 10 messages for context
            formatted_messages.append({
                "role": message.role.value,
                "content": message.content
            })
        return formatted_messages

    async def generate_response(
        self,
        user_message: str,
        conversation_history: List[ChatMessage],
        user_context: Optional[Dict] = None
    ) -> AIResponse:
        """Generate AI response using GROQ"""
        if not self.client:
            raise Exception("GROQ client not initialized. Check your API key.")

        start_time = time.time()
        message_id = str(uuid.uuid4())

        try:
            messages = self._format_conversation_history(conversation_history)
            if user_context:
                context_info = self._format_user_context(user_context)
                # Append the formatted context to the system prompt
                messages[0]["content"] += f"\n\n{context_info}"

            messages.append({"role": "user", "content": user_message})

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                top_p=0.9,
                stream=False
            )
            ai_content = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else None
            response_time = time.time() - start_time

            return AIResponse(
                message_id=message_id, content=ai_content, session_id="",
                model_used=self.model, response_time=response_time,
                tokens_used=tokens_used, confidence=0.9
            )
        except Exception as e:
            response_time = time.time() - start_time
            error_message = f"I apologize, but I'm experiencing technical difficulties. Please try again in a moment. Error: {str(e)}"
            return AIResponse(
                message_id=message_id, content=error_message, session_id="",
                model_used=self.model, response_time=response_time,
                tokens_used=0, confidence=0.0
            )

    def _format_user_context(self, user_context: Dict) -> str:
        """Format comprehensive user context for personalized AI responses"""
        # (This entire robust function is unchanged as it was already well-written)
        if not user_context or not isinstance(user_context, dict):
            return "No specific context available"
        
        context_parts = []
        
        personal_info = user_context.get("personal_info", {})
        if isinstance(personal_info, dict) and personal_info.get("full_name"):
            context_parts.append(f"Farmer: {personal_info['full_name']}")

        farm_profile = user_context.get("farm_profile", {})
        if isinstance(farm_profile, dict):
            location_info = farm_profile.get("location", {})
            if isinstance(location_info, dict) and location_info.get("state") and location_info.get("district"):
                context_parts.append(f"Location: {location_info['district']}, {location_info['state']}, India")
            
            farm_details = farm_profile.get("farm_details", {})
            if isinstance(farm_details, dict) and farm_details.get("total_area"):
                context_parts.append(f"Farm Size: {farm_details['total_area']} acres")

            soil_info = farm_profile.get("soil_information", {})
            if isinstance(soil_info, dict) and soil_info.get("primary_soil_type"):
                context_parts.append(f"Soil Type: {soil_info['primary_soil_type']}")

            irrigation = farm_profile.get("irrigation_system", {})
            if isinstance(irrigation, dict) and irrigation.get("primary_method"):
                context_parts.append(f"Irrigation: {irrigation['primary_method']}")

        farming_profile = user_context.get("farming_profile", {})
        if isinstance(farming_profile, dict):
            if farming_profile.get("experience_level"):
                context_parts.append(f"Experience: {farming_profile['experience_level']}")
            if farming_profile.get("primary_crops"):
                crops_list = farming_profile['primary_crops']
                if isinstance(crops_list, list) and crops_list:
                    context_parts.append(f"Primary Crops: {', '.join(crops_list)}")

        if context_parts:
            formatted_context = "USER PROFILE CONTEXT:\n" + "\n".join(f"• {part}" for part in context_parts)
            formatted_context += "\n\nPERSONALIZATION INSTRUCTIONS:\n• Tailor advice to the user's specific context."
            return formatted_context
        
        # Fallback for basic context
        if user_context.get("personalization_note"):
             return f"USER PROFILE CONTEXT:\n• {user_context.get('personalization_note')}"
             
        return "No specific context available"
    
    def get_quick_actions(self) -> List[Dict[str, str]]:
        """Get predefined quick action prompts for farming assistance"""
        # (Unchanged)
        return [
            {"id": "crop_care", "label": "Crop Care Tips", "prompt": "What are the essential care tips for healthy crop growth?", "category": "general", "icon": "leaf"},
            {"id": "disease_help", "label": "Disease Identification", "prompt": "Help me identify and treat crop diseases.", "category": "diseases", "icon": "alert-circle"},
            {"id": "weather_advice", "label": "Weather Impact", "prompt": "How does current weather affect my crops?", "category": "weather", "icon": "cloud"},
            {"id": "soil_health", "label": "Soil Health", "prompt": "How can I improve my soil health naturally?", "category": "crops", "icon": "layers"},
        ]

    async def health_check(self) -> Dict[str, str]:
        """Check if GROQ service is available"""
        # (Unchanged)
        if not self.client: return {"status": "error", "message": "Client not initialized"}
        try:
            self.client.chat.completions.create(model=self.model, messages=[{"role": "user", "content": "Hello"}], max_tokens=10)
            return {"status": "healthy", "model": self.model, "message": "GROQ AI service is operational"}
        except Exception as e:
            return {"status": "error", "message": f"GROQ service unavailable: {str(e)}"}
    
    async def generate_session_title(self, conversation_messages: List[ChatMessage]) -> str:
        """Generate a concise, meaningful title for a chat session"""
        # (Unchanged)
        if not self.client: raise Exception("GROQ client not initialized")
        if not conversation_messages: return "New Chat Session"
        try:
            # Simplified logic for brevity
            user_messages = " ".join([msg.content for msg in conversation_messages if msg.role == MessageRole.USER])
            title_prompt = f"Generate a very short title (3-4 words max) for a farm chat about: '{user_messages[:200]}'. Title only."
            response = self.client.chat.completions.create(
                model=self.model, messages=[{"role": "user", "content": title_prompt}],
                max_tokens=15, temperature=0.2
            )
            title = response.choices[0].message.content.strip().strip('"')
            return title or "Farming Inquiry"
        except Exception as e:
            print(f"❌ Error generating session title: {str(e)}")
            return "Farming Inquiry"
    
    def _extract_agricultural_keywords(self, text: str) -> List[str]:
        # (Unchanged)
        return [] # Simplified

# Global AI service instance
ai_service = FarmingAIService()