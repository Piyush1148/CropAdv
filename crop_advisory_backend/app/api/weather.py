"""
Weather data endpoints - External API integration
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
import os
from datetime import datetime

router = APIRouter()

class WeatherData(BaseModel):
    """Weather data response model"""
    location: str
    temperature: float
    humidity: float
    rainfall: float
    weather_description: str
    timestamp: datetime
    source: str

@router.get("/current/{location}")
async def get_current_weather(location: str):
    """Get current weather data for a location"""
    
    # Check if we have API key
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return get_mock_weather_data(location)
    
    try:
        async with httpx.AsyncClient() as client:
            url = f"https://api.openweathermap.org/data/2.5/weather"
            params = {
                "q": location,
                "appid": api_key,
                "units": "metric"
            }
            
            response = await client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            return WeatherData(
                location=data["name"],
                temperature=data["main"]["temp"],
                humidity=data["main"]["humidity"],
                rainfall=data.get("rain", {}).get("1h", 0),
                weather_description=data["weather"][0]["description"],
                timestamp=datetime.utcnow(),
                source="OpenWeatherMap"
            )
            
    except Exception as e:
        # Fall back to mock data on error
        return get_mock_weather_data(location)

@router.get("/forecast/{location}")
async def get_weather_forecast(
    location: str,
    days: int = Query(default=7, ge=1, le=14, description="Number of forecast days")
):
    """Get weather forecast for a location"""
    
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return get_mock_forecast_data(location, days)
    
    try:
        async with httpx.AsyncClient() as client:
            url = f"https://api.openweathermap.org/data/2.5/forecast"
            params = {
                "q": location,
                "appid": api_key,
                "units": "metric",
                "cnt": days * 8  # 8 forecasts per day (every 3 hours)
            }
            
            response = await client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            # Process forecast data
            forecasts = []
            for item in data["list"]:
                forecasts.append({
                    "datetime": item["dt_txt"],
                    "temperature": item["main"]["temp"],
                    "humidity": item["main"]["humidity"],
                    "rainfall": item.get("rain", {}).get("3h", 0),
                    "weather_description": item["weather"][0]["description"]
                })
            
            return {
                "location": data["city"]["name"],
                "country": data["city"]["country"],
                "forecasts": forecasts,
                "total_forecasts": len(forecasts),
                "source": "OpenWeatherMap"
            }
            
    except Exception as e:
        return get_mock_forecast_data(location, days)

def get_mock_weather_data(location: str) -> WeatherData:
    """Return mock weather data when API is not available"""
    return WeatherData(
        location=location,
        temperature=28.5,
        humidity=65.0,
        rainfall=12.3,
        weather_description="Partly cloudy with light rain",
        timestamp=datetime.utcnow(),
        source="Mock Data"
    )

def get_mock_forecast_data(location: str, days: int) -> Dict[str, Any]:
    """Return mock forecast data"""
    forecasts = []
    
    for day in range(days):
        for hour in [6, 12, 18]:  # 3 times per day
            forecasts.append({
                "datetime": f"2024-01-{day+1:02d} {hour:02d}:00:00",
                "temperature": 25.0 + (day * 0.5) + (hour * 0.1),
                "humidity": 60.0 + (day * 2),
                "rainfall": max(0, 10 - day),
                "weather_description": "Clear sky" if day < 3 else "Light rain"
            })
    
    return {
        "location": location,
        "country": "IN",
        "forecasts": forecasts,
        "total_forecasts": len(forecasts),
        "source": "Mock Data"
    }