/**
 * User API Service
 * Handles user profile and account management
 */

import apiClient, { handleApiResponse, handleApiError } from './apiService';

export const userService = {
  /**
   * Get current user profile from backend
   * @returns {Promise<Object>} User profile data
   */
  getProfile: async () => {
    try {
      const response = await apiClient.get('/auth/profile');
      const profile = handleApiResponse(response);
      
      return {
        success: true,
        data: profile
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return handleApiError(error);
    }
  },

  /**
   * Update user profile
   * @param {Object} profileData - Updated profile information
   * @returns {Promise<Object>} Updated profile
   */
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/auth/profile', profileData);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to update profile:', error);
      return handleApiError(error);
    }
  },

  /**
   * Register user in backend (create user document in Firestore)
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  registerUser: async (userData) => {
    try {
      const response = await apiClient.post('/api/auth/register', {
        email: userData.email,
        password: userData.password,
        full_name: userData.displayName || userData.fullName
      });
      
      const result = handleApiResponse(response);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Backend user registration failed:', error);
      return handleApiError(error);
    }
  },

  /**
   * Setup enhanced user profile from signup data (PUBLIC - no auth required)
   * @param {Object} requestData - Contains user_id and signup_data
   * @returns {Promise<Object>} Profile setup result
   */
  setupProfileFromSignupDataPublic: async (requestData) => {
    try {
      console.log('🔍 Setting up enhanced profile with public endpoint:', requestData);
      
      const response = await apiClient.post('/api/auth/profile/setup-from-signup-public', requestData);
      const result = handleApiResponse(response);
      
      console.log('✅ Enhanced profile setup successful (public):', result);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Enhanced profile setup failed (public):', error);
      return handleApiError(error);
    }
  },

  /**
   * Setup enhanced user profile from signup data (AUTH REQUIRED)
   * @param {Object} signupData - Complete signup form data
   * @returns {Promise<Object>} Profile setup result
   */
  setupProfileFromSignupData: async (signupData) => {
    try {
      console.log('🔍 Setting up enhanced profile with data:', signupData);
      
      const response = await apiClient.post('/api/auth/profile/setup-from-signup', signupData);
      const result = handleApiResponse(response);
      
      console.log('✅ Enhanced profile setup successful:', result);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Enhanced profile setup failed:', error);
      return handleApiError(error);
    }
  },

  /**
   * Get user dashboard statistics
   * @returns {Promise<Object>} Dashboard stats
   */
  getDashboardStats: async () => {
    try {
      console.log('📊 Fetching dashboard statistics from backend...');
      const response = await apiClient.get('/auth/dashboard-stats');
      console.log('✅ Dashboard stats response:', response.data);
      
      return handleApiResponse(response);
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      return {
        success: false,
        totalPredictions: 0,
        successfulPredictions: 0,
        error: error.message
      };
    }
  }
};

export default userService;