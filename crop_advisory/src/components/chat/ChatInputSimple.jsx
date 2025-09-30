/**
 * Simple ChatInput Component - Basic message input
 */

import React, { useState, useRef, forwardRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { Send, Loader } from 'lucide-react';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
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

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  padding-right: 50px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-family: inherit;
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
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: ${props => props.disabled ? '#e9ecef' : '#007bff'};
  color: white;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #0056b3;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const CharCount = styled.div`
  font-size: 11px;
  color: #6c757d;
  padding: 0 4px;
`;

const ChatInputSimple = forwardRef(({ 
  onSendMessage,
  isLoading = false,
  placeholder = "Type your message...",
  maxLength = 1000,
  autoFocus = false
}, ref) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading) {
      return;
    }
    
    onSendMessage?.(message);
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSend = message.trim().length > 0 && !isLoading;

  return (
    <form onSubmit={handleSubmit}>
      <InputContainer>
        <InputWrapper>
          <Input
            ref={ref || inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading}
            maxLength={maxLength}
            autoFocus={autoFocus}
          />
          <SendButton
            type="submit"
            disabled={!canSend}
          >
            {isLoading ? <Loader size={16} style={{animation: `${spin} 1s linear infinite`}} /> : <Send size={16} />}
          </SendButton>
        </InputWrapper>
        
        {maxLength && (
          <CharCount>
            {message.length}/{maxLength}
          </CharCount>
        )}
      </InputContainer>
    </form>
  );
});

ChatInputSimple.displayName = 'ChatInputSimple';

export default ChatInputSimple;