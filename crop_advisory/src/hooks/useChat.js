/**
 * Chat Hook - React hook for AI Assistant chat functionality
 * Manages chat state, messages, and AI interactions
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { chatService } from '../services/chatService';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export const useChat = (initialSessionId = null) => {
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  
  // Refs for auto-scroll and input focus
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /**
   * Add a message to the current conversation
   */
  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, {
      id: message.id || uuidv4(),
      role: message.role,
      content: message.content,
      timestamp: message.timestamp || new Date().toISOString(),
      metadata: message.metadata || {}
    }]);
  }, []);

  /**
   * Send a message to the AI assistant
   */
  const sendMessage = useCallback(async (messageContent) => {
    if (!messageContent.trim() || isLoading) return;

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
      const result = await chatService.sendMessage(messageContent, sessionId);
      
      if (result.success) {
        // Update session ID if this is a new chat
        if (!sessionId && result.data.session_id) {
          setSessionId(result.data.session_id);
        }

        // Add AI response
        const aiMessage = {
          id: result.data.ai_response.id,
          role: 'assistant',
          content: result.data.ai_response.content,
          timestamp: result.data.ai_response.timestamp,
          metadata: {
            model_used: result.data.ai_response.model_used,
            response_time: result.data.ai_response.response_time
          }
        };

        addMessage(aiMessage);
        
        // Show success toast
        toast.success('Message sent successfully!');
        
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
      
    } catch (error) {
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
    }
  }, [messageContent, sessionId, isLoading, addMessage]);

  /**
   * Load chat sessions
   */
  const loadSessions = useCallback(async (limit = 20) => {
    try {
      const result = await chatService.getChatSessions(limit);
      
      if (result.success) {
        setSessions(result.data);
      } else {
        console.error('Failed to load sessions:', result.message);
      }
      
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }, []);

  /**
   * Load a specific chat session
   */
  const loadSession = useCallback(async (sessionIdToLoad) => {
    if (!sessionIdToLoad) return;
    
    setIsLoading(true);
    setMessages([]);
    
    try {
      const result = await chatService.getChatSession(sessionIdToLoad);
      
      if (result.success) {
        setSessionId(sessionIdToLoad);
        setMessages(result.data.messages || []);
      } else {
        toast.error('Failed to load chat session');
      }
      
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Error loading chat session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Start a new chat session
   */
  const startNewSession = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  }, []);

  /**
   * Delete a chat session
   */
  const deleteSession = useCallback(async (sessionIdToDelete) => {
    try {
      const result = await chatService.deleteChatSession(sessionIdToDelete);
      
      if (result.success) {
        // If deleting current session, start a new one
        if (sessionIdToDelete === sessionId) {
          startNewSession();
        }
        
        // Reload sessions list
        await loadSessions();
        toast.success('Chat session deleted');
        
      } else {
        toast.error('Failed to delete session');
      }
      
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Error deleting session');
    }
  }, [sessionId, startNewSession, loadSessions]);

  /**
   * Load quick actions
   */
  const loadQuickActions = useCallback(async () => {
    try {
      const result = await chatService.getQuickActions();
      
      if (result.success) {
        setQuickActions(result.data.actions || []);
      }
      
    } catch (error) {
      console.error('Error loading quick actions:', error);
    }
  }, []);

  /**
   * Execute a quick action
   */
  const executeQuickAction = useCallback(async (actionId) => {
    try {
      const result = await chatService.executeQuickAction(actionId);
      
      if (result.success) {
        // Update session ID if this creates a new session
        if (!sessionId && result.data.session_id) {
          setSessionId(result.data.session_id);
        }

        // Add both user message and AI response
        addMessage({
          id: result.data.user_message.id,
          role: 'user',
          content: result.data.user_message.content,
          timestamp: result.data.user_message.timestamp
        });

        addMessage({
          id: result.data.ai_response.id,
          role: 'assistant',
          content: result.data.ai_response.content,
          timestamp: result.data.ai_response.timestamp,
          metadata: {
            model_used: result.data.ai_response.model_used,
            response_time: result.data.ai_response.response_time
          }
        });
        
        toast.success('Quick action executed!');
        
      } else {
        toast.error('Failed to execute quick action');
      }
      
    } catch (error) {
      console.error('Error executing quick action:', error);
      toast.error('Error executing quick action');
    }
  }, [sessionId, addMessage]);

  /**
   * Auto-scroll to bottom when messages change
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /**
   * Load initial data on mount
   */
  useEffect(() => {
    loadQuickActions();
    loadSessions();
  }, [loadQuickActions, loadSessions]);

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
    loadSession,
    startNewSession,
    deleteSession,
    executeQuickAction,
    loadSessions,
    
    // Refs
    messagesEndRef,
    inputRef,
    
    // Utils
    scrollToBottom
  };
};

export default useChat;