/**
 * Enhanced MessageBubble with Markdown Support
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
  
  /* Simple markdown styling */
  h1, h2, h3 { margin: 8px 0 4px 0; }
  h1 { font-size: 18px; }
  h2 { font-size: 16px; }
  h3 { font-size: 15px; }
  
  p { margin: 4px 0; }
  
  strong, b { font-weight: bold; }
  em, i { font-style: italic; }
  
  ul, ol { 
    margin: 4px 0; 
    padding-left: 20px; 
  }
  
  li { margin: 2px 0; }
  
  code {
    background: ${props => props.isUser ? 'rgba(255,255,255,0.2)' : '#e9ecef'};
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
  }
  
  pre {
    background: ${props => props.isUser ? 'rgba(255,255,255,0.1)' : '#f8f9fa'};
    padding: 8px 12px;
    border-radius: 8px;
    margin: 8px 0;
    overflow-x: auto;
    
    code {
      background: none;
      padding: 0;
    }
  }
  
  blockquote {
    border-left: 3px solid ${props => props.isUser ? 'rgba(255,255,255,0.3)' : '#007bff'};
    padding-left: 12px;
    margin: 8px 0;
    font-style: italic;
  }
`;

const Timestamp = styled.div`
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
  text-align: ${props => props.isUser ? 'right' : 'left'};
`;

const CopyButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0,0,0,0.1);
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  color: ${props => props.isUser ? 'white' : '#666'};
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  
  &:hover {
    background: rgba(0,0,0,0.2);
  }
`;

const BubbleWrapper = styled.div`
  position: relative;
  
  &:hover ${CopyButton} {
    opacity: 1;
  }
`;

// Simple markdown parser
const parseMarkdown = (text) => {
  if (!text) return text;
  
  return text
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Lists
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
};

const EnhancedMessageBubble = ({ 
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      // Could show a toast here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const content = isUser ? message.content : parseMarkdown(message.content);

  return (
    <MessageContainer isUser={isUser}>
      {showAvatar && (
        <Avatar isUser={isUser}>
          {isUser ? '👤' : '🤖'}
        </Avatar>
      )}
      
      <div>
        <BubbleWrapper>
          <MessageBubble isUser={isUser}>
            <MessageContent 
              isUser={isUser}
              dangerouslySetInnerHTML={
                isUser ? undefined : { __html: content }
              }
            >
              {isUser && message.content}
            </MessageContent>
            
            {showTimestamp && message.timestamp && (
              <Timestamp isUser={isUser}>
                {formatTime(message.timestamp)}
              </Timestamp>
            )}
          </MessageBubble>
          
          <CopyButton isUser={isUser} onClick={handleCopy} title="Copy message">
            Copy
          </CopyButton>
        </BubbleWrapper>
      </div>
    </MessageContainer>
  );
};

export default EnhancedMessageBubble;