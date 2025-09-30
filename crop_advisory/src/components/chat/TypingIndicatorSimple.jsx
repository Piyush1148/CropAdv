/**
 * Simple TypingIndicator Component - Shows when AI is typing
 */

import React from 'react';
import styled, { keyframes } from 'styled-components';

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
`;

const TypingContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 0;
  gap: 12px;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #007bff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
`;

const BubbleContainer = styled.div`
  background: #f8f9fa;
  border-radius: 18px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6c757d;
  animation: ${bounce} 1.4s ease-in-out infinite both;
  
  &:nth-child(1) { animation-delay: -0.32s; }
  &:nth-child(2) { animation-delay: -0.16s; }
  &:nth-child(3) { animation-delay: 0s; }
`;

const TypingText = styled.span`
  font-size: 12px;
  color: #6c757d;
  margin-left: 8px;
`;

const TypingIndicatorSimple = () => {
  return (
    <TypingContainer>
      <Avatar>🤖</Avatar>
      <BubbleContainer>
        <Dot />
        <Dot />
        <Dot />
        <TypingText>AI is thinking...</TypingText>
      </BubbleContainer>
    </TypingContainer>
  );
};

export default TypingIndicatorSimple;