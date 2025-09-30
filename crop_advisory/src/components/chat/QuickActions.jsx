/**
 * QuickActions Component - Pre-defined farming questions for easy access
 * Shows common questions users can click for quick responses
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  Zap, 
  Leaf, 
  Droplets, 
  Bug, 
  Sun, 
  Thermometer,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const QuickActionsContainer = styled.div`
  margin-bottom: 16px;
  border-radius: 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  overflow: hidden;
`;

const QuickActionsHeader = styled.div`
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #f8f9fa;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    color: #007bff;
  }
`;

const HeaderText = styled.span`
  font-weight: 500;
  color: #333;
  font-size: 14px;
`;

const ActionsGrid = styled.div`
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-size: 13px;
  color: #495057;
  
  &:hover {
    background: #e3f2fd;
    border-color: #007bff;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    
    &:hover {
      background: white;
      border-color: #dee2e6;
      transform: none;
      box-shadow: none;
    }
  }
`;

const ActionIcon = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 16px;
    height: 16px;
    color: #007bff;
  }
`;

const ActionText = styled.span`
  flex: 1;
  line-height: 1.3;
`;

// Default quick actions for farming
const defaultQuickActions = [
  {
    id: 'weather_advice',
    label: 'Weather & Crop Planning',
    description: 'Get weather-based farming advice',
    icon: Sun,
    action: 'What should I consider for crop planning based on current weather conditions?'
  },
  {
    id: 'pest_control',
    label: 'Pest Management',
    description: 'Identify and control pests',
    icon: Bug,
    action: 'How can I identify and manage common crop pests organically?'
  },
  {
    id: 'irrigation',
    label: 'Irrigation Tips',
    description: 'Water management advice',
    icon: Droplets,
    action: 'What are the best irrigation practices for water conservation?'
  },
  {
    id: 'soil_health',
    label: 'Soil Health',
    description: 'Improve soil quality',
    icon: Leaf,
    action: 'How can I improve my soil health and fertility naturally?'
  },
  {
    id: 'crop_rotation',
    label: 'Crop Rotation',
    description: 'Plan crop sequences',
    icon: Calendar,
    action: 'What is the best crop rotation strategy for sustainable farming?'
  },
  {
    id: 'yield_optimization',
    label: 'Yield Optimization',
    description: 'Maximize crop production',
    icon: TrendingUp,
    action: 'What techniques can help me maximize my crop yield sustainably?'
  },
  {
    id: 'seasonal_planning',
    label: 'Seasonal Planning',
    description: 'Plan by season',
    icon: Thermometer,
    action: 'What crops should I plant this season and when?'
  },
  {
    id: 'organic_farming',
    label: 'Organic Methods',
    description: 'Chemical-free farming',
    icon: Leaf,
    action: 'What are the best organic farming practices for beginners?'
  }
];

const QuickActions = ({ 
  actions = defaultQuickActions, 
  onActionClick, 
  isLoading = false,
  collapsed = false 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleActionClick = (action) => {
    if (isLoading || !onActionClick) return;
    
    // Call the action with either the action object or the action text
    if (typeof action === 'object' && action.action) {
      onActionClick(action.action);
    } else if (typeof action === 'string') {
      onActionClick(action);
    }
  };

  const getIconComponent = (IconComponent) => {
    // Return the icon component if it's a valid React component
    if (typeof IconComponent === 'function') {
      return <IconComponent />;
    }
    // Default fallback icon
    return <Zap />;
  };

  return (
    <QuickActionsContainer>
      <QuickActionsHeader onClick={toggleCollapse}>
        <HeaderContent>
          <Zap size={16} />
          <HeaderText>Quick Questions</HeaderText>
        </HeaderContent>
        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </QuickActionsHeader>
      
      {!isCollapsed && (
        <ActionsGrid>
          {actions.map((action, index) => (
            <ActionButton
              key={action.id || index}
              onClick={() => handleActionClick(action)}
              disabled={isLoading}
            >
              <ActionIcon>
                {getIconComponent(action.icon)}
              </ActionIcon>
              <ActionText>
                <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                  {action.label}
                </div>
                {action.description && (
                  <div style={{ fontSize: '11px', opacity: 0.7 }}>
                    {action.description}
                  </div>
                )}
              </ActionText>
            </ActionButton>
          ))}
        </ActionsGrid>
      )}
    </QuickActionsContainer>
  );
};

export default QuickActions;