/**
 * ChatInput Component - Message input with send functionality
 * Features auto-resize, keyboard shortcuts, and loading states
 */

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Send, Loader, Mic, Paperclip } from 'lucide-react';

const InputContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 16px;
  background: white;
  border-top: 1px solid #e9ecef;
  border-radius: 0 0 12px 12px;
`;

const InputWrapper = styled.div`
  flex: 1;
  position: relative;
  background: #f8f9fa;
  border-radius: 24px;
  border: 2px solid #e9ecef;
  transition: border-color 0.2s ease;
  
  &:focus-within {
    border-color: #007bff;
    background: white;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 44px;
  max-height: 120px;
  padding: 12px 16px;
  padding-right: 50px; /* Space for send button */
  border: none;
  background: transparent;
  resize: none;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.4;
  outline: none;
  border-radius: 20px;
  
  &::placeholder {
    color: #6c757d;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: ${props => props.canSend ? '#007bff' : '#dee2e6'};
  color: white;
  cursor: ${props => props.canSend ? 'pointer' : 'not-allowed'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.canSend ? '#0056b3' : '#dee2e6'};
    transform: ${props => props.canSend ? 'scale(1.05)' : 'none'};
  }
  
  &:active {
    transform: ${props => props.canSend ? 'scale(0.95)' : 'none'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CharacterCount = styled.div`
  position: absolute;
  bottom: -20px;
  right: 8px;
  font-size: 11px;
  color: ${props => props.isNearLimit ? '#dc3545' : '#6c757d'};
  opacity: ${props => props.show ? 1 : 0};
  transition: opacity 0.2s ease;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  opacity: 0.7;
  
  @media (max-width: 768px) {
    display: none; /* Hide extra buttons on mobile */
  }
`;

const ActionButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #dee2e6;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f8f9fa;
    border-color: #007bff;
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  svg {
    width: 16px;
    height: 16px;
    color: #6c757d;
  }
`;

const ChatInput = ({ 
  onSendMessage, 
  isLoading = false,
  placeholder = "Ask me anything about farming...",
  maxLength = 2000,
  autoFocus = true
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);
  
  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const canSend = message.trim().length > 0 && !isLoading && message.length <= maxLength;
  const isNearLimit = message.length > maxLength * 0.8;
  const showCharCount = message.length > maxLength * 0.7;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (canSend && onSendMessage) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    // Send on Enter (but not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    
    // Enforce max length
    if (value.length <= maxLength) {
      setMessage(value);
    }
  };

  const handleAttachFile = () => {
    // Future implementation for file attachments
    console.log('File attachment clicked');
  };

  const handleVoiceInput = () => {
    // Future implementation for voice input
    console.log('Voice input clicked');
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputContainer>
        <ActionButtons>
          <ActionButton
            type="button"
            onClick={handleAttachFile}
            disabled={isLoading}
            title="Attach file (Coming soon)"
          >
            <Paperclip />
          </ActionButton>
          
          <ActionButton
            type="button"
            onClick={handleVoiceInput}
            disabled={isLoading}
            title="Voice input (Coming soon)"
          >
            <Mic />
          </ActionButton>
        </ActionButtons>
        
        <InputWrapper>
          <TextArea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
          />
          
          <SendButton
            type="submit"
            canSend={canSend}
            disabled={!canSend}
            title={canSend ? 'Send message' : 'Type a message to send'}
          >
            {isLoading ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </SendButton>
          
          <CharacterCount 
            show={showCharCount} 
            isNearLimit={isNearLimit}
          >
            {message.length}/{maxLength}
          </CharacterCount>
        </InputWrapper>
      </InputContainer>
    </form>
  );
};

export default ChatInput;