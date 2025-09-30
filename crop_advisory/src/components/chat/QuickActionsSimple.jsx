/**
 * Simple QuickActions Component - Farming quick action buttons
 */

import React from 'react';
import styled from 'styled-components';
import { Zap, Leaf, Droplet, Bug, Thermometer } from 'lucide-react';

const ActionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ActionsTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  font-weight: 600;
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #333;
  
  &:hover {
    border-color: #007bff;
    background: #f8f9ff;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  svg {
    color: #007bff;
    flex-shrink: 0;
  }
`;

const ActionText = styled.span`
  text-align: left;
  flex: 1;
`;

const getIcon = (actionId) => {
  switch (actionId) {
    case 'crop-recommendation':
      return <Leaf size={16} />;
    case 'pest-control':
      return <Bug size={16} />;
    case 'irrigation-tips':
      return <Droplet size={16} />;
    case 'soil-health':
      return <Thermometer size={16} />;
    default:
      return <Zap size={16} />;
  }
};

const QuickActionsSimple = ({ 
  actions = [], 
  onActionClick, 
  isLoading = false 
}) => {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <ActionsContainer>
      <ActionsTitle>💡 Quick Actions</ActionsTitle>
      <ActionsGrid>
        {actions.map((action) => (
          <ActionButton
            key={action.id}
            onClick={() => onActionClick?.(action)}
            disabled={isLoading}
          >
            {getIcon(action.id)}
            <ActionText>{action.label}</ActionText>
          </ActionButton>
        ))}
      </ActionsGrid>
    </ActionsContainer>
  );
};

export default QuickActionsSimple;