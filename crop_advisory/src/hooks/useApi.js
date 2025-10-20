/**
 * Custom React Hooks for API Integration
 * Provides easy-to-use hooks for backend API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { cropService } from '../services/cropService';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import eventBus, { EVENTS } from '../utils/eventBus';

/**
 * Hook for making crop predictions
 */
export const useCropPrediction = () => {
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const predictCrop = useCallback(async (soilData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await cropService.predictCrop(soilData);
      // Backend returns prediction data directly, not wrapped in success object
      if (result && result.prediction) {
        setPrediction(result);
        
        // Emit event to trigger dashboard refresh
        if (import.meta.env.DEV) {
          console.log('✅ Prediction successful:', result);
          console.log('📡 Emitting PREDICTION_CREATED event...');
        }
        eventBus.emit(EVENTS.PREDICTION_CREATED, result);
        
        // Also emit a window event as backup
        window.dispatchEvent(new CustomEvent('predictionCreated', { 
          detail: result 
        }));
        
        // Set localStorage trigger for dashboard refresh
        localStorage.setItem('dashboardRefreshTrigger', Date.now().toString());
        
        return result;
      } else {
        if (import.meta.env.DEV) {
          console.error('❌ Invalid prediction response:', result);
        }
        throw new Error('Invalid prediction response');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to get crop prediction';
      setError(errorMessage);
      if (import.meta.env.DEV) {
        console.error('Crop prediction error:', err);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPrediction = useCallback(() => {
    setPrediction(null);
    setError(null);
  }, []);

  return {
    prediction,
    isLoading,
    error,
    predictCrop,
    clearPrediction
  };
};

/**
 * Hook for fetching prediction history
 */
export const usePredictionHistory = (limit = 10) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await cropService.getPredictionHistory(limit);
      if (result.success) {
        setHistory(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch history');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load prediction history';
      setError(errorMessage);
      if (import.meta.env.DEV) {
        console.error('History fetch error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Listen for prediction events to refresh history
  useEffect(() => {
    const unsubscribe = eventBus.on(EVENTS.PREDICTION_CREATED, () => {
      if (import.meta.env.DEV) {
        console.log('🔄 Prediction history refreshing after new prediction');
      }
      fetchHistory();
    });

    return unsubscribe;
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory
  };
};

/**
 * Hook for user profile management
 */
export const useUserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await userService.getProfile();
      if (result.success) {
        setProfile(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch profile');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load profile';
      setError(errorMessage);
      console.error('Profile fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const updateProfile = useCallback(async (profileData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await userService.updateProfile(profileData);
      setProfile(result);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      console.error('Profile update error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refetch: fetchProfile
  };
};

/**
 * Hook for dashboard statistics
 */
export const useDashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    
    console.log('🔄 [useDashboardStats] Fetching dashboard stats...');
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await userService.getDashboardStats();
      console.log('📊 [useDashboardStats] Received stats:', result);
      setStats(result);
    } catch (err) {
      const errorMessage = err.message || 'Failed to load dashboard stats';
      setError(errorMessage);
      console.error('❌ [useDashboardStats] Dashboard stats error:', err);
      // Set default stats on error
      setStats({
        totalPredictions: 0,
        successfulPredictions: 0,
        topCrops: [],
        lastActivity: null
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // NOTE: Window focus auto-refresh DISABLED to prevent annoying reloads
  // User can manually refresh using the refresh button if needed
  
  // Listen for window custom events as backup refresh trigger
  useEffect(() => {
    const handlePredictionCreated = (event) => {
      console.log('🎯 [useDashboardStats] Window predictionCreated event received:', event.detail);
      console.log('🔄 [useDashboardStats] Refreshing stats via window event...');
      
      // Add delay for backend processing
      setTimeout(() => {
        console.log('🔄 [useDashboardStats] Executing delayed window event refresh...');
        fetchStats();
      }, 1500); // Slightly longer delay for window events
    };

    window.addEventListener('predictionCreated', handlePredictionCreated);
    return () => window.removeEventListener('predictionCreated', handlePredictionCreated);
  }, [fetchStats]);

  // Listen for prediction events to refresh stats
  useEffect(() => {
    const unsubscribe = eventBus.on(EVENTS.PREDICTION_CREATED, (data) => {
      console.log('🎯 [useDashboardStats] PREDICTION_CREATED event received:', data);
      console.log('🔄 [useDashboardStats] Refreshing dashboard stats after new prediction...');
      
      // Add small delay to allow backend to process the prediction
      setTimeout(() => {
        console.log('🔄 [useDashboardStats] Executing delayed refresh...');
        fetchStats();
      }, 1000); // 1 second delay
    });

    return unsubscribe;
  }, [fetchStats]);

  // Listen for localStorage changes (cross-tab communication)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'dashboardRefreshTrigger' && event.newValue) {
        console.log('🎯 [useDashboardStats] LocalStorage refresh trigger detected');
        console.log('🔄 [useDashboardStats] Refreshing stats via storage event...');
        setTimeout(() => {
          fetchStats();
        }, 2000); // 2 second delay for localStorage triggers
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchStats]);

  // Periodic refresh every 5 minutes when document is visible
  // This prevents excessive API calls while keeping data reasonably fresh
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 [useDashboardStats] Periodic refresh (5 min interval)');
        fetchStats();
      }
    }, 300000); // Refresh every 5 minutes (300,000 ms)

    return () => clearInterval(interval);
  }, [fetchStats, isAuthenticated]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats
  };
};

/**
 * Hook for API health check
 */
export const useApiHealth = () => {
  const [isHealthy, setIsHealthy] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    
    try {
      // Simple health check - try to call a basic endpoint
      const response = await fetch('http://localhost:8000/api/health');
      setIsHealthy(response.ok);
    } catch (error) {
      console.error('API health check failed:', error);
      setIsHealthy(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    isHealthy,
    isChecking,
    checkHealth
  };
};