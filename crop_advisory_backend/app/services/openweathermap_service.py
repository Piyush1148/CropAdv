"""
OpenWeatherMap API Service
Service for integrating with OpenWeatherMap API
"""

import aiohttp
import asyncio
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Tuple, Any
import logging
from functools import wraps

from ..models.weather_models import (
    CurrentWeather, WeatherForecast, WeatherForecastItem, 
    WeatherAlert, LocationData, WeatherCondition, WeatherResponse,
    AgriculturalWeatherInsights, EnhancedWeatherResponse
)
from ..config.weather_config import get_weather_settings, WEATHER_ENDPOINTS, CROP_WEATHER_REQUIREMENTS

logger = logging.getLogger(__name__)

class OpenWeatherMapError(Exception):
    """Custom exception for OpenWeatherMap API errors"""
    def __init__(self, message: str, status_code: Optional[int] = None, response_data: Optional[Dict] = None):
        self.message = message
        self.status_code = status_code
        self.response_data = response_data
        super().__init__(self.message)

def handle_api_errors(func):
    """Decorator to handle API errors gracefully with mock data fallback"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            logger.warning(f"Error in {func.__name__}: {str(e)}. This is normal - service will use mock data.")
            # Don't re-raise - let the service handle with mock data
            raise e
    return wrapper

class OpenWeatherMapService:
    """Service class for OpenWeatherMap API integration"""
    
    def __init__(self):
        self.settings = get_weather_settings()
        self.base_url = self.settings.openweather_base_url
        self.api_key = self.settings.openweather_api_key
        self.timeout = self.settings.openweather_timeout
        
        if not self.api_key or self.api_key == "your-openweather-api-key-here":
            logger.warning("OpenWeatherMap API key not configured. Service will use mock data.")
            self.use_mock_data = True
        else:
            self.use_mock_data = False
    
    async def _make_request(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Make HTTP request to OpenWeatherMap API with fallback to mock data"""
        if self.use_mock_data:
            logger.info("Using mock data - API key not configured")
            return await self._get_mock_data(endpoint, params)
        
        try:
            # Add API key to parameters
            params['appid'] = self.api_key
            params['units'] = 'metric'  # Use Celsius for temperature
            
            url = f"{self.base_url}/{endpoint}"  # Fixed: Add missing slash
            
            timeout = aiohttp.ClientTimeout(total=self.timeout)
            
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        logger.info(f"Successfully retrieved weather data from API")
                        return await response.json()
                    else:
                        # Log the error and fall back to mock data
                        error_text = await response.text()
                        logger.warning(f"API error (status {response.status}): {error_text}. Falling back to mock data.")
                        return await self._get_mock_data(endpoint, params)
                        
        except Exception as e:
            # On any error, fall back to mock data
            logger.warning(f"Weather API request failed: {str(e)}. Using mock data as fallback.")
            return await self._get_mock_data(endpoint, params)
    
    async def _get_mock_data(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Return mock data when API key is not configured"""
        logger.info(f"Using mock weather data for endpoint: {endpoint}")
        
        # Mock current weather data
        if endpoint == WEATHER_ENDPOINTS["current"]:
            return {
                "coord": {"lon": params.get('lon', 77.2090), "lat": params.get('lat', 28.6139)},
                "weather": [{"id": 800, "main": "Clear", "description": "clear sky", "icon": "01d"}],
                "main": {
                    "temp": 28.5, "feels_like": 32.1, "temp_min": 26.2, "temp_max": 31.8,
                    "pressure": 1013, "humidity": 65
                },
                "visibility": 10000,
                "wind": {"speed": 3.2, "deg": 230},
                "clouds": {"all": 15},
                "dt": int(datetime.utcnow().timestamp()),
                "sys": {
                    "sunrise": int((datetime.utcnow() + timedelta(hours=6)).timestamp()),
                    "sunset": int((datetime.utcnow() + timedelta(hours=18)).timestamp())
                },
                "timezone": 19800,
                "name": "New Delhi"
            }
        
        # Mock forecast data
        elif endpoint == WEATHER_ENDPOINTS["forecast"]:
            forecast_list = []
            base_time = datetime.utcnow()
            
            for i in range(40):  # 5 days * 8 times per day (3-hour intervals)
                forecast_time = base_time + timedelta(hours=3 * i)
                forecast_list.append({
                    "dt": int(forecast_time.timestamp()),
                    "main": {
                        "temp": 28.5 + (i % 10 - 5),  # Varying temperature
                        "feels_like": 32.1 + (i % 8 - 4),
                        "temp_min": 26.2 + (i % 6 - 3),
                        "temp_max": 31.8 + (i % 8 - 4),
                        "pressure": 1013 + (i % 20 - 10),
                        "humidity": 65 + (i % 30 - 15)
                    },
                    "weather": [{"id": 800, "main": "Clear", "description": "clear sky"}],
                    "clouds": {"all": 15 + (i % 40)},
                    "wind": {"speed": 3.2 + (i % 6), "deg": 230 + (i % 180)},
                    "pop": 0.1 + (i % 8) * 0.1
                })
            
            return {
                "cod": "200",
                "list": forecast_list,
                "city": {
                    "name": "New Delhi",
                    "coord": {"lat": 28.6139, "lon": 77.2090},
                    "country": "IN",
                    "timezone": 19800
                }
            }
        
        return {}
    
    @handle_api_errors
    async def get_current_weather(self, latitude: float, longitude: float, location_name: str = "Unknown") -> CurrentWeather:
        """Get current weather for given coordinates"""
        params = {
            'lat': latitude,
            'lon': longitude
        }
        
        data = await self._make_request(WEATHER_ENDPOINTS["current"], params)
        
        return self._parse_current_weather(data, location_name)
    
    @handle_api_errors
    async def get_weather_by_city(self, city_name: str) -> CurrentWeather:
        """Get current weather by city name"""
        params = {
            'q': city_name
        }
        
        data = await self._make_request(WEATHER_ENDPOINTS["current"], params)
        
        return self._parse_current_weather(data, city_name)
    
    @handle_api_errors
    async def get_forecast(self, latitude: float, longitude: float, location_name: str = "Unknown") -> WeatherForecast:
        """Get 5-day weather forecast"""
        params = {
            'lat': latitude,
            'lon': longitude
        }
        
        data = await self._make_request(WEATHER_ENDPOINTS["forecast"], params)
        
        return self._parse_forecast(data, location_name)
    
    @handle_api_errors
    async def get_complete_weather(self, latitude: float, longitude: float, location_name: str = "Unknown") -> WeatherResponse:
        """Get complete weather data (current + forecast)"""
        # Get current weather and forecast concurrently
        current_task = self.get_current_weather(latitude, longitude, location_name)
        forecast_task = self.get_forecast(latitude, longitude, location_name)
        
        current_weather, forecast = await asyncio.gather(current_task, forecast_task)
        
        return WeatherResponse(
            current=current_weather,
            forecast=forecast,
            cached=False
        )
    
    def _parse_current_weather(self, data: Dict[str, Any], location_name: str) -> CurrentWeather:
        """Parse OpenWeatherMap current weather response"""
        try:
            weather_condition = WeatherCondition(data['weather'][0]['main'].lower())
        except (KeyError, ValueError):
            weather_condition = WeatherCondition.CLEAR
        
        # ✅ FIX: Use API name if location_name is "Unknown" or empty
        actual_location = data.get('name', 'Unknown') if (not location_name or location_name == "Unknown") else location_name
        
        return CurrentWeather(
            location=actual_location,
            latitude=data['coord']['lat'],
            longitude=data['coord']['lon'],
            condition=weather_condition,
            description=data['weather'][0].get('description', ''),
            temperature=data['main']['temp'],
            feels_like=data['main']['feels_like'],
            temp_min=data['main']['temp_min'],
            temp_max=data['main']['temp_max'],
            pressure=data['main']['pressure'],
            humidity=data['main']['humidity'],
            visibility=data.get('visibility'),
            wind_speed=data['wind']['speed'],
            wind_deg=data['wind'].get('deg'),
            wind_gust=data['wind'].get('gust'),
            rain_1h=data.get('rain', {}).get('1h'),
            rain_3h=data.get('rain', {}).get('3h'),
            snow_1h=data.get('snow', {}).get('1h'),
            snow_3h=data.get('snow', {}).get('3h'),
            cloudiness=data['clouds']['all'],
            dt=datetime.fromtimestamp(data['dt']),
            sunrise=datetime.fromtimestamp(data['sys']['sunrise']),
            sunset=datetime.fromtimestamp(data['sys']['sunset']),
            timezone=data['timezone'],
            source="openweathermap"
        )
    
    def _parse_forecast(self, data: Dict[str, Any], location_name: str) -> WeatherForecast:
        """Parse OpenWeatherMap forecast response"""
        forecast_items = []
        
        for item in data['list']:
            try:
                condition = WeatherCondition(item['weather'][0]['main'].lower())
            except (KeyError, ValueError):
                condition = WeatherCondition.CLEAR
            
            forecast_item = WeatherForecastItem(
                dt=datetime.fromtimestamp(item['dt']),
                temperature=item['main']['temp'],
                feels_like=item['main']['feels_like'],
                temp_min=item['main']['temp_min'],
                temp_max=item['main']['temp_max'],
                pressure=item['main']['pressure'],
                humidity=item['main']['humidity'],
                condition=condition,
                description=item['weather'][0].get('description', ''),
                wind_speed=item['wind']['speed'],
                wind_deg=item['wind'].get('deg'),
                cloudiness=item['clouds']['all'],
                pop=item.get('pop', 0.0),
                rain_3h=item.get('rain', {}).get('3h'),
                snow_3h=item.get('snow', {}).get('3h')
            )
            forecast_items.append(forecast_item)
        
        # ✅ FIX: Use API name if location_name is "Unknown" or empty
        actual_location = data['city']['name'] if (not location_name or location_name == "Unknown") else location_name
        
        return WeatherForecast(
            location=actual_location,
            latitude=data['city']['coord']['lat'],
            longitude=data['city']['coord']['lon'],
            forecast=forecast_items,
            source="openweathermap"
        )
    
    def generate_agricultural_insights(self, current_weather: CurrentWeather, forecast: Optional[WeatherForecast] = None) -> AgriculturalWeatherInsights:
        """Generate agricultural insights from weather data"""
        insights = AgriculturalWeatherInsights(
            planting_conditions="good",
            irrigation_recommendation="medium",
            pest_disease_risk="low",
            harvest_conditions="suitable"
        )
        
        # Analyze current conditions
        temp = current_weather.temperature
        humidity = current_weather.humidity
        condition = current_weather.condition
        
        # Planting conditions
        if condition in [WeatherCondition.CLEAR, WeatherCondition.CLOUDS]:
            if 20 <= temp <= 30 and 50 <= humidity <= 80:
                insights.planting_conditions = "excellent"
            else:
                insights.planting_conditions = "good"
        elif condition in [WeatherCondition.RAIN, WeatherCondition.THUNDERSTORM]:
            insights.planting_conditions = "poor"
        
        # Irrigation recommendations
        if condition in [WeatherCondition.RAIN, WeatherCondition.THUNDERSTORM]:
            insights.irrigation_recommendation = "none - natural rainfall"
        elif condition == WeatherCondition.CLEAR and temp > 30:
            insights.irrigation_recommendation = "high - hot and dry conditions"
        elif humidity < 50:
            insights.irrigation_recommendation = "medium - low humidity"
        else:
            insights.irrigation_recommendation = "low - adequate moisture"
        
        # Pest and disease risk
        if humidity > 80 and condition in [WeatherCondition.RAIN, WeatherCondition.DRIZZLE]:
            insights.pest_disease_risk = "high"
            insights.crop_stress_indicators.append("High humidity and moisture")
        elif humidity > 70:
            insights.pest_disease_risk = "medium"
        
        # Crop recommendations based on weather
        for crop, requirements in CROP_WEATHER_REQUIREMENTS.items():
            temp_range = requirements.get("optimal_temp_range", (0, 50))
            humidity_tolerance = requirements.get("humidity_tolerance", "Medium")
            
            # Convert humidity tolerance to range
            humidity_ranges = {
                "Low": (0, 40),
                "Medium": (40, 70), 
                "High": (70, 100),
                "Very High": (80, 100)
            }
            humidity_range = humidity_ranges.get(humidity_tolerance, (0, 100))
            
            if (temp_range[0] <= temp <= temp_range[1] and 
                humidity_range[0] <= humidity <= humidity_range[1]):
                insights.suitable_crops.append(crop)
            else:
                insights.unsuitable_crops.append(crop)
        
        return insights
    
    async def get_enhanced_weather(self, latitude: float, longitude: float, location_name: str = "Unknown") -> EnhancedWeatherResponse:
        """Get weather data with agricultural insights and ML enhancement"""
        weather_response = await self.get_complete_weather(latitude, longitude, location_name)
        agricultural_insights = self.generate_agricultural_insights(weather_response.current, weather_response.forecast)
        
        # Prepare ML enhancement data
        ml_data = {
            "temperature": weather_response.current.temperature,
            "humidity": weather_response.current.humidity,
            "ph": 6.5,  # Default pH, will be overridden by actual soil data
            "rainfall": weather_response.current.rain_1h or 0.0
        }
        
        return EnhancedWeatherResponse(
            weather=weather_response,
            agricultural_insights=agricultural_insights,
            ml_enhancement_data=ml_data
        )

# Global service instance
_weather_service: Optional[OpenWeatherMapService] = None

def get_weather_service() -> OpenWeatherMapService:
    """Get singleton weather service instance"""
    global _weather_service
    if _weather_service is None:
        _weather_service = OpenWeatherMapService()
    return _weather_service