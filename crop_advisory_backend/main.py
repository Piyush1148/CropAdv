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

# Load environment variables
load_dotenv()

# Import API routers
from app.api import health, crops, weather, chat, auth

# Import configuration
from app.config.settings import get_settings

# Create FastAPI application with professional configuration
app = FastAPI(
    title="Crop Advisory System API",
    description="Professional ML-powered crop recommendation and advisory system",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Get settings
settings = get_settings()

# Configure CORS for React frontend - Direct configuration to avoid cache issues
FRONTEND_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173", 
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",  # Main frontend port
    "http://127.0.0.1:5176",
    "*"  # Allow all for development
]

print(f"🔧 CORS Origins configured: {FRONTEND_ORIGINS}")

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
app.include_router(chat.router, prefix="/api/chat", tags=["AI Assistant"])

# Weather Enhancement Integration (NEW - Non-disruptive)
try:
    from app.api.weather_enhanced import router as weather_enhanced_router
    print(f"🔍 Weather router has {len(weather_enhanced_router.routes)} routes")
    app.include_router(weather_enhanced_router, prefix="/weather-enhanced", tags=["Weather Enhanced"])
    print("🌤️ Weather Enhanced API: Successfully integrated with routes:")
    for route in weather_enhanced_router.routes:
        if hasattr(route, 'path'):
            print(f"   📍 /weather-enhanced{route.path}")
except ImportError as e:
    print(f"⚠️ Weather Enhanced API: Optional module not found - {e}")
    # Continue without weather enhancement - doesn't affect existing functionality

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

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("🌱 Crop Advisory System API starting up...")
    print(f"📊 Debug mode: {settings.DEBUG}")
    print(f"🔥 Firebase project: {settings.FIREBASE_PROJECT_ID}")
    print("✅ API ready to serve crop recommendations!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("🌱 Crop Advisory System API shutting down...")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.FASTAPI_HOST,
        port=settings.FASTAPI_PORT,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info"
    )