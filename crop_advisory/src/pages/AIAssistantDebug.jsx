/**
 * Debug AI Assistant Page - For troubleshooting blank screen
 */

import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem;
  background: white;
  min-height: 100vh;
`;

const Title = styled.h1`
  color: #333;
  text-align: center;
  margin-bottom: 1rem;
`;

const Message = styled.p`
  color: #666;
  text-align: center;
  font-size: 1.1rem;
`;

const DebugInfo = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 14px;
`;

const AIAssistantDebug = () => {
  console.log('🔍 AIAssistantDebug component is rendering');
  
  return (
    <Container>
      <Title>🤖 AI Assistant Debug Page</Title>
      <Message>
        This is a debug version to identify the blank screen issue.
      </Message>
      <Message>
        <strong>Status:</strong> Component successfully loaded and rendering!
      </Message>
      <DebugInfo>
        <strong>Debug Info:</strong><br/>
        - Component: AIAssistantDebug<br/>
        - Timestamp: {new Date().toLocaleString()}<br/>
        - URL: {window.location.href}<br/>
        - User Agent: {navigator.userAgent.substring(0, 50)}...
      </DebugInfo>
      
      <button 
        onClick={() => console.log('Button clicked!')}
        style={{
          padding: '10px 20px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Test Button
      </button>
    </Container>
  );
};

export default AIAssistantDebug;