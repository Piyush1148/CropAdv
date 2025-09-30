import React, { useState } from 'react';
import styled from 'styled-components';
import { X, Eye, EyeOff } from 'lucide-react';

const DebugContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 20px;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  z-index: 999999;
  max-width: 300px;
  display: ${props => props.visible ? 'block' : 'none'};
`;

const DebugToggle = styled.button`
  position: fixed;
  top: 20px;
  left: 20px;
  background: #ff4444;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  z-index: 1000000;
  font-size: 12px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
`;

const DebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);

  const checkForFixedElements = () => {
    const viewportWidth = window.innerWidth;
    const problematicElements = Array.from(document.querySelectorAll('*')).filter(el => {
      try {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        return (
          // Fixed elements on the right
          (style.position === 'fixed' && (style.right === '0px' || style.right === '0')) ||
          // Elements extending beyond 85% of viewport width
          (rect.right > viewportWidth * 0.85)
        ) && 
        !el.className.includes('debug') &&
        !el.className.includes('mobile-menu') &&
        !el.className.includes('dropdown') &&
        !el.closest('#root');
      } catch (error) {
        return false;
      }
    });
    return problematicElements;
  };

  const forceRemoveAll = () => {
    const elements = checkForFixedElements();
    elements.forEach(el => {
      console.log('Force removing element:', el);
      el.remove();
    });
    setIsVisible(false);
    // Refresh the page to ensure clean state
    setTimeout(() => window.location.reload(), 1000);
  };

  const problematicElements = isVisible ? checkForFixedElements() : [];

  return (
    <>
      <DebugToggle onClick={() => setIsVisible(!isVisible)}>
        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        Debug
      </DebugToggle>
      
      <DebugContainer visible={isVisible}>
        <CloseButton onClick={() => setIsVisible(false)}>
          <X size={16} />
        </CloseButton>
        
        <h3 style={{ margin: '0 0 10px 0', color: '#ff4444' }}>
          Debug Panel - Space-Taking Elements
        </h3>
        
        <div>
          <strong>Found {problematicElements.length} problematic elements:</strong>
          {problematicElements.map((el, index) => {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            return (
              <div key={index} style={{ margin: '5px 0', padding: '5px', background: 'rgba(255,255,255,0.1)' }}>
                <div>Tag: {el.tagName}</div>
                <div>Class: {el.className || 'none'}</div>
                <div>ID: {el.id || 'none'}</div>
                <div>Position: {style.position}</div>
                <div>Right: {rect.right.toFixed(0)}px (viewport: {window.innerWidth}px)</div>
                <div>Width: {rect.width.toFixed(0)}px</div>
              </div>
            );
          })}
        </div>
        
        <button 
          onClick={forceRemoveAll}
          style={{ 
            background: '#ff4444', 
            color: 'white', 
            border: 'none', 
            padding: '8px 12px', 
            borderRadius: '4px', 
            cursor: 'pointer',
            width: '100%',
            marginTop: '10px'
          }}
        >
          FORCE REMOVE ALL ({problematicElements.length})
        </button>
        
        <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.1)' }}>
          <strong>Viewport Info:</strong>
          <div>Window Width: {window.innerWidth}px</div>
          <div>85% Threshold: {(window.innerWidth * 0.85).toFixed(0)}px</div>
        </div>
      </DebugContainer>
    </>
  );
};

export default DebugPanel;