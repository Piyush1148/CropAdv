/**
 * Robust AdvancedChatInterface with Comprehensive Error Handling
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useChatSimplified as useChat } from '../../hooks/useChatSimplified';

// Safely import components with error boundaries
const SafeComponent = ({ Component, fallback = null, ...props }) => {
  try {
    return <Component {...props} />;
  } catch (error) {
    console.error('Component render error:', error);
    return fallback;
  }
};

// Lazy load components to avoid import issues
const EnhancedMessageBubble = React.lazy(() => 
  import('./EnhancedMessageBubble').catch(() => ({ 
    default: ({ message }) => (
      <div style={{ padding: '10px', background: '#f0f0f0', borderRadius: '8px', margin: '8px 0' }}>
        <strong>{message.role}:</strong> {message.content}
      </div>
    )
  }))
);

const TypingIndicatorSimple = React.lazy(() => 
  import('./TypingIndicatorSimple').catch(() => ({ 
    default: () => <div>AI is typing...</div>
  }))
);

const ChatInputSimple = React.lazy(() => 
  import('./ChatInputSimple').catch(() => ({ 
    default: ({ onSendMessage }) => (
      <div style={{ padding: '10px', borderTop: '1px solid #ddd' }}>
        <input 
          type="text" 
          placeholder="Type your message..." 
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onSendMessage(e.target.value);
              e.target.value = '';
            }
          }}
          style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>
    )
  }))
);

const QuickActionsSimple = React.lazy(() => 
  import('./QuickActionsSimple').catch(() => ({ 
    default: ({ quickActions, onActionClick }) => (
      <div style={{ padding: '10px' }}>
        <h4>Quick Actions</h4>
        {quickActions?.map(action => (
          <button 
            key={action.id}
            onClick={() => onActionClick(action.prompt)}
            style={{ 
              display: 'block', 
              width: '100%', 
              margin: '5px 0', 
              padding: '8px', 
              border: '1px solid #007bff',
              backgroundColor: 'white',
              color: '#007bff',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    )
  }))
);

// Icons as simple components to avoid lucide-react issues
const MessageCircleIcon = () => <span>💬</span>;
const PlusIcon = () => <span>➕</span>;
const TrashIcon = () => <span>🗑️</span>;
const SettingsIcon = () => <span>⚙️</span>;
const SparklesIcon = () => <span>✨</span>;

const MainContainer = styled.div`
  display: flex;
  height: calc(100vh - 80px);
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Sidebar = styled.div`
  width: 300px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 4px rgba(0,0,0,0.1);
`;

const SidebarHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
`;

const SidebarTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SessionsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px;
`;

const SessionItem = styled.div`
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  background: ${props => props.active ? '#e3f2fd' : 'white'};
  border-color: ${props => props.active ? '#2196f3' : 'transparent'};
  
  &:hover {
    background: #f5f5f5;
  }
`;

const SessionTitle = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
`;

const SessionTime = styled.div`
  font-size: 12px;
  color: #666;
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
`;

const ChatHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #2196f3;
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
  background: #f8f9fa;
`;

const RightPanel = styled.div`
  width: 280px;
  background: white;
  border-left: 1px solid #e0e0e0;
  overflow-y: auto;
`;

const RightPanelHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
`;

const RobustAdvancedChatInterface = () => {
  console.log('🎯 RobustAdvancedChatInterface rendering...');

  const {
    messages,
    isLoading,
    isTyping,
    error,
    sessionId,
    quickActions,
    sendMessage,
    newSession,
    clearMessages
  } = useChat();

  const [sessions] = useState([
    {
      id: 'session-1',
      title: 'Crop Rotation Advice',
      preview: 'What crops should I rotate?',
      time: 'Today'
    },
    {
      id: 'session-2',
      title: 'Pest Control Discussion',
      preview: 'Natural pest control methods',
      time: 'Yesterday'
    }
  ]);

  const handleSendMessage = async (content) => {
    try {
      console.log('Sending message:', content);
      await sendMessage(content);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleQuickAction = (prompt) => {
    handleSendMessage(prompt);
  };

  const handleNewSession = () => {
    try {
      newSession();
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  console.log('Current state:', { 
    messagesCount: messages?.length || 0, 
    isLoading, 
    isTyping, 
    error,
    sessionId 
  });

  return (
    <MainContainer>
      {/* Sidebar */}
      <Sidebar>
        <SidebarHeader>
          <SidebarTitle>
            <MessageCircleIcon />
            Chat Sessions
          </SidebarTitle>
        </SidebarHeader>
        
        <div style={{ padding: '10px' }}>
          <button
            onClick={handleNewSession}
            style={{
              width: '100%',
              padding: '10px',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <PlusIcon />
            New Chat
          </button>
        </div>

        <SessionsList>
          {sessions.map(session => (
            <SessionItem key={session.id} active={session.id === sessionId}>
              <SessionTitle>{session.title}</SessionTitle>
              <SessionTime>{session.time}</SessionTime>
            </SessionItem>
          ))}
        </SessionsList>
      </Sidebar>

      {/* Main Chat Area */}
      <ChatArea>
        <ChatHeader>
          <ChatTitle>
            <span>🤖</span>
            AI Farming Assistant
            <SparklesIcon />
          </ChatTitle>
        </ChatHeader>

        <MessagesContainer>
          {error && (
            <div style={{
              padding: '12px',
              background: '#ffebee',
              color: '#c62828',
              borderRadius: '8px',
              margin: '10px 0',
              border: '1px solid #ffcdd2'
            }}>
              ⚠️ Error: {error}
            </div>
          )}

          <React.Suspense fallback={<div>Loading messages...</div>}>
            {messages && messages.length > 0 ? (
              messages.map(message => (
                <SafeComponent
                  key={message.id}
                  Component={EnhancedMessageBubble}
                  message={message}
                  fallback={
                    <div style={{ 
                      padding: '10px', 
                      background: message.role === 'user' ? '#e3f2fd' : '#f0f0f0',
                      borderRadius: '8px',
                      margin: '8px 0'
                    }}>
                      <strong>{message.role}:</strong> {message.content}
                    </div>
                  }
                />
              ))
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#666' 
              }}>
                <h3>👋 Welcome to AI Farming Assistant!</h3>
                <p>Ask me anything about crops, soil, pests, or farming techniques.</p>
              </div>
            )}

            {isTyping && (
              <React.Suspense fallback={<div>AI is typing...</div>}>
                <SafeComponent
                  Component={TypingIndicatorSimple}
                  fallback={<div style={{ padding: '10px', color: '#666' }}>🤖 AI is thinking...</div>}
                />
              </React.Suspense>
            )}
          </React.Suspense>
        </MessagesContainer>

        <React.Suspense fallback={<div>Loading input...</div>}>
          <SafeComponent
            Component={ChatInputSimple}
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            fallback={
              <div style={{ padding: '10px', borderTop: '1px solid #ddd' }}>
                <input 
                  type="text" 
                  placeholder="Type your message..." 
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      handleSendMessage(e.target.value.trim());
                      e.target.value = '';
                    }
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid #ddd', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            }
          />
        </React.Suspense>
      </ChatArea>

      {/* Right Panel */}
      <RightPanel>
        <RightPanelHeader>
          <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '600' }}>
            <SparklesIcon /> What I Can Help With
          </h3>
        </RightPanelHeader>

        <React.Suspense fallback={<div>Loading actions...</div>}>
          <SafeComponent
            Component={QuickActionsSimple}
            quickActions={quickActions}
            onActionClick={handleQuickAction}
            fallback={
              <div style={{ padding: '15px' }}>
                <h4>Quick Actions</h4>
                {quickActions?.map(action => (
                  <button 
                    key={action.id}
                    onClick={() => handleQuickAction(action.prompt)}
                    style={{ 
                      display: 'block', 
                      width: '100%', 
                      margin: '8px 0', 
                      padding: '12px', 
                      border: '1px solid #2196f3',
                      backgroundColor: 'white',
                      color: '#2196f3',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {action.label}
                  </button>
                )) || <p>Loading actions...</p>}
              </div>
            }
          />
        </React.Suspense>

        <div style={{ padding: '15px', borderTop: '1px solid #e0e0e0' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Features</h4>
          <ul style={{ fontSize: '12px', color: '#666', margin: 0, paddingLeft: '16px' }}>
            <li>🌱 Crop management & planning advice</li>
            <li>🐛 Pest & disease identification</li>
            <li>📈 Yield optimization strategies</li>
            <li>💧 Real-time farming solutions</li>
          </ul>
        </div>
      </RightPanel>
    </MainContainer>
  );
};

export default RobustAdvancedChatInterface;