"""
Configuration settings for the Crop Advisory System
Professional configuration management using Pydantic Settings
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import os
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # FastAPI Configuration
    FASTAPI_HOST: str = Field(default="localhost", description="FastAPI host")
    FASTAPI_PORT: int = Field(default=8000, description="FastAPI port")
    DEBUG: bool = Field(default=True, description="Debug mode")
    SECRET_KEY: str = Field(default="dev-secret-key", description="Secret key for JWT")
    
    # Firebase Configuration
    FIREBASE_PROJECT_ID: str = Field(default="", description="Firebase project ID")
    FIREBASE_PRIVATE_KEY_ID: str = Field(default="", description="Firebase private key ID")
    FIREBASE_PRIVATE_KEY: str = Field(default="", description="Firebase private key")
    FIREBASE_CLIENT_EMAIL: str = Field(default="", description="Firebase client email")
    FIREBASE_CLIENT_ID: str = Field(default="", description="Firebase client ID")
    FIREBASE_AUTH_URI: str = Field(default="https://accounts.google.com/o/oauth2/auth")
    FIREBASE_TOKEN_URI: str = Field(default="https://oauth2.googleapis.com/token")
    
    # External API Keys
    OPENWEATHER_API_KEY: str = Field(default="", description="OpenWeather API key")
    WEATHER_API_KEY: str = Field(default="", description="Weather API key")
    GROQ_API_KEY: str = Field(default="", description="GROQ API key for AI assistant")
    
    # Redis Configuration
    REDIS_URL: str = Field(default="redis://localhost:6379", description="Redis URL")
    
    # CORS Settings
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:3000,http://127.0.0.1:5176,*",
        description="Allowed CORS origins (comma-separated)"
    )
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert ALLOWED_ORIGINS string to list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    # Firebase Service Account
    FIREBASE_SERVICE_ACCOUNT_PATH: str = Field(
        default="./firebase-service-account.json", 
        description="Path to Firebase service account JSON file"
    )
    
    # ML Model Configuration
    MODEL_PATH: str = Field(default="./ml_models/crop_recommendation_model.joblib")
    SCALER_PATH: str = Field(default="./ml_models/feature_scaler.joblib")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()