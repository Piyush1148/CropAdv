/**
 * Growing Guide Service
 * Handles saving and retrieving growing guides from Firebase/Backend
 */

import apiClient from './apiService';

/**
 * Save a growing guide to the backend
 * @param {string} predictionId - ID of the prediction this guide is for
 * @param {Object} guideData - Complete guide data from Groq AI
 * @returns {Promise<Object>} Response with guide_id
 */
export const saveGrowingGuide = async (predictionId, guideData) => {
  try {
    console.log('💾 Saving growing guide to backend...', { predictionId, guideData });
    
    const response = await apiClient.post('/growing-guides', {
      prediction_id: predictionId,
      ...guideData
    });
    
    console.log('✅ Growing guide saved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error saving growing guide:', error);
    throw error;
  }
};

/**
 * Get a specific growing guide by ID
 * @param {string} guideId - Guide ID
 * @returns {Promise<Object>} Guide data
 */
export const getGrowingGuide = async (guideId) => {
  try {
    console.log('📖 Fetching growing guide:', guideId);
    
    const response = await apiClient.get(`/growing-guides/${guideId}`);
    
    console.log('✅ Growing guide retrieved:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching growing guide:', error);
    throw error;
  }
};

/**
 * Get growing guide for a specific prediction
 * @param {string} predictionId - Prediction ID
 * @returns {Promise<Object>} Guide data
 */
export const getGuideByPrediction = async (predictionId) => {
  try {
    console.log('📖 Fetching guide for prediction:', predictionId);
    
    const response = await apiClient.get(`/growing-guides/prediction/${predictionId}`);
    
    console.log('✅ Guide retrieved for prediction:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching guide by prediction:', error);
    // Don't throw - guide might not exist yet
    return null;
  }
};

/**
 * Get user's recent growing guides
 * @param {number} limit - Number of guides to retrieve (default: 5)
 * @returns {Promise<Array>} Array of guide objects
 */
export const getUserGuides = async (limit = 5) => {
  try {
    console.log('📚 Fetching user growing guides, limit:', limit);
    
    const response = await apiClient.get(`/growing-guides?limit=${limit}`);
    
    console.log(`✅ Retrieved ${response.data.length} growing guides`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching user guides:', error);
    // Return empty array instead of throwing
    return [];
  }
};

export default {
  saveGrowingGuide,
  getGrowingGuide,
  getGuideByPrediction,
  getUserGuides
};
