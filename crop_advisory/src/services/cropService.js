/**
 * Crop Prediction API Service
 * Handles all ML model and crop-related API calls
 */

import apiClient, { handleApiResponse, handleApiError } from './apiService';

// Crop prediction input validation
const validatePredictionInput = (data) => {
  const required = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'location'];
  const missing = required.filter(field => !(field in data) || data[field] == null);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  // Validate ranges (basic validation)
  const ranges = {
    N: [0, 300],
    P: [0, 300], 
    K: [0, 300],
    temperature: [-10, 60],
    humidity: [0, 100],
    ph: [0, 14],
    rainfall: [0, 3000]
  };

  for (const [field, [min, max]] of Object.entries(ranges)) {
    const value = parseFloat(data[field]);
    if (isNaN(value) || value < min || value > max) {
      throw new Error(`${field} must be between ${min} and ${max}`);
    }
  }

  return true;
};

export const cropService = {
  /**
   * Get crop recommendation using ML model
   * @param {Object} soilData - Soil and environmental parameters
   * @returns {Promise<Object>} Prediction result with crop recommendation
   */
  predictCrop: async (soilData) => {
    try {
      // Validate input data
      validatePredictionInput(soilData);

      // Format data for API
      const formattedData = {
        N: parseFloat(soilData.N),
        P: parseFloat(soilData.P),
        K: parseFloat(soilData.K),
        temperature: parseFloat(soilData.temperature),
        humidity: parseFloat(soilData.humidity),
        ph: parseFloat(soilData.ph),
        rainfall: parseFloat(soilData.rainfall),
        location: soilData.location.trim()
      };

      console.log('🌱 Sending prediction request:', formattedData);
      console.log('🔑 API Client base URL:', apiClient.defaults.baseURL);

      // Make API call to backend
      const response = await apiClient.post('/crops/predict', formattedData);
      console.log('✅ Prediction response received:', response.data);

      return handleApiResponse(response);

    } catch (error) {
      console.error('❌ Crop prediction failed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
      return handleApiError(error);
    }
  },

  /**
   * Get user's prediction history
   * @param {number} limit - Maximum number of predictions to fetch
   * @returns {Promise<Array>} List of previous predictions
   */
  getPredictionHistory: async (limit = 10) => {
    try {
      const response = await apiClient.get('/crops/predictions', {
        params: { limit }
      });
      
      const history = handleApiResponse(response);
      
      return {
        success: true,
        data: history,
        count: history.length
      };

    } catch (error) {
      console.error('Failed to fetch prediction history:', error);
      return handleApiError(error);
    }
  },

  /**
   * Get crop information and growing guidelines
   * @param {string} cropName - Name of the crop
   * @returns {Promise<Object>} Crop information and guidelines
   */
  getCropInfo: async (cropName) => {
    try {
      const response = await apiClient.get(`/crops/info/${cropName}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Failed to get info for crop ${cropName}:`, error);
      return handleApiError(error);
    }
  },

  /**
   * Get list of supported crops
   * @returns {Promise<Array>} List of supported crop names
   */
  getSupportedCrops: async () => {
    try {
      const response = await apiClient.get('/crops/supported');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to get supported crops:', error);
      return handleApiError(error);
    }
  },

  /**
   * Get crop statistics for dashboard
   * @returns {Promise<Object>} Crop prediction statistics
   */
  getCropStats: async () => {
    try {
      const response = await apiClient.get('/crops/stats');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to get crop stats:', error);
      return handleApiError(error);
    }
  }
};

export default cropService;