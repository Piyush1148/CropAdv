"""
Weather Service Configuration
Configuration settings for weather API integrations
"""

from typing import Optional, Dict, List
import os
from functools import lru_cache


class WeatherSettings:
    """Weather service configuration settings"""
    
    def __init__(self):
        # OpenWeatherMap API Configuration
        self.openweather_api_key = os.getenv("OPENWEATHER_API_KEY", "your-openweather-api-key-here")
        self.openweather_base_url = "https://api.openweathermap.org/data/2.5"
        self.openweather_timeout = 10
        
        # IMD API Configuration (India Meteorological Department)
        self.imd_base_url = "https://mausam.imd.gov.in/"
        
        # Cache Configuration
        self.weather_cache_ttl = 300  # 5 minutes
        self.enable_weather_cache = True
        
        # Default Location (Delhi, India)
        self.default_latitude = 28.6139
        self.default_longitude = 77.2090
        
        # Weather Update Settings
        self.weather_update_interval = 600  # 10 minutes
        
        # Location precision for caching
        self.location_precision = 2
        
        # Rate limiting
        self.max_requests_per_minute = 60
        
        # Agricultural Weather Settings
        self.enable_agricultural_insights = True
        self.crop_season_awareness = True


# Weather API endpoints configuration
WEATHER_ENDPOINTS = {
    "current": "weather",
    "forecast": "forecast", 
    "onecall": "onecall"
}

# Weather condition mappings for agriculture
WEATHER_CONDITION_MAPPINGS = {
    "clear": {
        "farming_impact": "Ideal conditions for most farming activities",
        "irrigation_needed": "Low",
        "pest_risk": "Medium"
    },
    "clouds": {
        "farming_impact": "Good conditions with reduced heat stress", 
        "irrigation_needed": "Low to Medium",
        "pest_risk": "Medium"
    },
    "rain": {
        "farming_impact": "Natural irrigation, avoid field work",
        "irrigation_needed": "None",
        "pest_risk": "High (fungal diseases)"
    },
    "drizzle": {
        "farming_impact": "Light irrigation, good for germination",
        "irrigation_needed": "None", 
        "pest_risk": "Medium to High"
    },
    "thunderstorm": {
        "farming_impact": "Avoid all outdoor farming activities",
        "irrigation_needed": "None",
        "pest_risk": "Low during storm, High after"
    },
    "snow": {
        "farming_impact": "Protect crops, avoid field operations", 
        "irrigation_needed": "None",
        "pest_risk": "Low"
    },
    "mist": {
        "farming_impact": "High humidity, monitor for diseases",
        "irrigation_needed": "Low",
        "pest_risk": "High (fungal diseases)"
    },
    "fog": {
        "farming_impact": "Reduced visibility, high disease risk",
        "irrigation_needed": "Low", 
        "pest_risk": "Very High (fungal diseases)"
    }
}

# Crop-specific weather requirements
CROP_WEATHER_REQUIREMENTS = {
    "rice": {
        "optimal_temp_range": (20, 35),
        "water_requirement": "High",
        "humidity_tolerance": "High",
        "rainfall_requirement": (1000, 2000)
    },
    "wheat": {
        "optimal_temp_range": (10, 25),
        "water_requirement": "Medium", 
        "humidity_tolerance": "Medium",
        "rainfall_requirement": (400, 800)
    },
    "maize": {
        "optimal_temp_range": (18, 30),
        "water_requirement": "Medium",
        "humidity_tolerance": "Medium", 
        "rainfall_requirement": (600, 1000)
    },
    "cotton": {
        "optimal_temp_range": (20, 35),
        "water_requirement": "High",
        "humidity_tolerance": "Medium",
        "rainfall_requirement": (500, 1000)
    },
    "sugarcane": {
        "optimal_temp_range": (20, 30),
        "water_requirement": "Very High",
        "humidity_tolerance": "High",
        "rainfall_requirement": (1200, 2000)
    },
    "tomato": {
        "optimal_temp_range": (15, 25),
        "water_requirement": "Medium",
        "humidity_tolerance": "Low to Medium",
        "rainfall_requirement": (400, 800)
    },
    "potato": {
        "optimal_temp_range": (10, 20),
        "water_requirement": "Medium",
        "humidity_tolerance": "Medium",
        "rainfall_requirement": (400, 600)
    },
    "onion": {
        "optimal_temp_range": (15, 25), 
        "water_requirement": "Low to Medium",
        "humidity_tolerance": "Low",
        "rainfall_requirement": (300, 600)
    },
    "soybean": {
        "optimal_temp_range": (20, 30),
        "water_requirement": "Medium",
        "humidity_tolerance": "Medium",
        "rainfall_requirement": (600, 1000)
    },
    "groundnut": {
        "optimal_temp_range": (20, 30),
        "water_requirement": "Medium",
        "humidity_tolerance": "Medium to High", 
        "rainfall_requirement": (400, 800)
    }
}

# Seasonal farming calendar
SEASONAL_CALENDAR = {
    "kharif": {
        "months": [6, 7, 8, 9, 10],  # June to October
        "crops": ["rice", "cotton", "sugarcane", "maize", "soybean"],
        "weather_focus": "monsoon_dependent"
    },
    "rabi": {
        "months": [11, 12, 1, 2, 3, 4],  # November to April
        "crops": ["wheat", "barley", "mustard", "gram", "pea"],
        "weather_focus": "winter_irrigation"
    },
    "zaid": {
        "months": [4, 5, 6],  # April to June
        "crops": ["fodder", "watermelon", "cucumber", "sunflower"],
        "weather_focus": "summer_irrigation"
    }
}


@lru_cache()
def get_weather_settings() -> WeatherSettings:
    """Get cached weather settings instance"""
    return WeatherSettings()


def get_crop_weather_requirements(crop_name: str) -> Optional[Dict]:
    """Get weather requirements for a specific crop"""
    return CROP_WEATHER_REQUIREMENTS.get(crop_name.lower())


def get_weather_condition_advice(condition: str) -> Dict[str, str]:
    """Get farming advice based on weather condition"""
    return WEATHER_CONDITION_MAPPINGS.get(condition.lower(), {
        "farming_impact": "Monitor weather conditions closely",
        "irrigation_needed": "Assess based on soil moisture",
        "pest_risk": "Regular monitoring recommended"
    })


def get_seasonal_crops(month: int) -> List[str]:
    """Get recommended crops for a given month"""
    seasonal_crops = []
    for season, info in SEASONAL_CALENDAR.items():
        if month in info["months"]:
            seasonal_crops.extend(info["crops"])
    return seasonal_crops


def is_weather_suitable_for_crop(crop: str, temperature: float, 
                                humidity: float, rainfall: float) -> Dict[str, bool]:
    """Check if current weather is suitable for a crop"""
    requirements = get_crop_weather_requirements(crop)
    if not requirements:
        return {"suitable": False, "reason": "Crop not in database"}
    
    temp_min, temp_max = requirements["optimal_temp_range"]
    temp_suitable = temp_min <= temperature <= temp_max
    
    # Simple heuristics for humidity and rainfall suitability
    humidity_suitable = True  # Can be enhanced with crop-specific logic
    rainfall_suitable = True   # Can be enhanced with seasonal requirements
    
    overall_suitable = temp_suitable and humidity_suitable and rainfall_suitable
    
    return {
        "suitable": overall_suitable,
        "temperature_suitable": temp_suitable,
        "humidity_suitable": humidity_suitable,  
        "rainfall_suitable": rainfall_suitable,
        "recommendations": get_weather_condition_advice("clear")  # Default advice
    }