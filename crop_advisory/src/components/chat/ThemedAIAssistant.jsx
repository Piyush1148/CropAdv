/**
 * Themed AI Assistant Interface - Matches Application Design
 * Now with Firestore Integration for Persistent Chat History
 */

import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { marked } from 'marked';
import { useChatFirestore as useChat } from '../../hooks/useChatFirestore';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useVoice } from '../../hooks/useVoice';
import AuthContext from '../../context/AuthContext';
import {
  MicrophoneButton,
  SpeakerButton,
  VoiceSettingsPanel,
  MessageVoiceControls
} from './VoiceControls';

// Theme colors matching the main application
const theme = {
  primary: '#22c55e', // Green-500
  primaryHover: '#16a34a', // Green-600
  primaryLight: '#dcfce7', // Green-100
  secondary: '#f8fafc',
  background: '#ffffff',
  surfaceGray: '#f8f9fa',
  border: '#e2e8f0',
  text: '#1e293b',
  textSecondary: '#64748b',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b'
};

// Configure marked for safe HTML rendering
marked.setOptions({
  breaks: true,
  gfm: true,
  sanitize: false // We'll handle sanitization
});

// Utility function to render markdown with safe HTML
const renderMarkdown = (content) => {
  if (!content) return '';
  
  // Simple markdown transformations for common patterns
  let processed = content
    // Bold text **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text *text* -> <em>text</em>  
    .replace(/\*((?!\*)[^*]+?)\*/g, '<em>$1</em>')
    // URLs (simple detection)
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
    // Line breaks (convert \n to <br> but handle multiple line breaks)
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
    
  return processed;
};

// Component for rendering message content with markdown
const MarkdownContent = ({ content }) => {
  return (
    <div 
      dangerouslySetInnerHTML={{ 
        __html: renderMarkdown(content) 
      }} 
    />
  );
};

// Styled Components matching application theme
const MainContainer = styled.div`
  display: flex;
  height: calc(100vh - 80px);
  width: 100%;
  max-width: 100vw;
  background: ${theme.background};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
  
  /* Ensure total width doesn't exceed viewport */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }
`;

const Sidebar = styled.div`
  width: 220px;
  min-width: 220px;
  background: ${theme.background};
  border-right: 1px solid ${theme.border};
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;

  @media (max-width: 1200px) {
    width: 200px;
    min-width: 200px;
  }

  @media (max-width: 1024px) {
    width: 180px;
    min-width: 180px;
  }

  @media (max-width: 768px) {
    display: none; /* Hide on mobile */
  }
`;

const SidebarHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${theme.border};
  background: ${theme.surfaceGray};
`;

const SidebarTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${theme.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NewChatButton = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: ${theme.primary};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background: ${theme.primaryHover};
  }

  &:active {
    transform: translateY(1px);
  }
`;

const SessionsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 15px;
`;

const SessionItem = styled.div`
  position: relative;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  border: 1px solid ${props => props.active ? theme.primary : 'transparent'};
  background: ${props => props.active ? theme.primaryLight : theme.background};
  transition: all 0.2s;
  
  &:hover {
    background: ${theme.surfaceGray};
    border-color: ${theme.border};
  }
`;

const SessionTitle = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: ${theme.text};
  margin-bottom: 4px;
`;

const SessionTime = styled.div`
  font-size: 12px;
  color: ${theme.textSecondary};
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  
  ${SessionItem}:hover & {
    opacity: 1;
  }
  
  &:hover {
    background: ${theme.error};
  }
`;

const ChatArea = styled.div`
  flex: 1;
  min-width: 0; /* Important: allows flex item to shrink below content size */
  display: flex;
  flex-direction: column;
  background: ${theme.background};
`;

const ChatHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${theme.border};
  background: ${theme.primary};
  color: white;
`;

const ChatTitle = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: ${theme.surfaceGray};
`;

const MessageBubble = styled.div`
  display: flex;
  margin-bottom: 16px;
  ${props => props.isUser ? 'justify-content: flex-end;' : ''}
`;

const MessageContent = styled.div`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  background: ${props => props.isUser ? theme.primary : theme.background};
  color: ${props => props.isUser ? 'white' : theme.text};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  line-height: 1.5;
  word-wrap: break-word;
  overflow-wrap: break-word;

  /* Markdown styling for AI responses */
  strong {
    font-weight: 600;
    color: ${props => props.isUser ? 'white' : theme.primary};
  }
  
  em {
    font-style: italic;
    color: ${props => props.isUser ? 'rgba(255,255,255,0.9)' : theme.textSecondary};
  }
  
  a {
    color: ${props => props.isUser ? 'rgba(255,255,255,0.9)' : theme.primary};
    text-decoration: underline;
    
    &:hover {
      color: ${props => props.isUser ? 'white' : theme.primaryHover};
    }
  }
  
  br {
    line-height: 1.8;
  }

  @media (max-width: 768px) {
    max-width: 85%;
  }
`;

