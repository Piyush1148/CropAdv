/**
 * Weather API Hooks
 * Custom React hooks for weather data fetching and state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { weatherService } from '../services/weatherService';

/**
 * Hook for weather service health monitoring
 */
export const useWeatherHealth = () => {
  const [health, setHealth] = useState({
    status: 'checking',
    isHealthy: false,
    apiConfigured: false,
    cacheEnabled: false,
    endpoints: [],
    lastChecked: null,
    error: null
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await weatherService.checkHealth();
      setHealth({
        status: data.status,
        isHealthy: data.status === 'healthy',
        apiConfigured: data.api_configured,
        cacheEnabled: data.cache_enabled,
        endpoints: data.endpoints || [],
        lastChecked: new Date(),
        error: null
      });
    } catch (error) {
      setHealth(prev => ({
        ...prev,
        status: 'error',
        isHealthy: false,
        error: error.message || 'Health check failed',
        lastChecked: new Date()
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return { health, isLoading, checkHealth };
};

/**
 * Hook for current weather data
 */
export const useCurrentWeather = (latitude, longitude, location = null) => {
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchWeather = useCallback(async () => {
    if (latitude == null || longitude == null) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await weatherService.getCurrentWeather(latitude, longitude, location);
      setWeather(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Failed to fetch weather data');
      setWeather(null);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, location]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return { 
    weather, 
    isLoading, 
    error, 
    lastUpdated, 
    refetch: fetchWeather 
  };
};

/**
 * Hook for weather forecast data
 */
export const useWeatherForecast = (latitude, longitude, location = null) => {
  const [forecast, setForecast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchForecast = useCallback(async () => {
    if (latitude == null || longitude == null) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await weatherService.getWeatherForecast(latitude, longitude, location);
      setForecast(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch forecast data');
      setForecast(null);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, location]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  return { 
    forecast, 
    isLoading, 
    error, 
    refetch: fetchForecast 
  };
};

/**
 * Hook for agricultural weather insights
 */
export const useAgriculturalInsights = (latitude, longitude, location = null) => {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async () => {
    if (latitude == null || longitude == null) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await weatherService.getAgriculturalInsights(latitude, longitude, location);
      setInsights(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch agricultural insights');
      setInsights(null);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, location]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return { 
    insights, 
    isLoading, 
    error, 
    refetch: fetchInsights 
  };
};

/**
 * Hook for crop suitability analysis
 */
export const useCropSuitability = (latitude, longitude, crop, location = null) => {
  const [suitability, setSuitability] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSuitability = useCallback(async () => {
    if (latitude == null || longitude == null || !crop) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await weatherService.getCropSuitability(latitude, longitude, crop, location);
      if (response.success) {
        setSuitability(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch crop suitability');
      }
    } catch (err) {
      setError(err.message);
      setSuitability(null);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, crop, location]);

  useEffect(() => {
    fetchSuitability();
  }, [fetchSuitability]);

  return { 
    suitability, 
    isLoading, 
    error, 
    refetch: fetchSuitability 
  };
};

/**
 * Hook for user geolocation
 */
export const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('prompt');

  const getLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const coords = await weatherService.getCurrentLocation();
      setLocation(coords);
      setPermission('granted');
    } catch (err) {
      setError(err.message);
      setLocation(null);
      if (err.message.includes('denied')) {
        setPermission('denied');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (options.immediate) {
      getLocation();
    }
  }, [getLocation, options.immediate]);

  return { 
    location, 
    isLoading, 
    error, 
    permission,
    getLocation 
  };
};

/**
 * Hook for complete weather data (current + forecast)
 */
export const useCompleteWeather = (latitude, longitude, location = null) => {
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCompleteWeather = useCallback(async () => {
    if (latitude == null || longitude == null) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await weatherService.getCompleteWeather(latitude, longitude, location);
      if (response.success) {
        setWeatherData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch complete weather data');
      }
    } catch (err) {
      setError(err.message);
      setWeatherData(null);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, location]);

  useEffect(() => {
    fetchCompleteWeather();
  }, [fetchCompleteWeather]);

  return { 
    weatherData, 
    isLoading, 
    error, 
    refetch: fetchCompleteWeather 
  };
};

/**
 * Hook for weather-enhanced ML predictions
 */
export const useWeatherEnhancedPrediction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getEnhancedPrediction = useCallback(async (basicData, latitude, longitude) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await weatherService.getWeatherEnhancedPrediction(basicData, latitude, longitude);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to enhance prediction with weather data');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { 
    getEnhancedPrediction, 
    isLoading, 
    error 
  };
};

/**
 * Hook for periodic weather updates
 */
export const useWeatherUpdates = (latitude, longitude, location = null, intervalMs = 300000) => { // 5 minutes default
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchWeather = useCallback(async () => {
    if (latitude == null || longitude == null) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await weatherService.getCurrentWeather(latitude, longitude, location);
      if (response.success) {
        setWeather(response.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(response.error || 'Failed to fetch weather data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, location]);

  const startUpdates = useCallback(() => {
    fetchWeather(); // Initial fetch
    intervalRef.current = setInterval(fetchWeather, intervalMs);
  }, [fetchWeather, intervalMs]);

  const stopUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    startUpdates();
    return stopUpdates;
  }, [startUpdates, stopUpdates]);

  return { 
    weather, 
    isLoading, 
    error, 
    lastUpdated,
    startUpdates,
    stopUpdates,
    refetch: fetchWeather 
  };
};