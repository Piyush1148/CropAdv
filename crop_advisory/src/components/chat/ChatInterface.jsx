/**
 * ChatInterface Component - Main chat interface with AI Assistant
 * Combines all chat components into a complete chat experience
 */

import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';
import QuickActions from './QuickActions';
import { 
  MessageCircle, 
  Trash2, 
  Plus,
  RefreshCw,
  Settings,
  MoreVertical
} from 'lucide-react';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 80vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const ChatHeader = styled.div`
  padding: 16px 20px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 12px 12px 0 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

const HeaderSubtitle = styled.p`
  margin: 0;
  font-size: 12px;
  opacity: 0.8;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HeaderButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ChatBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 400px;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 20px;
  padding-bottom: 8px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #6c757d;
  padding: 40px 20px;
`;

const EmptyStateIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  
  svg {
    width: 28px;
    height: 28px;
    color: #007bff;
  }
`;

const EmptyStateTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
`;

const EmptyStateText = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  max-width: 300px;
`;

const ScrollAnchor = styled.div`
  height: 1px;
`;

const ErrorMessage = styled.div`
  padding: 12px 16px;
  margin: 8px 16px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  font-size: 14px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  
  svg {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const ChatInterface = ({ 
  sessionId = null,
  onSessionChange = null,
  height = '80vh',
  showQuickActions = true,
  showHeader = true
}) => {
  const {
    sessionId: currentSessionId,
    messages,
    isLoading,
    isTyping,
    error,
    quickActions,
    sendMessage,
    startNewSession,
    executeQuickAction,
    messagesEndRef,
    inputRef
  } = useChat(sessionId);

  // Notify parent of session changes
  useEffect(() => {
    if (onSessionChange && currentSessionId !== sessionId) {
      onSessionChange(currentSessionId);
    }
  }, [currentSessionId, sessionId, onSessionChange]);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;
    await sendMessage(message);
  };

  const handleQuickAction = async (action) => {
    if (typeof action === 'string') {
      await sendMessage(action);
    } else if (action.id) {
      await executeQuickAction(action.id);
    }
  };

  const handleNewChat = () => {
    startNewSession();
  };

  const handleRefresh = () => {
    // Refresh the current session or start new one
    if (currentSessionId) {
      window.location.reload(); // Simple refresh for now
    } else {
      startNewSession();
    }
  };

  const renderHeader = () => {
    if (!showHeader) return null;

    return (
      <ChatHeader>
        <HeaderLeft>
          <MessageCircle size={20} />
          <div>
            <HeaderTitle>AI Farming Assistant</HeaderTitle>
            <HeaderSubtitle>
              Powered by GROQ • {messages.length} messages
            </HeaderSubtitle>
          </div>
        </HeaderLeft>
        
        <HeaderActions>
          <HeaderButton 
            onClick={handleNewChat}
            title="Start new conversation"
          >
            <Plus />
          </HeaderButton>
          
          <HeaderButton 
            onClick={handleRefresh}
            title="Refresh chat"
          >
            <RefreshCw />
          </HeaderButton>
          
          <HeaderButton 
            title="Chat settings (Coming soon)"
            disabled
          >
            <Settings />
          </HeaderButton>
        </HeaderActions>
      </ChatHeader>
    );
  };

  const renderMessages = () => {
    if (isLoading && messages.length === 0) {
      return (
        <LoadingSpinner>
          <RefreshCw size={24} />
        </LoadingSpinner>
      );
    }

    if (messages.length === 0) {
      return (
        <EmptyState>
          <EmptyStateIcon>
            <MessageCircle />
          </EmptyStateIcon>
          <EmptyStateTitle>Welcome to AI Farming Assistant</EmptyStateTitle>
          <EmptyStateText>
            Ask me anything about crop management, pest control, irrigation, 
            soil health, or any other farming questions. I'm here to help!
          </EmptyStateText>
        </EmptyState>
      );
    }

    return (
      <>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isUser={message.role === 'user'}
            showTimestamp={true}
            showAvatar={true}
          />
        ))}
        
        {isTyping && <TypingIndicator />}
        
        <ScrollAnchor ref={messagesEndRef} />
      </>
    );
  };

  const renderQuickActions = () => {
    if (!showQuickActions || messages.length > 0) return null;
    
    return (
      <div style={{ padding: '0 20px 16px' }}>
        <QuickActions
          actions={quickActions}
          onActionClick={handleQuickAction}
          isLoading={isLoading}
          collapsed={false}
        />
      </div>
    );
  };

  return (
    <ChatContainer style={{ height }}>
      {renderHeader()}
      
      <ChatBody>
        <MessagesContainer>
          {error && (
            <ErrorMessage>
              Error: {error}. Please try again or start a new conversation.
            </ErrorMessage>
          )}
          
          {renderMessages()}
        </MessagesContainer>
        
        {renderQuickActions()}
      </ChatBody>
      
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        placeholder="Ask me anything about farming..."
        autoFocus={messages.length === 0}
      />
    </ChatContainer>
  );
};

export default ChatInterface;