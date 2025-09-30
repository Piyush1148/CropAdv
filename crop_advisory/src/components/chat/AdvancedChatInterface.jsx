/**
 * Advanced ChatInterface with Session Management
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useChatSimplified as useChat } from '../../hooks/useChatSimplified';
import EnhancedMessageBubble from './EnhancedMessageBubble';
import TypingIndicatorSimple from './TypingIndicatorSimple';
import ChatInputSimple from './ChatInputSimple';
import QuickActionsSimple from './QuickActionsSimple';
import { 
  MessageCircle, 
  Trash2, 
  Plus,
  RefreshCw,
  Settings,
  MoreVertical,
  History,
  Star,
  Download,
  Share2
} from 'lucide-react';

const MainContainer = styled.div`
  display: flex;
  height: 100%;
  max-height: 80vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: ${props => props.collapsed ? '60px' : '280px'};
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
  
  @media (max-width: 768px) {
    display: ${props => props.mobileHidden ? 'none' : 'flex'};
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    z-index: 10;
    box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  }
`;

const SidebarHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SidebarTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
`;

const CollapseButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid #e9ecef;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #f8f9fa;
  }
`;

const SessionsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;

const SessionItem = styled.div`
  padding: 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  background: ${props => props.active ? '#007bff' : 'transparent'};
  color: ${props => props.active ? 'white' : '#333'};
  
  &:hover {
    background: ${props => props.active ? '#007bff' : '#e9ecef'};
  }
`;

const SessionTitle = styled.div`
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SessionPreview = styled.div`
  font-size: 12px;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SessionDate = styled.div`
  font-size: 11px;
  opacity: 0.6;
  margin-top: 4px;
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
`;

const ChatHeader = styled.div`
  padding: 16px 20px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

const ScrollAnchor = styled.div`
  height: 1px;
`;

const StatusBar = styled.div`
  padding: 8px 16px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  font-size: 12px;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const AdvancedChatInterface = ({ 
  sessionId = null,
  onSessionChange = null,
  height = '80vh',
  showQuickActions = true,
  showHeader = true,
  showSidebar = true
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileHidden, setMobileHidden] = useState(true);
  const [mockSessions] = useState([
    { id: '1', title: 'Crop Rotation Advice', preview: 'What crops should I rotate?', date: new Date().toISOString() },
    { id: '2', title: 'Pest Control Discussion', preview: 'How to deal with aphids?', date: new Date(Date.now() - 86400000).toISOString() },
    { id: '3', title: 'Irrigation Planning', preview: 'Best watering schedule for tomatoes', date: new Date(Date.now() - 172800000).toISOString() },
  ]);

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

  const handleSendMessage = async (message) => {
    if (!message?.trim()) return;
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

  const handleExport = () => {
    // Implement chat export functionality
    console.log('Exporting chat...');
  };

  const handleShare = () => {
    // Implement chat sharing functionality
    console.log('Sharing chat...');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <MainContainer style={{ height }}>
      {showSidebar && (
        <Sidebar collapsed={sidebarCollapsed} mobileHidden={mobileHidden}>
          <SidebarHeader>
            {!sidebarCollapsed && <SidebarTitle>Chat Sessions</SidebarTitle>}
            <CollapseButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              <History size={14} />
            </CollapseButton>
          </SidebarHeader>
          
          {!sidebarCollapsed && (
            <SessionsList>
              {mockSessions.map((session) => (
                <SessionItem 
                  key={session.id} 
                  active={session.id === currentSessionId}
                  onClick={() => onSessionChange?.(session.id)}
                >
                  <SessionTitle>{session.title}</SessionTitle>
                  <SessionPreview>{session.preview}</SessionPreview>
                  <SessionDate>{formatDate(session.date)}</SessionDate>
                </SessionItem>
              ))}
            </SessionsList>
          )}
        </Sidebar>
      )}

      <ChatContainer>
        {showHeader && (
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
              <HeaderButton onClick={handleNewChat} title="New chat">
                <Plus />
              </HeaderButton>
              <HeaderButton onClick={handleExport} title="Export chat">
                <Download />
              </HeaderButton>
              <HeaderButton onClick={handleShare} title="Share chat">
                <Share2 />
              </HeaderButton>
              <HeaderButton title="Settings" disabled>
                <Settings />
              </HeaderButton>
            </HeaderActions>
          </ChatHeader>
        )}

        <ChatBody>
          <MessagesContainer>
            {messages.length === 0 ? (
              <EmptyState>
                <EmptyStateIcon>
                  <MessageCircle />
                </EmptyStateIcon>
                <h3>Welcome to AI Farming Assistant</h3>
                <p>Ask me anything about crop management, pest control, irrigation, soil health, or farming techniques!</p>
              </EmptyState>
            ) : (
              <>
                {messages.map((message) => (
                  <EnhancedMessageBubble
                    key={message.id}
                    message={message}
                    isUser={message.role === 'user'}
                    showTimestamp={true}
                    showAvatar={true}
                  />
                ))}
                {isTyping && <TypingIndicatorSimple />}
                <ScrollAnchor ref={messagesEndRef} />
              </>
            )}
          </MessagesContainer>
          
          {showQuickActions && messages.length === 0 && (
            <div style={{ padding: '0 20px 16px' }}>
              <QuickActionsSimple
                actions={quickActions}
                onActionClick={handleQuickAction}
                isLoading={isLoading}
              />
            </div>
          )}
        </ChatBody>
        
        <ChatInputSimple
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          placeholder="Ask me anything about farming..."
          autoFocus={messages.length === 0}
          ref={inputRef}
        />
        
        <StatusBar>
          <span>Session: {currentSessionId || 'New Chat'}</span>
          <span>{isLoading ? 'Processing...' : 'Ready'}</span>
        </StatusBar>
      </ChatContainer>
    </MainContainer>
  );
};

export default AdvancedChatInterface;