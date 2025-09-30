import React from 'react';

const SimpleAIAssistant = () => {
  console.log('SimpleAIAssistant rendering');
  
  return (
    <div style={{
      padding: '40px',
      backgroundColor: '#f0f8ff',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333', textAlign: 'center' }}>🤖 AI Assistant (Simple Test)</h1>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        margin: '20px auto'
      }}>
        <p>✅ AI Assistant page loaded successfully!</p>
        <p>This is a simplified test version to verify the route works.</p>
        <button style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Test Button
        </button>
      </div>
    </div>
  );
};

export default SimpleAIAssistant;