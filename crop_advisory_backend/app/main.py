# app/main.py

"""
Crop Advisory System - FastAPI Backend
Main application entry point with professional configuration
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn
import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# Load environment variables
load_dotenv()

# Import API routers
from .api import health, crops, weather, chat, auth, weather_enhanced

# Import configuration
from .config.settings import get_settings

# --- FIX: LIFESPAN MANAGEMENT FOR ML MODEL ---
# This function will run on application startup and shutdown.
@asynccontextmanager
async def lifespan(app: FastAPI):
    # This code runs ONCE when the server starts up
    print("🌱 Crop Advisory System API starting up...")
    print("🧠 Loading Machine Learning model...")
    
    # Call the function from the crops router to load the model into memory
    crops.load_ml_model()
    
    print("✅ API ready to serve crop recommendations!")
    
    yield
    
    # This code runs when the server shuts down
    print("🌱 Crop Advisory System API shutting down...")


# Create FastAPI application with the new lifespan manager
app = FastAPI(
    title="Crop Advisory System API",
    description="Professional ML-powered crop recommendation and advisory system",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan  # <-- This is the key change
)

# Get settings
settings = get_settings()

# Configure CORS for React frontend
FRONTEND_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5176",
    "*"  # Allow all for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Add trusted host middleware for security
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.vercel.app"]
)

# Include API routers with prefixes
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(crops.router, prefix="/api/crops", tags=["Crop Recommendations"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather Data"])
app.include_router(weather_enhanced.router, prefix="/weather-enhanced", tags=["Weather Enhanced"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI Assistant"])

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Crop Advisory System API",
        "version": "1.0.0",
        "status": "active",
        "docs": "/api/docs",
        "health": "/api/health"
    }

# The old @app.on_event("startup") and ("shutdown") decorators have been removed
# as their logic is now handled by the lifespan manager above.