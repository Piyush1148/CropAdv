/**
 * Centralized API Configuration
 * Single source of truth for all API endpoints and configuration
 */

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // Check if running in development or production
  if (import.meta.env.DEV) {
    // Development: Use localhost
    return import.meta.env.VITE_API_URL || 'http://localhost:8000';
  } else {
    // Production: Use environment variable or default
    return import.meta.env.VITE_API_URL || 'https://your-production-api.com';
  }
};

export const API_CONFIG = {
  // Base URL for all API calls (without /api suffix)
  BASE_URL: getApiBaseUrl(),
  
  // API endpoints with prefixes
  ENDPOINTS: {
    // Regular API endpoints (with /api prefix)
    AUTH: '/api/auth',
    CROPS: '/api/crops',
    CHAT: '/api/chat',
    HEALTH: '/api/health',
    
    // Weather enhanced endpoints (direct, no /api prefix)
    WEATHER_ENHANCED: '/weather-enhanced',
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 30000, // 30 seconds
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // 1 second
  },
  
  // Headers
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

// Helper function to build full endpoint URL
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Export for easy access
export default API_CONFIG;
