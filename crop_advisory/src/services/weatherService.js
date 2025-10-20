/**
 * Weather API Service
 * Handles all weather-related API calls and data management
 */

import axios from 'axios';
import API_CONFIG from '../config/api';

// Create a separate weather client with correct base URL
const weatherApiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,  // Use centralized config (direct to backend, not /api prefix)
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Retry function for better resilience
const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await requestFn();
      if (import.meta.env.DEV) {
        console.log(`✅ Request succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      
      if (import.meta.env.DEV) {
        console.error(`❌ Request attempt ${attempt} failed:`, {
          message: error.message,
          response: error.response,
          status: error.response?.status,
          data: error.response?.data
        });
      }
      
      if (attempt === maxRetries + 1) {
        break; // Exit loop, throw below
      }
      
      // Only retry on timeout or network errors
      if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        if (import.meta.env.DEV) {
          console.warn(`Weather API attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      } else {
        break; // Don't retry on other errors (4xx, etc.)
      }
    }
  }
  
  // If we get here, all attempts failed
  throw lastError || new Error('Request failed with no error details');
};


// Response interceptor for consistent error handling
weatherApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Weather API Error:', error.response?.data || error.message);
    return Promise.reject({
      message: error.response?.data?.detail || error.message || 'Weather service unavailable',
      status: error.response?.status || 500,
      data: error.response?.data,
      code: error.code
    });
  }
);

// Weather API endpoints
const WEATHER_ENDPOINTS = {
  HEALTH: '/weather-enhanced/health',
  CURRENT: '/weather-enhanced/current',
  FORECAST: '/weather-enhanced/forecast', 
  COMPLETE: '/weather-enhanced/complete',
  AGRICULTURAL_INSIGHTS: '/weather-enhanced/agricultural-insights',
  BY_CITY: '/weather-enhanced/by-city',
  ML_ENHANCEMENT: '/weather-enhanced/ml-enhancement-data',
  CROP_SUITABILITY: '/weather-enhanced/crop-suitability',
  TEST_INTEGRATION: '/weather-enhanced/test-integration'
};

// Input validation for coordinates
const validateCoordinates = (latitude, longitude) => {
  if (latitude < -90 || latitude > 90) {
    throw new Error('Latitude must be between -90 and 90 degrees');
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error('Longitude must be between -180 and 180 degrees');
  }
};

// Input validation for city name
const validateCityName = (city) => {
  if (!city || typeof city !== 'string' || city.trim().length === 0) {
    throw new Error('City name is required and must be a non-empty string');
  }
  if (city.trim().length > 100) {
    throw new Error('City name is too long (maximum 100 characters)');
  }
};

