/**
 * Fixed Chat Hook - React hook for AI Assistant chat functionality
 * Robust error handling and debugging capabilities
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export const useChatFixed = (initialSessionId = null) => {
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
    console.log(`[useChat] ${message}`, data);
  };

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

  /**
   * Add a message to the current conversation
   */
  const addMessage = useCallback((message) => {
    try {
      debugLog('Adding message:', message);
      setMessages(prev => [...prev, {
        id: message.id || uuidv4(),
        role: message.role,
        content: message.content,
        timestamp: message.timestamp || new Date().toISOString(),
        metadata: message.metadata || {}
      }]);
    } catch (error) {
      debugLog('Error adding message:', error);
      console.error('Error adding message:', error);
    }
  }, []);

  /**
   * Send a message to the AI assistant - with robust error handling
   */
  const sendMessage = useCallback(async (messageContent) => {
    if (!messageContent?.trim() || isLoading) {
      debugLog('Message rejected - empty or loading');
      return;
    }

    debugLog('Sending message:', messageContent);

    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: messageContent.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message immediately
    addMessage(userMessage);
    setIsLoading(true);
    setIsTyping(true);
    setError(null);

    try {
      debugLog('Making API call to chat service');
      
      // API call with authentication
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add auth token if available
      try {
        const { auth } = await import('../services/authService');
        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken(false);
          headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        debugLog('Auth token error (continuing without):', error);
      }
      
      const response = await fetch('http://localhost:8000/api/chat/message', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: messageContent.trim(),
          session_id: sessionId || `session-${Date.now()}`
        }),
      });

      debugLog('API response status:', response.status);

      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }

      const result = await response.json();
      debugLog('API response data:', result);
      
      // Update session ID if this is a new chat
      if (!sessionId && result.session_id) {
        setSessionId(result.session_id);
        debugLog('Updated session ID:', result.session_id);
      }

      // Add AI response
      const aiMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: result.response || result.ai_response?.content || 'Sorry, I could not process your request.',
        timestamp: new Date().toISOString(),
        metadata: {
          model_used: result.model_used || 'llama-3.1-8b-instant',
          response_time: result.response_time
        }
      };

      addMessage(aiMessage);
      debugLog('AI message added successfully');
      
      // Show success toast
      toast.success('Message sent successfully!');
      
    } catch (error) {
      debugLog('Error in sendMessage:', error);
      console.error('Chat error:', error);
      setError(error.message);
      
      // Add error message
      const errorMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString(),
        metadata: { isError: true }
      };
      
      addMessage(errorMessage);
      toast.error('Failed to send message');
      
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      debugLog('Message sending completed');
      
      // Auto scroll after a short delay
      setTimeout(scrollToBottom, 100);
    }
  }, [messageContent, sessionId, isLoading, addMessage, scrollToBottom]);

  /**
   * Start a new chat session
   */
  const startNewSession = useCallback(() => {
    debugLog('Starting new session');
    setSessionId(null);
    setMessages([]);
    setError(null);
    setIsLoading(false);
    setIsTyping(false);
  }, []);

  /**
   * Execute a quick action
   */
  const executeQuickAction = useCallback(async (actionId) => {
    debugLog('Executing quick action:', actionId);
    const action = quickActions.find(a => a.id === actionId);
    if (action?.prompt) {
      await sendMessage(action.prompt);
    }
  }, [quickActions, sendMessage]);

  /**
   * Load chat sessions (placeholder for now)
   */
  const loadSessions = useCallback(async (limit = 20) => {
    debugLog('Loading sessions (placeholder)');
    // For now, return empty array
    setSessions([]);
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, scrollToBottom]);

  // Initialize quick actions on mount
  useEffect(() => {
    debugLog('useChat hook initialized', { initialSessionId });
  }, []);

  return {
    // State
    sessionId,
    messages,
    isLoading,
    isTyping,
    error,
    sessions,
    quickActions,
    
    // Actions
    sendMessage,
    startNewSession,
    executeQuickAction,
    loadSessions,
    
    // Refs
    messagesEndRef,
    inputRef,
    
    // Utilities
    addMessage,
    scrollToBottom
  };
};

export { useChatFixed as useChat };