const ChatInputContainer = styled.div`
  padding: 20px;
  border-top: 1px solid ${theme.border};
  background: ${theme.background};

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 14px 20px;
  border: 2px solid ${theme.border};
  border-radius: 25px;
  font-size: 15px;
  background: ${theme.background};
  color: ${theme.text};
  outline: none;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:focus {
    border-color: ${theme.primary};
    box-shadow: 0 0 0 4px ${theme.primaryLight}, 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  &::placeholder {
    color: ${theme.textSecondary};
    font-style: italic;
  }
`;

const SendButton = styled.button`
  padding: 14px 24px;
  background: ${props => props.disabled ? theme.textSecondary : theme.primary};
  color: white;
  border: none;
  border-radius: 25px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-weight: 600;
  transition: all 0.2s;
  opacity: ${props => props.disabled ? 0.6 : 1};
  box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
  min-width: 80px;

  &:hover:not(:disabled) {
    background: ${theme.primaryHover};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(34, 197, 94, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
  }
`;

const RightPanel = styled.div`
  width: 220px;
  min-width: 220px;
  background: ${theme.background};
  border-left: 1px solid ${theme.border};
  overflow-y: auto;
  flex-shrink: 0;

  @media (max-width: 1200px) {
    width: 200px;
    min-width: 200px;
  }

  @media (max-width: 1024px) {
    width: 180px;
    min-width: 180px;
  }

  @media (max-width: 768px) {
    display: none; /* Hide on mobile */
  }
`;

const RightPanelHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${theme.border};
  background: ${theme.surfaceGray};
`;

const QuickActionButton = styled.button`
  display: block;
  width: 100%;
  margin: 8px 0;
  padding: 12px 16px;
  border: 1px solid ${theme.primary};
  background: ${theme.background};
  color: ${theme.primary};
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: ${theme.primaryLight};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const WelcomeMessage = styled.div`
  text-align: center;
  padding: 60px 40px;
  color: ${theme.textSecondary};

  h3 {
    color: ${theme.text};
    margin-bottom: 12px;
    font-size: 24px;
  }

  p {
    font-size: 16px;
    line-height: 1.6;
  }
`;

const ErrorMessage = styled.div`
  padding: 12px 16px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 8px;
  margin: 16px 0;
  border: 1px solid #fecaca;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: ${theme.background};
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  max-width: 70%;

  &::after {
    content: '●●●';
    animation: typing 1.5s infinite;
    color: ${theme.textSecondary};
  }

  @keyframes typing {
    0%, 60%, 100% { opacity: 0.3; }
    30% { opacity: 1; }
  }
`;

