import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  Wheat, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Droplets,
  Bug,
  Leaf,
  Sun,
  RefreshCw
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Loading from '../common/Loading';

const InsightsCard = styled(Card)`
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: white;
  position: relative;
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
  }
`;

const RefreshButton = styled(Button)`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const InsightsGrid = styled.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const InsightSection = styled.div`
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 1rem;
  backdrop-filter: blur(10px);
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
`;

const CropList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const CropTag = styled.div`
  background: ${props => props.suitable ? 
    'rgba(34, 197, 94, 0.3)' : 
    'rgba(239, 68, 68, 0.3)'};
  border: 1px solid ${props => props.suitable ? 
    'rgba(34, 197, 94, 0.5)' : 
    'rgba(239, 68, 68, 0.5)'};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  text-transform: capitalize;
`;

const RecommendationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const RecommendationItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.9rem;
  line-height: 1.4;
  opacity: 0.95;
`;

const RiskIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => {
    switch (props.level) {
      case 'low': return 'rgba(34, 197, 94, 0.3)';
      case 'medium': return 'rgba(251, 191, 36, 0.3)';
      case 'high': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(156, 163, 175, 0.3)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.level) {
      case 'low': return 'rgba(34, 197, 94, 0.5)';
      case 'medium': return 'rgba(251, 191, 36, 0.5)';
      case 'high': return 'rgba(239, 68, 68, 0.5)';
      default: return 'rgba(156, 163, 175, 0.5)';
    }
  }};
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  text-align: center;
  color: #ff6b6b;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  text-align: center;
  opacity: 0.8;
`;

// Get icon for risk level
const getRiskIcon = (level) => {
  switch (level?.toLowerCase()) {
    case 'low': return <CheckCircle size={16} />;
    case 'medium': return <AlertTriangle size={16} />;
    case 'high': return <AlertTriangle size={16} />;
    default: return <AlertTriangle size={16} />;
  }
};

// Get recommendations based on weather conditions
const getWeatherRecommendations = (insights) => {
  const recommendations = [];
  
  if (insights?.irrigation_need === 'high') {
    recommendations.push('💧 Increase irrigation frequency');
  }
  
  if (insights?.pest_disease_risk === 'high') {
    recommendations.push('🛡️ Monitor for pest and disease activity');
  }
  
  if (insights?.farming_activities?.includes('harvest')) {
    recommendations.push('🌾 Good conditions for harvesting');
  }
  
  if (insights?.farming_activities?.includes('planting')) {
    recommendations.push('🌱 Suitable for planting activities');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('📊 Monitor weather conditions regularly');
  }
  
  return recommendations;
};

const AgriculturalInsightsCard = ({ 
  insights, 
  isLoading, 
  error, 
  onRefresh,
  compact = false 
}) => {
  if (isLoading) {
    return (
      <InsightsCard>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <Loading color="white" />
        </div>
      </InsightsCard>
    );
  }

  if (error) {
    return (
      <InsightsCard>
        <ErrorState>
          <AlertTriangle size={48} />
          <h3 style={{ margin: '1rem 0 0.5rem 0' }}>Insights Unavailable</h3>
          <p style={{ margin: '0 0 1rem 0', opacity: 0.8 }}>{error}</p>
          <Button onClick={onRefresh} variant="secondary" size="sm">
            Try Again
          </Button>
        </ErrorState>
      </InsightsCard>
    );
  }

  if (!insights || !insights.agricultural_insights) {
    return (
      <InsightsCard>
        <EmptyState>
          <Wheat size={48} />
          <h3 style={{ margin: '1rem 0 0.5rem 0' }}>No Insights Available</h3>
          <p style={{ margin: '0 0 1rem 0' }}>Agricultural insights will appear here when weather data is available</p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="secondary" size="sm">
              Load Insights
            </Button>
          )}
        </EmptyState>
      </InsightsCard>
    );
  }

  const data = insights.agricultural_insights;
  const recommendations = getWeatherRecommendations(data);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <InsightsCard>
        <CardHeader>
          <HeaderTitle>
            <Wheat size={24} />
            <h3>Agricultural Insights</h3>
          </HeaderTitle>
          {onRefresh && (
            <RefreshButton onClick={onRefresh} size="sm">
              <RefreshCw size={16} />
            </RefreshButton>
          )}
        </CardHeader>

        <InsightsGrid>
          {/* Suitable Crops */}
          {data.suitable_crops && data.suitable_crops.length > 0 && (
            <InsightSection>
              <SectionTitle>
                <CheckCircle size={18} />
                <span>Suitable Crops</span>
              </SectionTitle>
              <CropList>
                {data.suitable_crops.map((crop, index) => (
                  <CropTag key={index} suitable={true}>
                    <Leaf size={12} />
                    {crop}
                  </CropTag>
                ))}
              </CropList>
            </InsightSection>
          )}

          {/* Unsuitable Crops */}
          {data.unsuitable_crops && data.unsuitable_crops.length > 0 && !compact && (
            <InsightSection>
              <SectionTitle>
                <AlertTriangle size={18} />
                <span>Less Suitable Crops</span>
              </SectionTitle>
              <CropList>
                {data.unsuitable_crops.slice(0, 6).map((crop, index) => (
                  <CropTag key={index} suitable={false}>
                    {crop}
                  </CropTag>
                ))}
              </CropList>
            </InsightSection>
          )}

          {/* Risk Assessment */}
          <InsightSection>
            <SectionTitle>
              <Bug size={18} />
              <span>Risk Assessment</span>
            </SectionTitle>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {data.pest_disease_risk && (
                <RiskIndicator level={data.pest_disease_risk}>
                  {getRiskIcon(data.pest_disease_risk)}
                  Pest/Disease: {data.pest_disease_risk}
                </RiskIndicator>
              )}
              {data.irrigation_need && (
                <RiskIndicator level={data.irrigation_need === 'high' ? 'high' : 'low'}>
                  <Droplets size={16} />
                  Irrigation: {data.irrigation_need}
                </RiskIndicator>
              )}
            </div>
          </InsightSection>

          {/* Recommendations */}
          <InsightSection>
            <SectionTitle>
              <TrendingUp size={18} />
              <span>Recommendations</span>
            </SectionTitle>
            <RecommendationsList>
              {recommendations.map((recommendation, index) => (
                <RecommendationItem key={index}>
                  <span style={{ minWidth: '4px', height: '4px', borderRadius: '50%', 
                                 background: 'white', marginTop: '0.5rem' }} />
                  <span>{recommendation}</span>
                </RecommendationItem>
              ))}
            </RecommendationsList>
          </InsightSection>
        </InsightsGrid>
      </InsightsCard>
    </motion.div>
  );
};

export default AgriculturalInsightsCard;