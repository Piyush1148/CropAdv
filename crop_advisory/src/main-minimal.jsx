import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

console.log('🔥 main-minimal.jsx loaded');

function MinimalApp() {
  console.log('🎯 MinimalApp component rendering');
  
  return (
    <div style={{
      padding: '40px',
      backgroundColor: '#00ff00',
      color: '#000',
      fontSize: '24px',
      fontWeight: 'bold',
      textAlign: 'center',
      border: '5px solid #ff0000'
    }}>
      ✅ REACT IS WORKING!
      <br />
      Current time: {new Date().toLocaleTimeString()}
    </div>
  );
}

console.log('🚀 About to create root and render...');

try {
  const rootElement = document.getElementById('root');
  console.log('📍 Root element:', rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found!');
  }
  
  const root = createRoot(rootElement);
  console.log('✅ Root created successfully');
  
  root.render(
    <StrictMode>
      <MinimalApp />
    </StrictMode>
  );
  
  console.log('✅ Render called successfully');
} catch (error) {
  console.error('❌ Critical error in main.jsx:', error);
  throw error;
}