const ThemedAIAssistant = () => {
  // Component renders normally - logging removed to prevent console spam

  // ✅ Get auth state to check if Firebase is ready
  const { authReady } = useContext(AuthContext);

  // ✅ NEW: Fetch user profile for personalized AI context
  const { profile, profileComplete, getAIContext } = useUserProfile();

  const {
    messages,
    isLoading,
    isTyping,
    error,
    sessionId,
    sessions,
    quickActions,
    user,
    sendMessage,
    newSession,
    clearMessages,
    loadSession,
    loadSessions,
    deleteSession
  } = useChat();

  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [speakingMessageId, setSpeakingMessageId] = useState(null); // Track which message is speaking

  // ✅ NEW: Voice functionality hook
  const voice = useVoice();

  // ✅ NEW: Voice input handler
  const handleVoiceInput = (transcript) => {
    if (transcript && transcript.trim()) {
      setInputMessage(transcript);
      console.log('🎤 Voice input received:', transcript);
    }
  };

  // ✅ NEW: Voice input error handler
  const handleVoiceError = (error) => {
    console.error('🎤 Voice input error:', error);
    // Optionally show error to user
  };

  // ✅ NEW: Speak message handler
  const handleSpeakMessage = (messageContent, messageId) => {
    if (speakingMessageId === messageId && voice.isSpeaking) {
      // If this message is already speaking, toggle pause/resume
      if (voice.isPaused) {
        voice.resumeSpeaking();
      } else {
        voice.pauseSpeaking();
      }
    } else {
      // Stop any current speech and start new one
      voice.stopSpeaking();
      setSpeakingMessageId(messageId);
      voice.speak(messageContent);
    }
  };

  // ✅ NEW: Stop speaking handler
  const handleStopSpeaking = () => {
    voice.stopSpeaking();
    setSpeakingMessageId(null);
  };

  // ✅ NEW: Clean up voice when message is removed
  useEffect(() => {
    return () => {
      voice.stopSpeaking();
    };
  }, []);

  // Test backend connection and show profile status on component mount
  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        console.log('🔍 Testing backend connection...');
        const response = await fetch('http://localhost:8000/api/health');
        console.log('🔍 Health check response:', response);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Health check data:', data);
          setConnectionStatus('✅ Backend Connected');
          
          // ✅ NEW: Log profile status for personalization
          if (profile) {
            const aiContext = getAIContext();
            console.log('🎯 AI Personalization Active:', {
              name: profile.full_name,
              complete: profileComplete,
              context: aiContext
            });
          }
        } else {
          setConnectionStatus(`❌ Backend Error: ${response.status}`);
        }
      } catch (error) {
        console.error('🔍 Backend connection failed:', error);
        setConnectionStatus(`❌ Connection Failed: ${error.message}`);
      }
    };

    testBackendConnection();
  }, [profile, profileComplete, getAIContext]);

  const [inputMessage, setInputMessage] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // Session management with Firestore
  const handleSessionSelect = (session) => {
    console.log('📂 Loading session:', session);
    setSelectedSessionId(session.session_id);
    loadSession(session.session_id);
  };

  const handleNewSession = () => {
    console.log('📝 Creating new session');
    setSelectedSessionId(null);
    newSession();
  };

  const handleDeleteSession = async (session) => {
    console.log('🗑️ Deleting session:', session);
    const success = await deleteSession(session.session_id);
    if (success) {
      console.log('✅ Session deleted successfully');
    }
  };

  // Helper function to generate session title from first message
  const generateSessionTitle = (firstMessage) => {
    if (!firstMessage) return 'New Chat';
    
    const words = firstMessage.split(' ').slice(0, 4).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words || 'New Chat';
  };

  // Helper function to format time
  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // ✅ Check if Firebase auth is ready before sending
    if (!authReady) {
      console.warn('⏳ Waiting for Firebase authentication to initialize...');
      // Show a brief message to user
      return;
    }

    try {
      console.log('Sending message:', inputMessage);
      await sendMessage(inputMessage.trim());
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (prompt) => {
    // ✅ Check if auth is ready before sending
    if (!authReady) {
      console.warn('⏳ Waiting for Firebase authentication to initialize...');
      return;
    }
    
    setInputMessage(prompt);
    // Auto-send quick action
    sendMessage(prompt);
  };

  // Debug logging removed to prevent excessive console output

  return (
    <MainContainer>
      {/* Sidebar */}
      <Sidebar>
        <SidebarHeader>
          <SidebarTitle>
            💬 Chat Sessions
          </SidebarTitle>
        </SidebarHeader>
        
        <div style={{ padding: '15px' }}>
          <NewChatButton onClick={handleNewSession}>
            ➕ New Chat
          </NewChatButton>
        </div>

        <SessionsList>
          {user ? (
            sessions.length > 0 ? (
              sessions.map(session => (
                <SessionItem 
                  key={session.session_id} 
                  active={session.session_id === sessionId}
                  onClick={() => handleSessionSelect(session)}
                >
                  <SessionTitle>{session.title || 'Untitled Chat'}</SessionTitle>
                  <SessionTime>{formatTime(new Date(session.created_at || session.updated_at))}</SessionTime>
                  <div style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '2px' }}>
                    {session.message_count || 0} messages
                  </div>
                  <DeleteButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session);
                    }}
                  >
                    🗑️
                  </DeleteButton>
                </SessionItem>
              ))
            ) : (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: theme.textSecondary,
                fontSize: '14px'
              }}>
                No chat sessions yet.<br />
                Start a new conversation!
              </div>
            )
          ) : (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: theme.textSecondary,
              fontSize: '14px'
            }}>
              Please log in to access<br />
              your chat history
            </div>
          )}
        </SessionsList>
      </Sidebar>

      {/* Main Chat Area */}
      <ChatArea>
        <ChatHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <ChatTitle>
              🤖 AI Farming Assistant ✨
            </ChatTitle>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              {user ? `👤 ${user.name || user.email}` : '🔑 Not signed in'} | {connectionStatus}
            </div>
          </div>
        </ChatHeader>

        <MessagesContainer>
          {error && (
            <ErrorMessage>
              ⚠️ Error: {error}
            </ErrorMessage>
          )}

          {messages && messages.length > 0 ? (
            messages.map(message => (
              <MessageBubble key={message.id} isUser={message.role === 'user'}>
                <MessageContent isUser={message.role === 'user'}>
                  {message.role === 'user' ? (
                    message.content
                  ) : (
                    <MarkdownContent content={message.content} />
                  )}
                </MessageContent>
                {/* ✅ NEW: Voice controls for AI messages */}
                {message.role === 'assistant' && (
                  <div style={{ marginTop: '8px' }}>
                    <MessageVoiceControls
                      isSpeaking={speakingMessageId === message.id && voice.isSpeaking}
                      isPaused={speakingMessageId === message.id && voice.isPaused}
                      onSpeak={() => handleSpeakMessage(message.content, message.id)}
                      onPause={() => voice.pauseSpeaking()}
                      onResume={() => voice.resumeSpeaking()}
                      onStop={handleStopSpeaking}
                    />
                  </div>
                )}
              </MessageBubble>
            ))
          ) : (
            <WelcomeMessage>
              <h3>👋 Welcome to AI Farming Assistant!</h3>
              <p>Ask me anything about crops, soil health, pest control, irrigation, or any farming techniques. I'm here to help you grow better!</p>
            </WelcomeMessage>
          )}

          {isTyping && (
            <TypingIndicator>
              🤖 AI is thinking
            </TypingIndicator>
          )}
        </MessagesContainer>

        <ChatInputContainer>
          {/* ✅ NEW: Voice settings panel with multilingual support */}
          <div style={{ padding: '8px 16px', borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <VoiceSettingsPanel
              speechRate={voice.speechRate}
              onSpeedChange={(rate) => voice.changeSpeechRate(rate)}
              isMuted={voice.isMuted}
              onMuteToggle={() => voice.toggleMute()}
              selectedLanguage={voice.selectedLanguage}
              availableLanguages={voice.availableLanguages}
              onLanguageChange={(lang) => voice.changeLanguage(lang)}
              compact={true}
            />
            {voice.error && (
              <div style={{ fontSize: '12px', color: theme.error }}>
                {voice.error}
              </div>
            )}
          </div>
          
          <InputWrapper>
            {/* ✅ NEW: Microphone button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px' }}>
              <MicrophoneButton
                isListening={voice.isListening}
                onStart={() => voice.startListening(handleVoiceInput, handleVoiceError)}
                onStop={() => voice.stopListening()}
                disabled={isLoading}
              />
            </div>
            
            <MessageInput
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={!authReady ? "⏳ Initializing..." : voice.isListening ? "🎤 Listening..." : "💬 Ask about crops, soil, pests, irrigation, or any farming question..."}
              disabled={isLoading || !authReady}
            />
            <SendButton 
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim() || !authReady}
              title={!authReady ? "Waiting for authentication..." : ""}
            >
              {!authReady ? '⏳' : isLoading ? '⏳' : '🚀 Send'}
            </SendButton>
          </InputWrapper>
        </ChatInputContainer>
      </ChatArea>

      {/* Right Panel */}
      <RightPanel>
        <RightPanelHeader>
          <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: theme.text }}>
            ✨ Quick Actions
          </h3>
        </RightPanelHeader>

        <div style={{ padding: '15px' }}>
          {quickActions?.map(action => (
            <QuickActionButton 
              key={action.id}
              onClick={() => handleQuickAction(action.prompt)}
            >
              {action.label}
            </QuickActionButton>
          )) || (
            <>
              <QuickActionButton onClick={() => handleQuickAction('What crops should I plant this season?')}>
                🌱 Crop Recommendations
              </QuickActionButton>
              <QuickActionButton onClick={() => handleQuickAction('How can I improve my soil health?')}>
                🌍 Soil Health Tips
              </QuickActionButton>
              <QuickActionButton onClick={() => handleQuickAction('Natural pest control methods?')}>
                🐛 Pest Control
              </QuickActionButton>
              <QuickActionButton onClick={() => handleQuickAction('Best irrigation practices?')}>
                💧 Irrigation Guide
              </QuickActionButton>
            </>
          )}
        </div>

        <div style={{ padding: '15px', borderTop: `1px solid ${theme.border}` }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: theme.text }}>🌾 I Can Help With:</h4>
          <ul style={{ fontSize: '13px', color: theme.textSecondary, margin: 0, paddingLeft: '16px', lineHeight: '1.6' }}>
            <li>Crop selection & planting advice</li>
            <li>Soil health & fertilizer guidance</li>
            <li>Pest & disease identification</li>
            <li>Irrigation & water management</li>
            <li>Weather-based recommendations</li>
            <li>Harvest timing & techniques</li>
          </ul>
        </div>
      </RightPanel>
    </MainContainer>
  );
};

export default ThemedAIAssistant;