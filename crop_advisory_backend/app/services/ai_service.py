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
        return """You are CropAdvisor AI, an expert personal agricultural assistant and farming advisor for India.

🎯 CRITICAL BEHAVIOR RULES:
1. When you receive USER PROFILE INFORMATION in the context, YOU ALREADY KNOW these details about the user
2. If the user asks "do you know my [name/location/farm size/etc]?", respond DIRECTLY with the information you have
3. DO NOT ask users to provide information that is already in their profile
4. Be confident and specific when sharing profile information - treat it as established facts
5. When answering questions about their farm, reference their specific details (location, size, soil, irrigation)

Your core expertise includes:
• Crop selection and rotation strategies tailored to Indian climates
• Soil health management and organic farming practices
• Pest and disease identification with natural control methods
• Weather-based farming advice and monsoon preparation
• Irrigation efficiency and water conservation techniques
• Market trends and crop profitability analysis
• Government schemes (PM-KISAN, Soil Health Card, etc.)
• Modern farming technologies suitable for Indian agriculture

Communication style:
• Friendly, supportive, and encouraging tone
• Use simple language accessible to farmers of all education levels
• Provide actionable, practical advice based on Indian farming conditions
• When user profile is available, personalize ALL responses to their specific farm context
• Ask clarifying questions only when information is truly missing from the profile

Always prioritize:
✅ Sustainable and eco-friendly farming practices
✅ Cost-effective solutions suitable for small and medium farmers
✅ Local knowledge combined with modern scientific methods
✅ Profitability while maintaining soil health
✅ Food security and quality crop production

Remember: You have access to detailed user profiles. Use this information proactively to provide highly personalized farming guidance."""

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
        if not user_context or not isinstance(user_context, dict):
            return "No specific context available"
        
        context_parts = []
        
        # ✅ ENHANCED: Handle BOTH simple profile format AND legacy format
        personal_info = user_context.get("personal_info", {})
        if isinstance(personal_info, dict) and personal_info.get("full_name"):
            context_parts.append(f"Farmer Name: {personal_info['full_name']}")
            if personal_info.get("email"):
                context_parts.append(f"Contact Email: {personal_info['email']}")

        farm_profile = user_context.get("farm_profile", {})
        if isinstance(farm_profile, dict):
            # ✅ FIXED: Handle simple string location (NEW format from user_profiles)
            location = farm_profile.get("location")
            if location and isinstance(location, str) and location.strip():
                context_parts.append(f"Farm Location: {location}")
            # Legacy format: nested location object
            elif isinstance(location, dict) and location.get("state") and location.get("district"):
                context_parts.append(f"Farm Location: {location['district']}, {location['state']}, India")
            
            # ✅ FIXED: Handle direct farm_size (NEW format)
            farm_size = farm_profile.get("farm_size")
            if farm_size and (isinstance(farm_size, (int, float)) or isinstance(farm_size, str)):
                try:
                    size_num = float(farm_size)
                    if size_num > 0:
                        context_parts.append(f"Farm Size: {size_num} acres")
                except (ValueError, TypeError):
                    pass
            # Legacy format: nested farm_details
            else:
                farm_details = farm_profile.get("farm_details", {})
                if isinstance(farm_details, dict) and farm_details.get("total_area"):
                    context_parts.append(f"Farm Size: {farm_details['total_area']} acres")

            # ✅ FIXED: Handle direct soil_type (NEW format)
            soil_type = farm_profile.get("soil_type")
            if soil_type and isinstance(soil_type, str) and soil_type.strip():
                context_parts.append(f"Soil Type: {soil_type}")
            # Legacy format: nested soil_information
            else:
                soil_info = farm_profile.get("soil_information", {})
                if isinstance(soil_info, dict) and soil_info.get("primary_soil_type"):
                    context_parts.append(f"Soil Type: {soil_info['primary_soil_type']}")

            # ✅ FIXED: Handle direct irrigation_type (NEW format)
            irrigation_type = farm_profile.get("irrigation_type")
            if irrigation_type and isinstance(irrigation_type, str) and irrigation_type.strip():
                context_parts.append(f"Irrigation System: {irrigation_type}")
            # Legacy format: nested irrigation_system
            else:
                irrigation = farm_profile.get("irrigation_system", {})
                if isinstance(irrigation, dict) and irrigation.get("primary_method"):
                    context_parts.append(f"Irrigation System: {irrigation['primary_method']}")

        # Legacy farming_profile (still supported)
        farming_profile = user_context.get("farming_profile", {})
        if isinstance(farming_profile, dict):
            if farming_profile.get("experience_level"):
                context_parts.append(f"Farming Experience: {farming_profile['experience_level']}")
            if farming_profile.get("primary_crops"):
                crops_list = farming_profile['primary_crops']
                if isinstance(crops_list, list) and crops_list:
                    context_parts.append(f"Primary Crops: {', '.join(crops_list)}")

        if context_parts:
            formatted_context = "🎯 IMPORTANT - USER PROFILE INFORMATION:\n" + "\n".join(f"• {part}" for part in context_parts)
            formatted_context += "\n\n⚠️ CRITICAL INSTRUCTION:\nWhen the user asks about their farm details (name, location, size, soil, irrigation), YOU MUST respond with the SPECIFIC information listed above. DO NOT ask them to provide information you already have. Be confident and direct in sharing what you know about their farm."
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