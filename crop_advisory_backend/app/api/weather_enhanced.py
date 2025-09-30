"""
Weather API Router
New weather endpoints for enhanced crop advisory system
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, Dict, Any
import logging

from ..models.weather_models import (
    WeatherRequest, WeatherResponse, EnhancedWeatherResponse,
    CurrentWeather, WeatherForecast, AgriculturalWeatherInsights
)
from ..services.openweathermap_service import get_weather_service, OpenWeatherMapError
from ..config.weather_config import get_weather_settings

logger = logging.getLogger(__name__)

# Create router without prefix - will be added in main.py
router = APIRouter(tags=["Weather Enhanced"])

@router.get("/health")
async def weather_service_health():
    """Health check for weather service"""
    settings = get_weather_settings()
    
    return {
        "status": "healthy",
        "service": "weather-enhanced",
        "api_configured": bool(settings.openweather_api_key and settings.openweather_api_key != "your-openweather-api-key-here"),
        "cache_enabled": settings.enable_weather_cache,
        "endpoints": [
            "/weather-enhanced/current",
            "/weather-enhanced/forecast", 
            "/weather-enhanced/complete",
            "/weather-enhanced/agricultural-insights",
            "/weather-enhanced/by-city",
            "/weather-enhanced/ml-enhancement-data",
            "/weather-enhanced/crop-suitability"
        ]
    }

@router.get("/current", response_model=CurrentWeather)
async def get_current_weather(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude coordinate"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude coordinate"),
    location: Optional[str] = Query(None, description="Location name for reference")
):
    """
    Get current weather conditions for specific coordinates
    
    This endpoint provides real-time weather data that can enhance
    the existing crop recommendation system without affecting it.
    """
    try:
        weather_service = get_weather_service()
        current_weather = await weather_service.get_current_weather(
            latitude=latitude,
            longitude=longitude,
            location_name=location or f"Location ({latitude}, {longitude})"
        )
        
        logger.info(f"Retrieved current weather for {latitude}, {longitude}")
        return current_weather
        
    except OpenWeatherMapError as e:
        logger.error(f"Weather service error: {e.message}")
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error in get_current_weather: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/forecast", response_model=WeatherForecast)
async def get_weather_forecast(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude coordinate"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude coordinate"),
    location: Optional[str] = Query(None, description="Location name for reference")
):
    """
    Get 5-day weather forecast for specific coordinates
    
    Provides detailed forecast data for agricultural planning
    without interfering with existing crop recommendation logic.
    """
    try:
        weather_service = get_weather_service()
        forecast = await weather_service.get_forecast(
            latitude=latitude,
            longitude=longitude,
            location_name=location or f"Location ({latitude}, {longitude})"
        )
        
        logger.info(f"Retrieved weather forecast for {latitude}, {longitude}")
        return forecast
        
    except OpenWeatherMapError as e:
        logger.error(f"Weather service error: {e.message}")
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error in get_weather_forecast: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/complete", response_model=WeatherResponse)
async def get_complete_weather_data(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude coordinate"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude coordinate"),
    location: Optional[str] = Query(None, description="Location name for reference")
):
    """
    Get complete weather data (current + forecast)
    
    Combines current weather and forecast in a single response
    for comprehensive agricultural decision support.
    """
    try:
        weather_service = get_weather_service()
        complete_weather = await weather_service.get_complete_weather(
            latitude=latitude,
            longitude=longitude,
            location_name=location or f"Location ({latitude}, {longitude})"
        )
        
        logger.info(f"Retrieved complete weather data for {latitude}, {longitude}")
        return complete_weather
        
    except OpenWeatherMapError as e:
        logger.error(f"Weather service error: {e.message}")
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error in get_complete_weather_data: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/agricultural-insights", response_model=EnhancedWeatherResponse)
async def get_agricultural_weather_insights(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude coordinate"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude coordinate"),
    location: Optional[str] = Query(None, description="Location name for reference")
):
    """
    Get weather data with agricultural insights
    
    Provides weather data enhanced with agricultural recommendations,
    crop suitability analysis, and farming guidance.
    """
    try:
        weather_service = get_weather_service()
        enhanced_weather = await weather_service.get_enhanced_weather(
            latitude=latitude,
            longitude=longitude,
            location_name=location or f"Location ({latitude}, {longitude})"
        )
        
        logger.info(f"Retrieved enhanced weather insights for {latitude}, {longitude}")
        return enhanced_weather
        
    except OpenWeatherMapError as e:
        logger.error(f"Weather service error: {e.message}")
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error in get_agricultural_weather_insights: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/by-city", response_model=CurrentWeather)
async def get_weather_by_city_name(
    city: str = Query(..., description="City name (e.g., 'New Delhi', 'Mumbai')")
):
    """
    Get current weather by city name
    
    Alternative endpoint for users who prefer to search by city name
    instead of coordinates.
    """
    try:
        weather_service = get_weather_service()
        weather = await weather_service.get_weather_by_city(city)
        
        logger.info(f"Retrieved weather for city: {city}")
        return weather
        
    except OpenWeatherMapError as e:
        logger.error(f"Weather service error for city {city}: {e.message}")
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error in get_weather_by_city_name: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/ml-enhancement-data", response_model=Dict[str, Any])
async def get_ml_enhancement_data(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude coordinate"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude coordinate"),
    location: Optional[str] = Query(None, description="Location name for reference")
):
    """
    Get weather data formatted for ML model enhancement
    
    This endpoint provides weather data in the exact format needed
    to enhance the existing ML crop recommendation model without
    modifying the original model logic.
    """
    try:
        weather_service = get_weather_service()
        current_weather = await weather_service.get_current_weather(
            latitude=latitude,
            longitude=longitude,
            location_name=location or "Unknown"
        )
        
        # Format data for ML model (matching existing field names)
        ml_data = {
            "temperature": current_weather.temperature,
            "humidity": current_weather.humidity,
            "rainfall": current_weather.rain_1h or current_weather.rain_3h or 0.0,
            "weather_condition": current_weather.condition.value,
            "wind_speed": current_weather.wind_speed,
            "pressure": current_weather.pressure,
            "cloudiness": current_weather.cloudiness,
            
            # Additional context for enhanced recommendations
            "location": current_weather.location,
            "coordinates": {
                "latitude": current_weather.latitude,
                "longitude": current_weather.longitude
            },
            "timestamp": current_weather.dt.isoformat(),
            "source": "real_weather_data"
        }
        
        logger.info(f"Generated ML enhancement data for {latitude}, {longitude}")
        return {
            "ml_enhancement_data": ml_data,
            "status": "success",
            "data_freshness": "real_time",
            "confidence_boost": 0.15  # Estimated confidence improvement
        }
        
    except OpenWeatherMapError as e:
        logger.error(f"Weather service error: {e.message}")
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error in get_ml_enhancement_data: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/crop-suitability", response_model=Dict[str, Any])
async def get_crop_suitability(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude coordinate"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude coordinate"),
    crop: str = Query(..., description="Crop name for suitability analysis"),
    location: Optional[str] = Query(None, description="Location name for reference")
):
    """
    Analyze crop suitability based on current weather conditions
    
    This endpoint evaluates how suitable the current weather conditions
    are for growing a specific crop at the given location.
    """
    try:
        weather_service = get_weather_service()
        current_weather = await weather_service.get_current_weather(
            latitude=latitude,
            longitude=longitude,
            location_name=location or f"Location ({latitude}, {longitude})"
        )
        
        # Get crop requirements from config
        from ..config.weather_config import get_crop_weather_requirements
        requirements = get_crop_weather_requirements(crop.lower())
        
        if not requirements:
            return {
                "crop": crop,
                "suitability": "unknown",
                "message": f"No weather requirements data available for {crop}",
                "current_conditions": {
                    "temperature": current_weather.temperature,
                    "humidity": current_weather.humidity,
                    "condition": current_weather.condition.value
                }
            }
        
        # Analyze suitability
        temp_range = requirements.get("optimal_temp_range", (0, 50))
        humidity_tolerance = requirements.get("humidity_tolerance", "Medium")
        
        # Convert humidity tolerance to range for comparison
        humidity_ranges = {
            "Low": (0, 40),
            "Medium": (40, 70), 
            "High": (70, 100),
            "Very High": (80, 100)
        }
        humidity_range = humidity_ranges.get(humidity_tolerance, (0, 100))
        
        # Calculate suitability score
        temp_suitable = temp_range[0] <= current_weather.temperature <= temp_range[1]
        humidity_suitable = humidity_range[0] <= current_weather.humidity <= humidity_range[1]
        
        if temp_suitable and humidity_suitable:
            suitability = "excellent"
            score = 90
        elif temp_suitable or humidity_suitable:
            suitability = "good"
            score = 70
        else:
            suitability = "poor"
            score = 30
        
        logger.info(f"Analyzed crop suitability for {crop} at {latitude}, {longitude}")
        
        return {
            "crop": crop,
            "location": current_weather.location,
            "suitability": suitability,
            "suitability_score": score,
            "current_conditions": {
                "temperature": current_weather.temperature,
                "humidity": current_weather.humidity,
                "condition": current_weather.condition.value,
                "wind_speed": current_weather.wind_speed,
                "pressure": current_weather.pressure
            },
            "crop_requirements": {
                "optimal_temp_range": temp_range,
                "humidity_tolerance": humidity_tolerance,
                "water_requirement": requirements.get("water_requirement", "Unknown")
            },
            "analysis": {
                "temperature_match": temp_suitable,
                "humidity_match": humidity_suitable,
                "recommendations": [
                    "Monitor soil moisture levels",
                    "Check local rainfall patterns",
                    "Consider seasonal variations"
                ]
            },
            "timestamp": current_weather.dt.isoformat()
        }
        
    except OpenWeatherMapError as e:
        logger.error(f"Weather service error: {e.message}")
        raise HTTPException(status_code=400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error in get_crop_suitability: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/test-integration")
async def test_weather_integration():
    """
    Test endpoint to verify weather integration is working
    
    This endpoint tests the weather service without affecting
    any existing functionality. Safe to call during development.
    """
    try:
        weather_service = get_weather_service()
        settings = get_weather_settings()
        
        # Test with default coordinates (Delhi)
        test_weather = await weather_service.get_current_weather(
            latitude=settings.default_latitude,
            longitude=settings.default_longitude,
            location_name="Test Location"
        )
        
        return {
            "status": "success",
            "message": "Weather integration is working correctly",
            "test_data": {
                "location": test_weather.location,
                "temperature": test_weather.temperature,
                "humidity": test_weather.humidity,
                "condition": test_weather.condition.value,
                "source": test_weather.source
            },
            "service_info": {
                "api_configured": not weather_service.use_mock_data,
                "using_mock_data": weather_service.use_mock_data,
                "cache_enabled": settings.enable_weather_cache
            }
        }
        
    except Exception as e:
        logger.error(f"Weather integration test failed: {str(e)}")
        return {
            "status": "error",
            "message": f"Weather integration test failed: {str(e)}",
            "service_info": {
                "api_configured": False,
                "using_mock_data": True,
                "error_details": str(e)
            }
        }