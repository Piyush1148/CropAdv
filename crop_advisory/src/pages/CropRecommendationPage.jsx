/**
 * Crop Recommendation Page
 * Main page for ML-powered crop recommendations
 */

import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Leaf, TrendingUp, Users, Award } from 'lucide-react';
import CropPredictionForm from '../components/CropPredictionForm';
import { usePredictionHistory, useApiHealth } from '../hooks/useApi';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e8 100%);
  padding: 2rem 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const MainTitle = styled(motion.h1)`
  color: #2d5016;
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled(motion.p)`
  color: #5d7c47;
  font-size: 1.2rem;
  margin-bottom: 2rem;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const StatsContainer = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  border: 2px solid #e8f5e8;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
`;

const StatIcon = styled.div`
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  
  svg {
    width: 28px;
    height: 28px;
  }
`;

const StatValue = styled.h3`
  color: #2d5016;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.p`
  color: #5d7c47;
  font-size: 0.9rem;
  font-weight: 500;
`;

const FormSection = styled.div`
  margin-bottom: 3rem;
`;

const HistorySection = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  color: #2d5016;
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const HistoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const HistoryCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #4caf50;
`;

const HistoryHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CropName = styled.h4`
  color: #2d5016;
  font-size: 1.2rem;
  font-weight: 600;
  text-transform: capitalize;
`;

const HistoryDate = styled.span`
  color: #5d7c47;
  font-size: 0.9rem;
`;

const Confidence = styled.div`
  color: #4caf50;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const InputSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #666;
`;

const StatusIndicator = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: ${props => props.healthy ? '#4caf50' : '#f44336'};
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  z-index: 1000;
  
  &::before {
    content: '${props => props.healthy ? '🟢' : '🔴'}';
    margin-right: 6px;
  }
`;

const CropRecommendationPage = () => {
  const { history, isLoading: historyLoading } = usePredictionHistory(5);
  const { isHealthy } = useApiHealth();

  const stats = [
    {
      icon: <Award />,
      value: "99.32%",
      label: "ML Model Accuracy"
    },
    {
      icon: <Leaf />,
      value: "22",
      label: "Supported Crops"
    },
    {
      icon: <TrendingUp />,
      value: history?.length || "0",
      label: "Your Predictions"
    },
    {
      icon: <Users />,
      value: "0+",
      label: "Farmers Helped"
    }
  ];

  return (
    <PageContainer>
      <StatusIndicator healthy={isHealthy}>
        API {isHealthy ? 'Connected' : 'Disconnected'}
      </StatusIndicator>

      <Header>
        <MainTitle
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          AI-Powered Crop Recommendations
        </MainTitle>
        
        <Subtitle
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Get personalized crop recommendations based on your soil conditions and environmental factors using our advanced machine learning model
        </Subtitle>
      </Header>

      <StatsContainer
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {stats.map((stat, index) => (
          <StatCard key={index}>
            <StatIcon>
              {stat.icon}
            </StatIcon>
            <StatValue>{stat.value}</StatValue>
            <StatLabel>{stat.label}</StatLabel>
          </StatCard>
        ))}
      </StatsContainer>

      <FormSection>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <CropPredictionForm />
        </motion.div>
      </FormSection>

      {history && history.length > 0 && (
        <HistorySection>
          <SectionTitle>Recent Predictions</SectionTitle>
          <HistoryGrid>
            {history.map((prediction, index) => (
              <motion.div
                key={prediction.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <HistoryCard>
                  <HistoryHeader>
                    <CropName>
                      {typeof prediction.prediction === 'string' 
                        ? prediction.prediction 
                        : prediction.prediction?.crop || prediction.crop || 'Unknown'}
                    </CropName>
                    <HistoryDate>
                      {prediction.created_at ? new Date(prediction.created_at).toLocaleDateString() : 'Recent'}
                    </HistoryDate>
                  </HistoryHeader>
                  <Confidence>
                    Confidence: {(prediction.confidence * 100 || 
                      prediction.prediction?.confidence * 100 || 
                      prediction.probability || 95).toFixed(1)}%
                  </Confidence>
                  {prediction.input_data && (
                    <InputSummary>
                      <div>N: {prediction.input_data.N}</div>
                      <div>P: {prediction.input_data.P}</div>
                      <div>K: {prediction.input_data.K}</div>
                      <div>Temp: {prediction.input_data.temperature}°C</div>
                      <div>pH: {prediction.input_data.ph}</div>
                      <div>Rain: {prediction.input_data.rainfall}mm</div>
                    </InputSummary>
                  )}
                </HistoryCard>
              </motion.div>
            ))}
          </HistoryGrid>
        </HistorySection>
      )}
    </PageContainer>
  );
};

export default CropRecommendationPage;