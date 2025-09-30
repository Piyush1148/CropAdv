/**
 * Ultra Minimal AI Assistant Test - Zero Dependencies
 */

import React, { useState } from 'react';

const UltraMinimalAI = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Hello! I am your AI assistant. How can I help with farming today?' }
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { 
      id: Date.now(), 
      role: 'user', 
      content: message 
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: 'test-session'
        })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response || 'Sorry, I encountered an error.'
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I could not connect to the AI service.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: '#2196f3',
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0 }}>🤖 Ultra Minimal AI Assistant</h1>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflow: 'auto'
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            marginBottom: '15px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f0f0f0',
            marginLeft: msg.role === 'user' ? '50px' : '0',
            marginRight: msg.role === 'user' ? '0' : '50px'
          }}>
            <strong>{msg.role === 'user' ? '👤' : '🤖'} {msg.role}:</strong>
            <div style={{ marginTop: '5px' }}>{msg.content}</div>
          </div>
        ))}
        
        {loading && (
          <div style={{
            padding: '12px',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            marginRight: '50px'
          }}>
            <strong>🤖 assistant:</strong>
            <div style={{ marginTop: '5px' }}>Thinking...</div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid #ddd',
        backgroundColor: 'white'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about farming, crops, pests..."
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px'
            }}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !message.trim()}
            style={{
              padding: '12px 20px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading || !message.trim() ? 0.6 : 1
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default UltraMinimalAI;