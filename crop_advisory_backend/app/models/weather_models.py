"""
Weather Data Models for Crop Advisory System
Pydantic models for weather data validation and serialization
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class WeatherCondition(str, Enum):
    """Weather condition categories"""
    CLEAR = "clear"
    CLOUDS = "clouds"
    RAIN = "rain"
    DRIZZLE = "drizzle"
    THUNDERSTORM = "thunderstorm"
    SNOW = "snow"
    MIST = "mist"
    SMOKE = "smoke"
    HAZE = "haze"
    DUST = "dust"
    FOG = "fog"
    SAND = "sand"
    ASH = "ash"
    SQUALL = "squall"
    TORNADO = "tornado"

class WeatherAlert(BaseModel):
    """Weather alert model"""
    sender_name: str
    event: str
    start: datetime
    end: datetime
    description: str
    tags: List[str] = []

class CurrentWeather(BaseModel):
    """Current weather conditions model"""
    location: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    
    # Weather conditions
    condition: WeatherCondition
    description: str
    
    # Temperature data
    temperature: float = Field(..., description="Temperature in Celsius")
    feels_like: float = Field(..., description="Feels like temperature in Celsius")
    temp_min: float
    temp_max: float
    
    # Atmospheric data
    pressure: int = Field(..., description="Atmospheric pressure in hPa")
    humidity: int = Field(..., ge=0, le=100, description="Humidity percentage")
    visibility: Optional[int] = Field(None, description="Visibility in meters")
    
    # Wind data
    wind_speed: float = Field(..., description="Wind speed in m/s")
    wind_deg: Optional[int] = Field(None, ge=0, le=360, description="Wind direction in degrees")
    wind_gust: Optional[float] = Field(None, description="Wind gust speed in m/s")
    
    # Precipitation
    rain_1h: Optional[float] = Field(None, description="Rain volume for last hour in mm")
    rain_3h: Optional[float] = Field(None, description="Rain volume for last 3 hours in mm")
    snow_1h: Optional[float] = Field(None, description="Snow volume for last hour in mm")
    snow_3h: Optional[float] = Field(None, description="Snow volume for last 3 hours in mm")
    
    # Cloud data
    cloudiness: int = Field(..., ge=0, le=100, description="Cloudiness percentage")
    
    # Time data
    dt: datetime = Field(..., description="Data calculation time")
    sunrise: datetime
    sunset: datetime
    timezone: int = Field(..., description="Timezone shift in seconds from UTC")
    
    # Data source
    source: str = Field(default="openweathermap", description="Weather data source")
    
    @validator('temperature', 'feels_like', 'temp_min', 'temp_max')
    def validate_temperature_range(cls, v):
        if v < -50 or v > 60:
            raise ValueError('Temperature must be between -50°C and 60°C')
        return v

class WeatherForecastItem(BaseModel):
    """Single forecast item model"""
    dt: datetime
    temperature: float
    feels_like: float
    temp_min: float
    temp_max: float
    pressure: int
    humidity: int
    condition: WeatherCondition
    description: str
    wind_speed: float
    wind_deg: Optional[int] = None
    cloudiness: int
    pop: float = Field(..., ge=0, le=1, description="Probability of precipitation")
    rain_3h: Optional[float] = None
    snow_3h: Optional[float] = None

class WeatherForecast(BaseModel):
    """Weather forecast model (5-day forecast)"""
    location: str
    latitude: float
    longitude: float
    forecast: List[WeatherForecastItem]
    source: str = "openweathermap"
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class LocationData(BaseModel):
    """Location data model"""
    name: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    country: str
    state: Optional[str] = None
    local_names: Optional[Dict[str, str]] = None

class WeatherRequest(BaseModel):
    """Weather request model"""
    location: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    include_forecast: bool = False
    include_alerts: bool = False
    
    @validator('location')
    def location_or_coordinates_required(cls, v, values):
        if not v and ('latitude' not in values or 'longitude' not in values):
            raise ValueError('Either location name or latitude/longitude must be provided')
        return v

class WeatherResponse(BaseModel):
    """Complete weather response model"""
    current: CurrentWeather
    forecast: Optional[WeatherForecast] = None
    alerts: Optional[List[WeatherAlert]] = None
    cached: bool = False
    cache_expires_at: Optional[datetime] = None

class WeatherCacheEntry(BaseModel):
    """Weather cache entry model"""
    key: str
    data: Dict[str, Any]
    expires_at: datetime
    location_hash: str

class AgriculturalWeatherInsights(BaseModel):
    """Agricultural insights derived from weather data"""
    planting_conditions: str = Field(..., description="Planting suitability assessment")
    irrigation_recommendation: str = Field(..., description="Irrigation guidance")
    pest_disease_risk: str = Field(..., description="Pest and disease risk level")
    harvest_conditions: str = Field(..., description="Harvest timing recommendations")
    crop_stress_indicators: List[str] = Field(default=[], description="Environmental stress factors")
    
    # Weather-based crop recommendations
    suitable_crops: List[str] = Field(default=[], description="Crops suitable for current weather")
    unsuitable_crops: List[str] = Field(default=[], description="Crops to avoid in current weather")
    
    # Timing recommendations
    best_planting_window: Optional[str] = None
    best_harvest_window: Optional[str] = None
    fertilizer_application_timing: Optional[str] = None

class EnhancedWeatherResponse(BaseModel):
    """Enhanced weather response with agricultural insights"""
    weather: WeatherResponse
    agricultural_insights: AgriculturalWeatherInsights
    ml_enhancement_data: Dict[str, float] = Field(
        default={},
        description="Weather data formatted for ML model input"
    )

# Error models
class WeatherServiceError(BaseModel):
    """Weather service error model"""
    error_code: str
    error_message: str
    error_details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)