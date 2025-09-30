/**
 * Simplified Chat Hook - Without Auth for Testing
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export const useChatSimplified = (initialSessionId = null) => {
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
   * Send message to AI assistant (Simplified - no auth)
   */
  const sendMessage = useCallback(async (content, messageSessionId = null) => {
    const currentSessionId = messageSessionId || sessionId || `session_${uuidv4()}`;
    
    if (!sessionId && currentSessionId) {
      setSessionId(currentSessionId);
    }

    try {
      setIsLoading(true);
      setIsTyping(true);
      setError(null);

      // Add user message immediately
      const userMessage = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
        sessionId: currentSessionId
      };

      setMessages(prev => [...prev, userMessage]);
      debugLog('User message added', userMessage);

      // Prepare API request
      const apiUrl = 'http://localhost:8000/api/chat/test';
      const headers = {
        'Content-Type': 'application/json'
      };

      // API call (simplified - no authentication)
      const requestBody = JSON.stringify({
        message: content,
        session_id: currentSessionId
      });

      console.log('🔍 API Request Details:', {
        url: apiUrl,
        method: 'POST',
        headers: headers,
        body: requestBody
      });
      
      debugLog('Sending API request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: requestBody
      });

      console.log('🔍 API Response Details:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });
      
      debugLog('API response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      debugLog('API response data:', data);

      // Add AI response
      const aiMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: data.response || 'Sorry, I couldn\'t process that request.',
        timestamp: new Date().toISOString(),
        sessionId: currentSessionId,
        confidence: data.confidence || 0.9
      };

      setMessages(prev => [...prev, aiMessage]);
      debugLog('AI message added', aiMessage);

      return aiMessage;

    } catch (error) {
      console.error('🚨 Send message error details:', {
        error: error,
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });
      debugLog('Send message error:', error);
      setError(`Connection failed: ${error.message}`);
      
      // Add detailed error message for user feedback
      const errorMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `⚠️ Connection Error: ${error.message}. Please check if the backend is running and try again.`,
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
  }, [sessionId]);

  /**
   * Clear current session
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    debugLog('Messages cleared');
  }, []);

  /**
   * Create new session
   */
  const newSession = useCallback(() => {
    const newSessionId = `session_${uuidv4()}`;
    setSessionId(newSessionId);
    setMessages([]);
    setError(null);
    debugLog('New session created:', newSessionId);
    return newSessionId;
  }, []);

  // Auto-scroll when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return {
    // State
    messages,
    isLoading,
    isTyping,
    error,
    sessionId,
    sessions,
    quickActions,
    
    // Actions
    sendMessage,
    clearMessages,
    newSession,
    
    // Refs
    messagesEndRef,
    inputRef,
    
    // Utils
    scrollToBottom
  };
};