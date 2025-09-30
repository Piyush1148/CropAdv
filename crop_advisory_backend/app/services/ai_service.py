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
            
            # Direct initialization with updated GROQ library (v0.31.1+)
            from groq import Groq
            self.client = Groq(api_key=api_key)
            print("✅ GROQ AI Service initialized successfully")
            
            # Test the connection with a simple call
            test_response = self.client.chat.completions.create(
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
        return """You are CropAdvisor AI, an expert personal agricultural assistant designed to provide highly personalized farming guidance based on individual farmer profiles, locations, and farming conditions.

CORE IDENTITY:
- Personal farming consultant with deep agricultural expertise
- Friendly, supportive assistant who knows each farmer's specific situation
- Practical advisor focused on actionable, location-specific recommendations
- Encouraging mentor who adapts communication style to farmer's experience level

EXPERTISE AREAS:
- Personalized crop selection based on soil type, location, and experience
- Location-specific soil health and fertilizer guidance
- Regional pest and disease identification and management
- Localized weather impact assessment and mitigation strategies
- Custom seasonal farming calendars for specific crops and regions
- Irrigation optimization based on available systems and water resources
- Sustainable and organic farming practices tailored to farm size and goals
- Strategic crop rotation planning for soil health and profitability
- Precise harvest timing based on crop variety and local conditions
- Regional market trends and pricing insights

PERSONALIZATION CAPABILITIES:
- Use farmer's name and reference their specific farm details
- Adapt technical complexity to their experience level (beginner/intermediate/expert)
- Consider their soil type, irrigation system, and farm size in all recommendations
- Reference their primary crops and farming methods
- Build on previous conversations and topics of interest
- Provide location-specific advice for their district/state
- Suggest solutions within their likely resource constraints

COMMUNICATION GUIDELINES:
- Address farmers personally and warmly when profile information is available
- Adapt language complexity to experience level (simple for beginners, detailed for experts)
- Always consider local climate, soil, and market conditions in advice
- Reference specific crops they grow and methods they use
- Provide step-by-step guidance for complex tasks
- Offer alternative solutions based on resource availability
- Build rapport by acknowledging their farming background and successes

SAFETY & SUSTAINABILITY PRIORITIES:
- Always prioritize farmer and community safety
- Promote sustainable and environmentally friendly practices
- Consider long-term soil health and farm ecosystem balance
- Recommend cost-effective solutions appropriate to farm size
- Suggest consulting local agricultural experts for complex technical issues
- Provide culturally appropriate advice for Indian farming contexts

TECHNICAL INTEGRATION:
- Leverage ML crop recommendation model (99.32% accuracy) for soil-based suggestions
- Reference recent AI recommendations when relevant
- Consider profile completion level when asking for additional information
- Use interaction history to avoid repeating information and build continuity

RESPONSE STRUCTURE:
- Start with personalized greeting when appropriate
- Provide main answer tailored to their specific situation  
- Include location/crop/soil-specific considerations
- Offer follow-up questions or next steps
- Encourage further engagement and learning

Remember: You are not just providing generic farming advice - you are their personal agricultural consultant who understands their unique farming situation and goals."""

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
            # Prepare conversation with context
            messages = self._format_conversation_history(conversation_history)
            
            # Add user context if available
            if user_context:
                context_info = self._format_user_context(user_context)
                messages[0]["content"] += f"\n\nUSER CONTEXT:\n{context_info}"
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # Get response from GROQ
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                top_p=0.9,
                stream=False
            )
            
            # Extract response content
            ai_content = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else None
            
            response_time = time.time() - start_time
            
            return AIResponse(
                message_id=message_id,
                content=ai_content,
                session_id="",  # Will be set by calling function
                model_used=self.model,
                response_time=response_time,
                tokens_used=tokens_used,
                confidence=0.9  # GROQ doesn't provide confidence, using default
            )
            
        except Exception as e:
            response_time = time.time() - start_time
            error_message = f"I apologize, but I'm experiencing technical difficulties. Please try again in a moment. Error: {str(e)}"
            
            return AIResponse(
                message_id=message_id,
                content=error_message,
                session_id="",
                model_used=self.model,
                response_time=response_time,
                tokens_used=0,
                confidence=0.0
            )

    def _format_user_context(self, user_context: Dict) -> str:
        """Format comprehensive user context for personalized AI responses"""
        # CRITICAL: Defensive programming to prevent str object errors
        if not user_context:
            return "No specific context available"
        
        # Ensure user_context is actually a dictionary
        if not isinstance(user_context, dict):
            print(f"⚠️ WARNING: user_context is not a dict, got {type(user_context)}: {user_context}")
            return "Invalid user context format - please check profile setup"
        
        context_parts = []
        
        # === PERSONAL INFORMATION ===
        personal_info = user_context.get("personal_info", {})
        # Ensure personal_info is a dict
        if isinstance(personal_info, dict) and personal_info.get("full_name"):
            context_parts.append(f"Farmer: {personal_info['full_name']}")
        
        # === LOCATION & FARM DETAILS ===
        location_info = user_context.get("location", {})
        # Ensure location_info is a dict
        if isinstance(location_info, dict):
            if location_info.get("state") and location_info.get("district"):
                context_parts.append(f"Location: {location_info['district']}, {location_info['state']}, India")
        elif isinstance(user_context.get("location"), str):
            context_parts.append(f"Location: {user_context['location']}")
        
        # Farm size and details
        farm_details = user_context.get("farm_details", {})
        # Ensure farm_details is a dict
        if isinstance(farm_details, dict) and farm_details.get("total_area"):
            context_parts.append(f"Farm Size: {farm_details['total_area']} acres")
        
        # === SOIL INFORMATION ===
        soil_info = user_context.get("soil_information", {})
        # Ensure soil_info is a dict
        if isinstance(soil_info, dict) and soil_info.get("primary_soil_type"):
            soil_parts = [f"Soil Type: {soil_info['primary_soil_type']}"]
            if soil_info.get("soil_ph"):
                soil_parts.append(f"pH: {soil_info['soil_ph']}")
            if soil_info.get("organic_content"):
                soil_parts.append(f"Organic Content: {soil_info['organic_content']}%")
            context_parts.append(", ".join(soil_parts))
        
        # === IRRIGATION SYSTEM ===
        irrigation = user_context.get("irrigation_system", {})
        # Ensure irrigation is a dict
        if isinstance(irrigation, dict) and irrigation.get("primary_method"):
            context_parts.append(f"Irrigation: {irrigation['primary_method']}")
        
        # === FARMING EXPERIENCE & CROPS ===
        farming_profile = user_context.get("farming_profile", {})
        # Ensure farming_profile is a dict
        if not isinstance(farming_profile, dict):
            farming_profile = {}
        
        # Experience level
        if farming_profile.get("experience_level"):
            exp_text = f"Experience: {farming_profile['experience_level']}"
            if farming_profile.get("years_of_experience"):
                exp_text += f" ({farming_profile['years_of_experience']} years)"
            context_parts.append(exp_text)
        
        # Primary crops
        if farming_profile.get("primary_crops"):
            crops_list = farming_profile['primary_crops']
            if isinstance(crops_list, list) and crops_list:
                context_parts.append(f"Primary Crops: {', '.join(crops_list)}")
        
        # Farming methods
        if farming_profile.get("farming_methods"):
            methods = farming_profile['farming_methods']
            if isinstance(methods, list) and methods:
                context_parts.append(f"Methods: {', '.join(methods)}")
        
        # === AI INTERACTION HISTORY ===
        ai_personalization = user_context.get("ai_personalization", {})
        # Ensure ai_personalization is a dict
        if isinstance(ai_personalization, dict):
            interaction_history = ai_personalization.get("interaction_history", {})
            # Ensure interaction_history is a dict
            if isinstance(interaction_history, dict):
                # Previous topics of interest
                if interaction_history.get("favorite_topics"):
                    topics = interaction_history['favorite_topics'][-3:]  # Last 3 topics
                    if topics and isinstance(topics, list):
                        context_parts.append(f"Recent Topics: {', '.join(topics)}")
                
                # Response quality feedback
                if interaction_history.get("response_ratings"):
                    ratings = interaction_history['response_ratings']
                    if ratings and isinstance(ratings, list) and len(ratings) > 0:
                        avg_rating = sum(ratings[-5:]) / len(ratings[-5:])  # Last 5 ratings
                        context_parts.append(f"AI Response Quality: {avg_rating:.1f}/5.0")
        
                # Total conversations
                total_convos = interaction_history.get("total_conversations", 0)
                if total_convos > 0:
                    context_parts.append(f"Previous Consultations: {total_convos}")
        
        # === RECENT PREDICTIONS/RECOMMENDATIONS ===
        recent_preds = user_context.get("recent_predictions")
        if isinstance(recent_preds, list) and recent_preds:
            try:
                crops = []
                for pred in recent_preds[:3]:
                    if isinstance(pred, dict):
                        crops.append(pred.get("crop", "unknown"))
                if crops:
                    context_parts.append(f"Recent ML Recommendations: {', '.join(crops)}")
            except Exception as e:
                print(f"⚠️ WARNING: Error processing recent_predictions: {e}")
        
        # === COMMUNICATION PREFERENCES ===
        comm_prefs = user_context.get("communication_preferences", {})
        if isinstance(comm_prefs, dict):
            if comm_prefs.get("response_style"):
                context_parts.append(f"Preferred Response Style: {comm_prefs['response_style']}")
            if comm_prefs.get("technical_level"):
                context_parts.append(f"Technical Level: {comm_prefs['technical_level']}")
        
        # === VERIFICATION & PROFILE STATUS ===
        verification = user_context.get("verification_status", {})
        if isinstance(verification, dict):
            if verification.get("phone_verified") or verification.get("farm_verified"):
                verified_items = []
                if verification.get("phone_verified"):
                    verified_items.append("phone")
                if verification.get("farm_verified"):
                    verified_items.append("farm")
                context_parts.append(f"Verified: {', '.join(verified_items)}")
        
        # Profile completion
        metadata = user_context.get("metadata", {})
        if isinstance(metadata, dict):
            completion = metadata.get("profile_completion_percentage")
            if completion is not None:
                context_parts.append(f"Profile Completion: {completion}%")
        
        # === FORMAT FINAL CONTEXT ===
        if context_parts:
            formatted_context = "USER PROFILE CONTEXT:\n" + "\n".join(f"• {part}" for part in context_parts)
            
            # Add personalization note
            formatted_context += "\n\nPERSONALIZATION INSTRUCTIONS:"
            formatted_context += "\n• Address the farmer by name when appropriate"
            formatted_context += "\n• Tailor advice to their specific location, soil type, and crops"
            formatted_context += "\n• Consider their experience level in explanations"
            formatted_context += "\n• Reference their farming methods and irrigation system"
            formatted_context += "\n• Build on previous conversation topics when relevant"
            
            return formatted_context
        
        return "No specific context available"

    def get_quick_actions(self) -> List[Dict[str, str]]:
        """Get predefined quick action prompts for farming assistance"""
        return [
            {
                "id": "crop_care",
                "label": "Crop Care Tips",
                "prompt": "What are the essential care tips for healthy crop growth?",
                "category": "general",
                "icon": "leaf"
            },
            {
                "id": "disease_help", 
                "label": "Disease Identification",
                "prompt": "Help me identify and treat crop diseases. What should I look for?",
                "category": "diseases",
                "icon": "alert-circle"
            },
            {
                "id": "weather_advice",
                "label": "Weather Impact",
                "prompt": "How does current weather affect my crops and what precautions should I take?",
                "category": "weather", 
                "icon": "cloud"
            },
            {
                "id": "soil_health",
                "label": "Soil Health",
                "prompt": "How can I improve my soil health and fertility naturally?",
                "category": "crops",
                "icon": "layers"
            },
            {
                "id": "irrigation_tips",
                "label": "Irrigation Guide",
                "prompt": "What are the best irrigation practices for different crops?",
                "category": "care",
                "icon": "droplets"
            },
            {
                "id": "harvest_timing",
                "label": "Harvest Timing",
                "prompt": "How do I know when my crops are ready for harvest?",
                "category": "general",
                "icon": "calendar"
            },
            {
                "id": "organic_farming",
                "label": "Organic Methods",
                "prompt": "What are effective organic farming techniques I can implement?",
                "category": "crops",
                "icon": "heart"
            },
            {
                "id": "pest_control",
                "label": "Pest Management", 
                "prompt": "How can I manage pests without harmful chemicals?",
                "category": "diseases",
                "icon": "shield"
            }
        ]

    async def health_check(self) -> Dict[str, str]:
        """Check if GROQ service is available"""
        try:
            if not self.client:
                return {"status": "error", "message": "Client not initialized"}
            
            # Simple test request
            test_response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            
            return {
                "status": "healthy",
                "model": self.model,
                "message": "GROQ AI service is operational"
            }
            
        except Exception as e:
            return {
                "status": "error", 
                "message": f"GROQ service unavailable: {str(e)}"
            }
    
    async def generate_session_title(self, conversation_messages: List[ChatMessage]) -> str:
        """Generate a concise, meaningful title for a chat session based on conversation content"""
        
        if not self.client:
            raise Exception("GROQ client not initialized. Check your API key.")
        
        if not conversation_messages:
            return "New Chat Session"
        
        try:
            # Prepare conversation context - take first few messages to understand topic
            context_messages = []
            message_count = 0
            
            for msg in conversation_messages[:6]:  # First 6 messages to understand context
                if msg.role in [MessageRole.USER, MessageRole.ASSISTANT]:
                    context_messages.append({
                        "role": "user" if msg.role == MessageRole.USER else "assistant",
                        "content": msg.content[:200]  # Truncate long messages
                    })
                    message_count += 1
                    if message_count >= 4:  # Limit to 4 messages for title generation
                        break
            
            # Create title generation prompt
            title_prompt = """Based on the following conversation between a farmer and an agricultural AI assistant, generate a concise, descriptive title (2-4 words maximum) that captures the main topic or purpose of the conversation.

Guidelines:
- Focus on the primary agricultural topic (crops, diseases, fertilizers, weather, etc.)
- Use farming/agricultural terminology when appropriate
- Keep it short and clear (2-4 words)
- Make it specific and helpful for identifying the conversation later

Examples:
- "Wheat Disease Diagnosis"
- "Fertilizer Recommendations"
- "Soil pH Testing"
- "Crop Irrigation Help"
- "Pest Control Advice"

Conversation:"""

            # Add conversation context
            for msg in context_messages:
                role_label = "Farmer" if msg["role"] == "user" else "AI Assistant"
                title_prompt += f"\n{role_label}: {msg['content']}"
            
            title_prompt += "\n\nGenerate a title (2-4 words only, no quotes or extra text):"
            
            # Get title from GROQ
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": title_prompt}],
                max_tokens=20,  # Keep response short
                temperature=0.3,  # Lower temperature for more focused responses
                top_p=0.8,
                stream=False
            )
            
            # Extract and clean title
            title = response.choices[0].message.content.strip()
            
            # Clean up the title (remove quotes, extra punctuation)
            title = title.strip('"').strip("'").strip().title()
            
            # Fallback if title is too long or empty
            if len(title) > 50 or len(title.split()) > 6:
                # Extract main agricultural keywords as fallback
                user_messages = [msg.content.lower() for msg in conversation_messages if msg.role == MessageRole.USER]
                keywords = self._extract_agricultural_keywords(" ".join(user_messages))
                if keywords:
                    title = f"{keywords[0].title()} Consultation"
                else:
                    title = "Agricultural Consultation"
            
            return title or "Chat Session"
            
        except Exception as e:
            print(f"❌ Error generating session title: {str(e)}")
            # Fallback to keyword-based title
            try:
                user_messages = [msg.content.lower() for msg in conversation_messages if msg.role == MessageRole.USER]
                keywords = self._extract_agricultural_keywords(" ".join(user_messages))
                if keywords:
                    return f"{keywords[0].title()} Help"
                else:
                    return "Farm Consultation"
            except:
                return "Chat Session"
    
    def _extract_agricultural_keywords(self, text: str) -> List[str]:
        """Extract common agricultural keywords from text for fallback titles"""
        agricultural_terms = [
            "wheat", "rice", "corn", "maize", "barley", "soybean", "cotton", "tomato",
            "potato", "carrot", "onion", "lettuce", "cabbage", "spinach", "bean",
            "fertilizer", "pesticide", "irrigation", "disease", "pest", "fungus",
            "soil", "ph", "nitrogen", "phosphorus", "potassium", "compost",
            "weather", "rain", "drought", "temperature", "humidity", "season",
            "planting", "harvest", "seed", "crop", "yield", "growth"
        ]
        
        found_keywords = []
        text_lower = text.lower()
        
        for term in agricultural_terms:
            if term in text_lower:
                found_keywords.append(term)
        
        return found_keywords[:2]  # Return first 2 found keywords

# Global AI service instance
ai_service = FarmingAIService()