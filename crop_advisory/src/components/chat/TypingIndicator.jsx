/**
 * TypingIndicator Component - Shows when AI is processing a response
 * Animated dots to indicate activity
 */

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Bot } from 'lucide-react';

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
`;

const pulse = keyframes`
  0% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.4;
  }
`;

const TypingContainer = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
`;

const AvatarContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #007bff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const TypingBubble = styled.div`
  background: #f8f9fa;
  border-radius: 18px;
  padding: 16px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 24px;
`;

const TypingText = styled.span`
  color: #6c757d;
  font-size: 14px;
  margin-right: 8px;
`;

const DotsContainer = styled.div`
  display: flex;
  gap: 2px;
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #007bff;
  animation: ${bounce} 1.4s ease-in-out infinite both;
  animation-delay: ${props => props.delay}s;
`;

const TypingIndicator = ({ 
  message = "AI Assistant is thinking...", 
  showAvatar = true 
}) => {
  return (
    <TypingContainer>
      {showAvatar && (
        <AvatarContainer>
          <Bot size={20} color="white" />
        </AvatarContainer>
      )}
      
      <TypingBubble>
        <TypingText>{message}</TypingText>
        <DotsContainer>
          <Dot delay={0} />
          <Dot delay={0.2} />
          <Dot delay={0.4} />
        </DotsContainer>
      </TypingBubble>
    </TypingContainer>
  );
};

export default TypingIndicator;