import React, { useState, useEffect } from 'react';

function App() {
  const [logs, setLogs] = useState(['App component initializing...']);
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount(prev => prev + 1);
    const newLog = `App mounted - render #${renderCount + 1} at ${new Date().toLocaleTimeString()}`;
    console.log(newLog);
    setLogs(prev => [...prev, newLog]);
    
    return () => {
      console.log('App component unmounting');
    };
  }, []);

  console.log('App component rendering - render count:', renderCount);
  
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#e6ffe6',
      border: '3px solid #00aa00',
      margin: '20px',
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif',
      minHeight: '400px'
    }}>
      <h1 style={{ color: '#004400' }}>🚀 React App is Working!</h1>
      <p><strong>Status:</strong> React is rendering successfully</p>
      <p><strong>Render Count:</strong> {renderCount}</p>
      <p><strong>Current Time:</strong> {new Date().toISOString()}</p>
      
      <div style={{ 
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderRadius: '4px'
      }}>
        <h3>Debug Logs:</h3>
        <div style={{ 
          maxHeight: '150px', 
          overflowY: 'auto',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{ padding: '2px 0' }}>
              {log}
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={() => {
          const newLog = `Button clicked at ${new Date().toLocaleTimeString()}`;
          console.log(newLog);
          setLogs(prev => [...prev, newLog]);
          alert('React event handling is working!');
        }}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        Test React Click Handler
      </button>
    </div>
  );
}

export default App;