export const weatherService = {
  /**
   * Check weather service health status
   * @returns {Promise<Object>} Service health information
   */
  checkHealth: async () => {
    try {
      const response = await weatherApiClient.get(WEATHER_ENDPOINTS.HEALTH);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get location name from coordinates using backend weather API
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<string>} Location name (city, state/country)
   */
  getLocationName: async (latitude, longitude) => {
    try {
      validateCoordinates(latitude, longitude);
      
      // Use our backend weather API to get location info
      const response = await retryRequest(
        () => weatherApiClient.get(WEATHER_ENDPOINTS.CURRENT, { 
          params: { latitude, longitude } 
        })
      );
      
      if (response.data && response.data.location) {
        // If backend provides proper location name, use it
        const location = response.data.location;
        if (location && !location.includes('Location (')) {
          return location;
        }
      }
      
      // Fallback: Try to determine location from coordinates
      // For Delhi area (28.6139, 77.2090), return Delhi
      if (latitude >= 28.4 && latitude <= 28.8 && longitude >= 77.0 && longitude <= 77.4) {
        return 'New Delhi, India';
      }
      
      // For Mumbai area 
      if (latitude >= 19.0 && latitude <= 19.3 && longitude >= 72.7 && longitude <= 73.0) {
        return 'Mumbai, India';
      }
      
      // For Bangalore area
      if (latitude >= 12.8 && latitude <= 13.1 && longitude >= 77.4 && longitude <= 77.8) {
        return 'Bangalore, India';
      }
      
      // Generic fallback
      return `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    } catch (error) {
      console.warn('Location name resolution failed:', error.message);
      return `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    }
  },

  /**
   * Get current weather data by coordinates
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate  
   * @param {string} [location] - Optional location name for reference
   * @returns {Promise<Object>} Current weather data
   */
  getCurrentWeather: async (latitude, longitude, location = null) => {
    try {
      validateCoordinates(latitude, longitude);
      
      const params = { latitude, longitude };
      if (location) {
        params.location = location;
      }

      if (import.meta.env.DEV) {
        console.log('📡 Weather API request:', { endpoint: WEATHER_ENDPOINTS.CURRENT, params });
      }

      const response = await retryRequest(
        () => weatherApiClient.get(WEATHER_ENDPOINTS.CURRENT, { params })
      );
      
      if (import.meta.env.DEV) {
        console.log('📡 Weather API response:', response);
      }
      
      // ✅ FIX: Check if response exists and has data
      if (!response || !response.data) {
        throw new Error('Weather API returned empty response');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Weather API Error:', error);
      // Re-throw with more context
      throw new Error(error.message || 'Failed to fetch weather data');
    }
  },

  /**
   * Get weather forecast by coordinates
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {string} [location] - Optional location name for reference
   * @returns {Promise<Object>} Weather forecast data
   */
  getWeatherForecast: async (latitude, longitude, location = null) => {
    try {
      validateCoordinates(latitude, longitude);
      
      const params = { latitude, longitude };
      if (location) {
        params.location = location;
      }

      const response = await weatherApiClient.get(WEATHER_ENDPOINTS.FORECAST, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get complete weather data (current + forecast + insights)
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {string} [location] - Optional location name for reference
   * @returns {Promise<Object>} Complete weather data
   */
  getCompleteWeather: async (latitude, longitude, location = null) => {
    try {
      validateCoordinates(latitude, longitude);
      
      const params = { latitude, longitude };
      if (location) {
        params.location = location;
      }

      const response = await weatherApiClient.get(WEATHER_ENDPOINTS.COMPLETE, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get agricultural weather insights
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {string} [location] - Optional location name for reference
   * @returns {Promise<Object>} Agricultural insights
   */
  getAgriculturalInsights: async (latitude, longitude, location = null) => {
    try {
      validateCoordinates(latitude, longitude);
      
      const params = { latitude, longitude };
      if (location) {
        params.location = location;
      }

      const response = await retryRequest(
        () => weatherApiClient.get(WEATHER_ENDPOINTS.AGRICULTURAL_INSIGHTS, { params })
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get weather data by city name
   * @param {string} city - City name
   * @returns {Promise<Object>} Weather data for the city
   */
  getWeatherByCity: async (city) => {
    try {
      validateCityName(city);
      
      const params = { city: city.trim() };
      const response = await weatherApiClient.get(WEATHER_ENDPOINTS.BY_CITY, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get ML enhancement data for crop predictions
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {string} [location] - Optional location name for reference
   * @returns {Promise<Object>} ML enhancement data
   */
  getMLEnhancementData: async (latitude, longitude, location = null) => {
    try {
      validateCoordinates(latitude, longitude);
      
      const params = { latitude, longitude };
      if (location) {
        params.location = location;
      }

      const response = await weatherApiClient.get(WEATHER_ENDPOINTS.ML_ENHANCEMENT, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Analyze crop suitability based on weather conditions
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {string} crop - Crop name for suitability analysis
   * @param {string} [location] - Optional location name for reference
   * @returns {Promise<Object>} Crop suitability analysis
   */
  getCropSuitability: async (latitude, longitude, crop, location = null) => {
    try {
      validateCoordinates(latitude, longitude);
      
      if (!crop || typeof crop !== 'string' || crop.trim().length === 0) {
        throw new Error('Crop name is required');
      }
      
      const params = { latitude, longitude, crop: crop.trim() };
      if (location) {
        params.location = location;
      }

      const response = await weatherApiClient.get(WEATHER_ENDPOINTS.CROP_SUITABILITY, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Test weather integration
   * @returns {Promise<Object>} Integration test results
   */
  testIntegration: async () => {
    try {
      const response = await weatherApiClient.get(WEATHER_ENDPOINTS.TEST_INTEGRATION);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user's current location using browser geolocation API with location name
   * @returns {Promise<Object>} Location data {latitude, longitude, accuracy, locationName}
   */
  getCurrentLocation: async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            
            // Get location name using reverse geocoding
            const locationName = await weatherService.getLocationName(latitude, longitude);
            
            resolve({
              latitude,
              longitude,
              accuracy: position.coords.accuracy,
              locationName
            });
          } catch (error) {
            // Even if reverse geocoding fails, return coordinates
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              locationName: `Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`
            });
          }
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        options
      );
    });
  },

  /**
   * Enhanced crop prediction with weather data integration
   * @param {Object} basicPredictionData - Basic soil/crop data
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<Object>} Enhanced prediction with weather data
   */
  getWeatherEnhancedPrediction: async (basicPredictionData, latitude, longitude) => {
    try {
      validateCoordinates(latitude, longitude);
      
      // Get ML enhancement data (weather data formatted for ML model)
      const mlData = await weatherService.getMLEnhancementData(latitude, longitude);
      
      // Fix: mlData is already the response data, so access ml_enhancement_data directly
      if (!mlData.ml_enhancement_data) {
        throw new Error('Failed to get weather enhancement data');
      }

      // Merge basic prediction data with weather data
      const weatherEnhancedData = {
        ...basicPredictionData,
        temperature: mlData.ml_enhancement_data.temperature,
        humidity: mlData.ml_enhancement_data.humidity,
        rainfall: mlData.ml_enhancement_data.rainfall,
        weather_enhanced: true,
        weather_source: 'real_time_api'
      };

      return {
        success: true,
        data: weatherEnhancedData,
        message: 'Weather data successfully integrated with prediction'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to enhance prediction with weather data'
      };
    }
  }
};

export default weatherService;