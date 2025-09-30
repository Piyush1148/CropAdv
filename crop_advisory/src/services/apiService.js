/**
 * API Configuration and Base Service
 * Central configuration for all backend API calls
 */

import axios from 'axios';
import { auth } from './authService';

// API Configuration
const API_CONFIG = {
  BASE_URL: 'http://localhost:8000/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get current user and token
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Get fresh Firebase ID token
        const token = await currentUser.getIdToken(false);
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    // Log errors
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - token might be expired
      console.warn('Authentication token expired or invalid');
      // Could trigger logout or token refresh here
    }

    if (error.response?.status >= 500) {
      // Server error - could implement retry logic here
      console.error('Server error detected');
    }

    // Return a consistent error format
    const apiError = {
      status: error.response?.status || 0,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      details: error.response?.data?.details || null,
      originalError: error
    };

    return Promise.reject(apiError);
  }
);

// Utility function to handle API responses
export const handleApiResponse = (response) => {
  return response.data;
};

// Utility function to handle API errors
export const handleApiError = (error) => {
  throw error;
};

export { apiClient, API_CONFIG };
export default apiClient;