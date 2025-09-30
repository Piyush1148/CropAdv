/**
 * Chat API Service - Handles AI Assistant API calls
 * Manages chat sessions, messages, and AI interactions
 */

import apiClient, { handleApiResponse, handleApiError } from './apiService';

export const chatService = {
  /**
   * Send a message to the AI assistant
   * @param {string} message - User message content
   * @param {string} sessionId - Optional existing session ID
   * @returns {Promise<Object>} Chat response with AI message
   */
  sendMessage: async (message, sessionId = null) => {
    try {
      const requestData = {
        message: message.trim(),
        ...(sessionId && { session_id: sessionId })
      };

      console.log('🤖 Sending chat message:', requestData);

      const response = await apiClient.post('/chat/message', requestData);
      const result = handleApiResponse(response);

      console.log('✅ Chat response received:', result);

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Chat message failed:', error);
      return handleApiError(error);
    }
  },

  /**
   * Get all chat sessions for the current user
   * @param {number} limit - Maximum number of sessions
   * @returns {Promise<Object>} List of chat sessions
   */
  getChatSessions: async (limit = 20) => {
    try {
      const response = await apiClient.get('/chat/sessions', {
        params: { limit }
      });

      const sessions = handleApiResponse(response);
      
      return {
        success: true,
        data: sessions,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Failed to get chat sessions:', error);
      return handleApiError(error);
    }
  },

  /**
   * Get a specific chat session with all messages
   * @param {string} sessionId - Chat session ID
   * @returns {Promise<Object>} Chat session with messages
   */
  getChatSession: async (sessionId) => {
    try {
      const response = await apiClient.get(`/chat/sessions/${sessionId}`);
      const session = handleApiResponse(response);

      return {
        success: true,
        data: session,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Failed to get chat session ${sessionId}:`, error);
      return handleApiError(error);
    }
  },

  /**
   * Delete a chat session
   * @param {string} sessionId - Chat session ID to delete
   * @returns {Promise<Object>} Deletion result
   */
  deleteChatSession: async (sessionId) => {
    try {
      const response = await apiClient.delete(`/chat/sessions/${sessionId}`);
      const result = handleApiResponse(response);

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Failed to delete chat session ${sessionId}:`, error);
      return handleApiError(error);
    }
  },

  /**
   * Get available quick action buttons
   * @returns {Promise<Object>} List of quick actions
   */
  getQuickActions: async () => {
    try {
      const response = await apiClient.get('/chat/quick-actions');
      const actions = handleApiResponse(response);

      return {
        success: true,
        data: actions,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Failed to get quick actions:', error);
      return handleApiError(error);
    }
  },

  /**
   * Execute a quick action
   * @param {string} actionId - Quick action ID
   * @returns {Promise<Object>} AI response for the action
   */
  executeQuickAction: async (actionId) => {
    try {
      const response = await apiClient.post(`/chat/quick-action/${actionId}`);
      const result = handleApiResponse(response);

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Failed to execute quick action ${actionId}:`, error);
      return handleApiError(error);
    }
  },

  /**
   * Get chat statistics for the current user
   * @returns {Promise<Object>} Chat usage statistics
   */
  getChatStats: async () => {
    try {
      const response = await apiClient.get('/chat/stats');
      const stats = handleApiResponse(response);

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Failed to get chat stats:', error);
      return handleApiError(error);
    }
  },

  /**
   * Check chat service health
   * @returns {Promise<Object>} Service health status
   */
  checkHealth: async () => {
    try {
      const response = await apiClient.get('/chat/health');
      const health = handleApiResponse(response);

      return {
        success: true,
        data: health,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Chat health check failed:', error);
      return handleApiError(error);
    }
  }
};

export default chatService;