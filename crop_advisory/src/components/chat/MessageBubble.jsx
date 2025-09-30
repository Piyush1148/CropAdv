/**
 * MessageBubble Component - Individual chat message display
 * Supports markdown formatting and different message types
 */

import React from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { User, Bot, AlertCircle } from 'lucide-react';

const MessageContainer = styled.div`
  display: flex;
  flex-direction: ${props => props.isUser ? 'row-reverse' : 'row'};
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
`;

const AvatarContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.isUser ? '#28a745' : '#007bff'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  ${props => props.isError && `
    background: #dc3545;
  `}
`;

const MessageBubbleWrapper = styled.div`
  max-width: 70%;
  min-width: 100px;
  background: ${props => props.isUser ? '#28a745' : '#f8f9fa'};
  color: ${props => props.isUser ? 'white' : '#333'};
  border-radius: 18px;
  padding: 12px 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  
  ${props => props.isError && `
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  `}
  
  @media (max-width: 768px) {
    max-width: 85%;
  }
`;

const MessageContent = styled.div`
  word-wrap: break-word;
  line-height: 1.5;
  
  /* Markdown styling */
  p {
    margin: 0 0 8px 0;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  h1, h2, h3, h4, h5, h6 {
    margin: 0 0 8px 0;
    color: inherit;
  }
  
  ul, ol {
    margin: 8px 0;
    padding-left: 20px;
  }
  
  li {
    margin-bottom: 4px;
  }
  
  code {
    background: ${props => props.isUser ? 'rgba(255, 255, 255, 0.2)' : '#e9ecef'};
    color: ${props => props.isUser ? 'white' : '#e83e8c'};
    padding: 2px 4px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }
  
  pre {
    background: ${props => props.isUser ? 'rgba(255, 255, 255, 0.1)' : '#f8f9fa'};
    color: inherit;
    padding: 12px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 8px 0;
    border: 1px solid ${props => props.isUser ? 'rgba(255, 255, 255, 0.2)' : '#dee2e6'};
    
    code {
      background: none;
      padding: 0;
      color: inherit;
    }
  }
  
  blockquote {
    border-left: 4px solid ${props => props.isUser ? 'rgba(255, 255, 255, 0.3)' : '#28a745'};
    margin: 8px 0;
    padding-left: 12px;
    font-style: italic;
  }
  
  strong {
    font-weight: 600;
  }
  
  em {
    font-style: italic;
  }
  
  a {
    color: ${props => props.isUser ? 'rgba(255, 255, 255, 0.9)' : '#007bff'};
    text-decoration: underline;
    
    &:hover {
      text-decoration: none;
    }
  }
`;

const MessageMeta = styled.div`
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 8px;
  text-align: ${props => props.isUser ? 'right' : 'left'};
`;

const MessageBubble = ({ 
  message, 
  isUser = false, 
  showTimestamp = true, 
  showAvatar = true 
}) => {
  const isError = message?.metadata?.isError || false;
  
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return '';
    }
  };

  const renderAvatar = () => {
    if (!showAvatar) return null;
    
    return (
      <AvatarContainer isUser={isUser} isError={isError}>
        {isError ? (
          <AlertCircle size={20} color="white" />
        ) : isUser ? (
          <User size={20} color="white" />
        ) : (
          <Bot size={20} color="white" />
        )}
      </AvatarContainer>
    );
  };

  const renderContent = () => {
    if (!message?.content) return null;
    
    // For user messages, render as plain text
    if (isUser) {
      return <MessageContent isUser={isUser}>{message.content}</MessageContent>;
    }
    
    // For AI messages, render with markdown support
    return (
      <MessageContent isUser={isUser} isError={isError}>
        <ReactMarkdown
          components={{
            // Custom component overrides for better styling
            p: ({ children }) => <p>{children}</p>,
            code: ({ inline, children }) => 
              inline ? <code>{children}</code> : <pre><code>{children}</code></pre>,
            ul: ({ children }) => <ul>{children}</ul>,
            ol: ({ children }) => <ol>{children}</ol>,
            li: ({ children }) => <li>{children}</li>,
            blockquote: ({ children }) => <blockquote>{children}</blockquote>,
            strong: ({ children }) => <strong>{children}</strong>,
            em: ({ children }) => <em>{children}</em>,
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            )
          }}
        >
          {message.content}
        </ReactMarkdown>
      </MessageContent>
    );
  };

  const renderMeta = () => {
    if (!showTimestamp && !message?.metadata?.model_used) return null;
    
    return (
      <MessageMeta isUser={isUser}>
        {showTimestamp && message.timestamp && (
          <span>{formatTimestamp(message.timestamp)}</span>
        )}
        {message?.metadata?.model_used && !isUser && (
          <span style={{ marginLeft: showTimestamp ? ' • ' : '' }}>
            {message.metadata.model_used}
          </span>
        )}
        {message?.metadata?.response_time && !isUser && (
          <span style={{ marginLeft: ' • ' }}>
            {Math.round(message.metadata.response_time)}ms
          </span>
        )}
      </MessageMeta>
    );
  };

  if (!message) return null;

  return (
    <MessageContainer isUser={isUser}>
      {renderAvatar()}
      <MessageBubbleWrapper isUser={isUser} isError={isError}>
        {renderContent()}
        {renderMeta()}
      </MessageBubbleWrapper>
    </MessageContainer>
  );
};

export default MessageBubble;