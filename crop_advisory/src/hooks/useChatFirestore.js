/**
 * Authenticated Chat Hook - Firestore Integration
 * Replaces useChatSimplified with proper Firebase auth + Firestore persistence
 */

import { useState, useCallback, useRef, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import AuthContext from '../context/AuthContext';

export const useChatFirestore = (initialSessionId = null) => {
  const { user } = useContext(AuthContext);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [quickActions] = useState([
    { id: 'crop-recommendation', label: 'Crop Recommendation', prompt: 'What crop should I plant in my soil?' },
    { id: 'pest-control', label: 'Pest Control', prompt: 'How can I control pests in my crops naturally?' },
    { id: 'irrigation-tips', label: 'Irrigation Tips', prompt: 'What are the best irrigation practices for my area?' },
    { id: 'soil-health', label: 'Soil Health', prompt: 'How can I improve my soil health?' }
  ]);
  
  // Refs for auto-scroll and input focus
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Debug logging
  const debugLog = (message, data = null) => {
    console.log(`[useChatFirestore] ${message}`, data);
  };

  /**
   * Get Firebase ID Token for authentication
   */
  const getAuthToken = useCallback(async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Import Firebase auth to get current user
      const { auth } = await import('../services/authService');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('Firebase user not available');
      }
      
      // Get fresh ID token
      const token = await currentUser.getIdToken();
      debugLog('Auth token obtained successfully');
      return token;
    } catch (error) {
      debugLog('Auth token error:', error);
      throw new Error('Failed to get authentication token');
    }
  }, [user]);

  /**
   * Make authenticated API request to backend
   */
  const makeAuthenticatedRequest = useCallback(async (endpoint, options = {}) => {
    try {
      const token = await getAuthToken();
      
      const defaultOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      const requestOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers
        }
      };
      
      const url = `http://localhost:8000/api/chat${endpoint}`;
      debugLog('Making authenticated request to:', url);
      
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      debugLog('Authenticated request error:', error);
      throw error;
    }
  }, [getAuthToken]);

  /**
   * Load chat sessions from Firestore
   */
  const loadSessions = useCallback(async () => {
    if (!user) {
      debugLog('No user - skipping session load');
      return;
    }
    
    try {
      debugLog('Loading sessions from Firestore...');
      const response = await makeAuthenticatedRequest('/sessions');
      
      debugLog('Sessions loaded:', response);
      setSessions(response || []);
    } catch (error) {
      debugLog('Load sessions error:', error);
      setError(`Failed to load chat sessions: ${error.message}`);
    }
  }, [user, makeAuthenticatedRequest]);

  /**
   * Load specific session messages from Firestore
   */
  const loadSession = useCallback(async (sessionIdToLoad) => {
    if (!sessionIdToLoad || !user) {
      return;
    }
    
    try {
      setIsLoading(true);
      debugLog('Loading session:', sessionIdToLoad);
      
      const response = await makeAuthenticatedRequest(`/sessions/${sessionIdToLoad}`);
      
      debugLog('Session loaded:', response);
      
      // Convert backend message format to frontend format
      const convertedMessages = response.messages?.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        sessionId: sessionIdToLoad
      })) || [];
      
      setMessages(convertedMessages);
      setSessionId(sessionIdToLoad);
      setError(null);
      
    } catch (error) {
      debugLog('Load session error:', error);
      setError(`Failed to load session: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, makeAuthenticatedRequest]);

  /**
   * Send message using Firestore-backed /message endpoint
   */
  const sendMessage = useCallback(async (content, messageSessionId = null) => {
    debugLog('🚀 sendMessage called with:', { content, messageSessionId, user: !!user });
    
    if (!user) {
      debugLog('❌ No user authenticated');
      setError('Please log in to send messages');
      return null;
    }
    
    const currentSessionId = messageSessionId || sessionId;
    
    try {
      setIsLoading(true);
      setIsTyping(true);
      setError(null);

      // Add user message immediately (optimistic UI)
      const userMessage = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
        sessionId: currentSessionId
      };

      setMessages(prev => [...prev, userMessage]);
      debugLog('User message added (optimistic):', userMessage);

      // Send to Firestore-backed /message endpoint
      const requestBody = {
        message: content,
        session_id: currentSessionId
      };

      debugLog('Sending message to Firestore endpoint:', requestBody);
      
      const response = await makeAuthenticatedRequest('/message', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      debugLog('Message response from Firestore:', response);

      // Update session ID if new session was created
      if (response.session_id && response.session_id !== currentSessionId) {
        setSessionId(response.session_id);
      }

      // Replace optimistic user message with server response
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => msg.id !== userMessage.id);
        return [
          ...filteredMessages,
          {
            id: response.user_message?.message_id || userMessage.id,
            role: 'user',
            content: response.user_message?.content || content,
            timestamp: response.user_message?.timestamp || userMessage.timestamp,
            sessionId: response.session_id
          },
          {
            id: response.ai_response?.message_id || uuidv4(),
            role: 'assistant',
            content: response.ai_response?.content || 'Sorry, I couldn\'t process that request.',
            timestamp: response.ai_response?.timestamp || new Date().toISOString(),
            sessionId: response.session_id,
            confidence: response.ai_response?.confidence || 0.9
          }
        ];
      });

      // Refresh sessions list to include new session
      loadSessions();
      
      // Refresh sessions again after a short delay to catch title updates
      // (since title generation happens asynchronously on the backend)
      setTimeout(() => {
        loadSessions();
      }, 2000);

      return response.ai_response;

    } catch (error) {
      debugLog('Send message error:', error);
      setError(`Failed to send message: ${error.message}`);
      
      // Add error message for user feedback
      const errorMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `⚠️ Error: ${error.message}. Your message was not saved.`,
        timestamp: new Date().toISOString(),
        sessionId: currentSessionId,
        error: true
      };

      setMessages(prev => [...prev, errorMessage]);
      return null;

    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [user, sessionId, makeAuthenticatedRequest, loadSessions]);

  /**
   * Create new session
   */
  const newSession = useCallback(() => {
    setSessionId(null); // Will be assigned by backend
    setMessages([]);
    setError(null);
    debugLog('New session created (will be assigned by backend)');
    return null;
  }, []);

  /**
   * Clear current session messages (but keep session)
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    debugLog('Messages cleared');
  }, []);

  /**
   * Delete a session from Firestore
   */
  const deleteSession = useCallback(async (sessionIdToDelete) => {
    if (!sessionIdToDelete || !user) {
      return false;
    }
    
    try {
      await makeAuthenticatedRequest(`/sessions/${sessionIdToDelete}`, {
        method: 'DELETE'
      });
      
      // Refresh sessions list
      await loadSessions();
      
      // If current session was deleted, start new session
      if (sessionIdToDelete === sessionId) {
        newSession();
      }
      
      debugLog('Session deleted:', sessionIdToDelete);
      return true;
      
    } catch (error) {
      debugLog('Delete session error:', error);
      setError(`Failed to delete session: ${error.message}`);
      return false;
    }
  }, [user, makeAuthenticatedRequest, loadSessions, sessionId, newSession]);

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = useCallback(() => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      debugLog('Scroll error:', error);
    }
  }, []);

  // Load sessions when user changes
  useEffect(() => {
    if (user) {
      debugLog('User authenticated, loading sessions:', user);
      loadSessions();
    } else {
      debugLog('No user authenticated, clearing sessions');
      setSessions([]);
      setMessages([]);
      setSessionId(null);
    }
  }, [user, loadSessions]);

  // Auto-scroll when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load initial session if provided
  useEffect(() => {
    if (initialSessionId && user) {
      loadSession(initialSessionId);
    }
  }, [initialSessionId, user, loadSession]);

  return {
    // State
    messages,
    isLoading,
    isTyping,
    error,
    sessionId,
    sessions,
    quickActions,
    user,
    
    // Actions
    sendMessage,
    clearMessages,
    newSession,
    loadSession,
    loadSessions,
    deleteSession,
    
    // Refs
    messagesEndRef,
    inputRef,
    
    // Utils
    scrollToBottom
  };
};