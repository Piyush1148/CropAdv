/**
 * Simple MessageBubble Component - Chat message display without markdown
 */

import React from 'react';
import styled from 'styled-components';

const MessageContainer = styled.div`
  display: flex;
  flex-direction: ${props => props.isUser ? 'row-reverse' : 'row'};
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.isUser ? '#28a745' : '#007bff'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
  font-size: 18px;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  background: ${props => props.isUser 
    ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
    : '#f8f9fa'
  };
  color: ${props => props.isUser ? 'white' : '#333'};
  word-wrap: break-word;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const MessageContent = styled.div`
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
`;

const Timestamp = styled.div`
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
  text-align: ${props => props.isUser ? 'right' : 'left'};
`;

const MessageBubbleSimple = ({ 
  message, 
  isUser, 
  showTimestamp = true, 
  showAvatar = true 
}) => {
  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return '';
    }
  };

  return (
    <MessageContainer isUser={isUser}>
      {showAvatar && (
        <Avatar isUser={isUser}>
          {isUser ? '👤' : '🤖'}
        </Avatar>
      )}
      
      <div>
        <MessageBubble isUser={isUser}>
          <MessageContent>
            {message.content}
          </MessageContent>
          
          {showTimestamp && message.timestamp && (
            <Timestamp isUser={isUser}>
              {formatTime(message.timestamp)}
            </Timestamp>
          )}
        </MessageBubble>
      </div>
    </MessageContainer>
  );
};

export default MessageBubbleSimple;