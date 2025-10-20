/**
 * AI Assistant Page with Themed Chat Interface
 */

import React from 'react';
import ThemedAIAssistant from '../components/chat/ThemedAIAssistant';
import ErrorBoundary from '../components/debug/ErrorBoundary';

const RobustAIAssistant = () => {
  // Component renders normally - logging removed to prevent console spam

  return (
    <ErrorBoundary>
      <div style={{ 
        width: '100%', 
        maxWidth: '100vw',
        height: 'calc(100vh - 80px)', // Account for header height
        margin: 0, 
        padding: 0,
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        <ThemedAIAssistant />
      </div>
    </ErrorBoundary>
  );
};

export default RobustAIAssistant;