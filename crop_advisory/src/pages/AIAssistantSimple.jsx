/**
 * AI Assistant Page - Simplified version for debugging
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { Bot, Send } from 'lucide-react';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
  padding-top: 20px;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const PageSubtitle = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 20px;
`;

const ChatContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  min-height: 500px;
  display: flex;
  flex-direction: column;
`;

const ChatHeader = styled.div`
  padding: 20px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border-radius: 12px 12px 0 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MessagesArea = styled.div`
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 300px;
`;

const Message = styled.div`
  padding: 12px 16px;
  border-radius: 12px;
  background: ${props => props.isUser ? '#007bff' : '#f8f9fa'};
  color: ${props => props.isUser ? 'white' : '#333'};
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  max-width: 70%;
`;

const InputArea = styled.div`
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 12px;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const SendButton = styled.button`
  padding: 12px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #0056b3;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const WelcomeMessage = styled.div`
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 40px 20px;
`;

const AIAssistantSimple = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      content: inputValue,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send message to backend
      const response = await fetch('http://localhost:8000/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: 'test-session-' + Date.now()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage = {
          id: Date.now() + 1,
          content: data.response || 'Sorry, I could not process your request.',
          isUser: false,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        content: 'Sorry, I\'m having trouble connecting to the AI service. Please try again later.',
        isUser: false,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <Bot size={40} color="#007bff" />
          AI Farming Assistant
        </PageTitle>
        <PageSubtitle>
          Get expert farming advice powered by AI technology
        </PageSubtitle>
      </PageHeader>

      <ChatContainer>
        <ChatHeader>
          <Bot size={24} />
          <div>
            <h3 style={{ margin: 0 }}>Chat with AI Assistant</h3>
            <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
              Ask me anything about farming, crops, or agriculture
            </p>
          </div>
        </ChatHeader>

        <MessagesArea>
          {messages.length === 0 ? (
            <WelcomeMessage>
              👋 Welcome! I'm your AI farming assistant. Ask me anything about crops, soil, weather, or farming techniques.
            </WelcomeMessage>
          ) : (
            messages.map(message => (
              <Message key={message.id} isUser={message.isUser}>
                {message.content}
              </Message>
            ))
          )}
          
          {isLoading && (
            <Message isUser={false}>
              <em>AI is thinking...</em>
            </Message>
          )}
        </MessagesArea>

        <InputArea>
          <Input
            type="text"
            placeholder="Ask about farming, crops, soil, weather..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <SendButton onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
            <Send size={16} />
            Send
          </SendButton>
        </InputArea>
      </ChatContainer>
    </PageContainer>
  );
};

export default AIAssistantSimple;