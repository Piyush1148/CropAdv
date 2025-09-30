/**
 * AI Assistant Page - Main page for AI farming assistant
 * Provides comprehensive AI-powered farming advice
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import AdvancedChatInterface from '../components/chat/AdvancedChatInterface';
import { 
  Bot, 
  Sparkles, 
  Users, 
  Clock, 
  TrendingUp,
  Leaf,
  Shield,
  Zap
} from 'lucide-react';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
  padding-top: 20px;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  
  @media (max-width: 768px) {
    font-size: 2rem;
    flex-direction: column;
    gap: 8px;
  }
`;

const PageSubtitle = styled.p`
  font-size: 1.1rem;
  color: #6c757d;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.5;
`;

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const ChatSection = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  min-height: 600px;
`;

const SidebarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  @media (max-width: 1024px) {
    display: none; /* Hide sidebar on mobile */
  }
`;

const InfoCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  border-left: 4px solid ${props => props.color || '#007bff'};
`;

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CardContent = styled.div`
  font-size: 14px;
  color: #6c757d;
  line-height: 1.5;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #495057;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f1f3f4;
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.span`
  font-size: 13px;
  color: #6c757d;
`;

const StatValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;

const MobileInfo = styled.div`
  display: none;
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  
  @media (max-width: 1024px) {
    display: block;
  }
`;

const AIAssistant = () => {
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  const handleSessionChange = (sessionId) => {
    setCurrentSessionId(sessionId);
  };

  const features = [
    { icon: Leaf, text: 'Crop management & planning advice' },
    { icon: Shield, text: 'Pest & disease identification' },
    { icon: TrendingUp, text: 'Yield optimization strategies' },
    { icon: Zap, text: 'Real-time farming solutions' }
  ];

  const stats = [
    { label: 'Response Time', value: '< 2 seconds' },
    { label: 'Accuracy', value: '95%+' },
    { label: 'Topics Covered', value: '50+' },
    { label: 'Available 24/7', value: 'Yes' }
  ];

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <Bot size={40} color="#007bff" />
          AI Farming Assistant
          <Sparkles size={24} color="#ffd700" />
        </PageTitle>
        <PageSubtitle>
          Get instant, expert farming advice powered by advanced AI. 
          Ask questions about crops, pests, soil, irrigation, and more.
        </PageSubtitle>
      </PageHeader>

      {/* Mobile-only info section */}
      <MobileInfo>
        <CardTitle>
          <Bot size={16} />
          AI-Powered Farming Help
        </CardTitle>
        <CardContent>
          Ask me anything about farming! I can help with crop planning, 
          pest control, soil health, irrigation, and much more.
        </CardContent>
      </MobileInfo>

      <MainContent>
        <ChatSection>
          <AdvancedChatInterface
            sessionId={currentSessionId}
            onSessionChange={handleSessionChange}
            height="600px"
            showQuickActions={true}
            showHeader={true}
            showSidebar={true}
          />
        </ChatSection>

        <SidebarSection>
          {/* Features Card */}
          <InfoCard color="#28a745">
            <CardTitle>
              <Sparkles size={16} />
              What I Can Help With
            </CardTitle>
            <CardContent>
              <FeatureList>
                {features.map((feature, index) => (
                  <FeatureItem key={index}>
                    <feature.icon size={14} color="#28a745" />
                    {feature.text}
                  </FeatureItem>
                ))}
              </FeatureList>
            </CardContent>
          </InfoCard>

          {/* Stats Card */}
          <InfoCard color="#007bff">
            <CardTitle>
              <TrendingUp size={16} />
              AI Performance
            </CardTitle>
            <CardContent>
              {stats.map((stat, index) => (
                <StatItem key={index}>
                  <StatLabel>{stat.label}</StatLabel>
                  <StatValue>{stat.value}</StatValue>
                </StatItem>
              ))}
            </CardContent>
          </InfoCard>

          {/* Tips Card */}
          <InfoCard color="#ffc107">
            <CardTitle>
              <Users size={16} />
              Usage Tips
            </CardTitle>
            <CardContent>
              <FeatureList>
                <FeatureItem>
                  <Clock size={14} color="#ffc107" />
                  Be specific with your questions
                </FeatureItem>
                <FeatureItem>
                  <Leaf size={14} color="#ffc107" />
                  Mention your crop type & location
                </FeatureItem>
                <FeatureItem>
                  <Shield size={14} color="#ffc107" />
                  Include symptoms for pest issues
                </FeatureItem>
                <FeatureItem>
                  <Zap size={14} color="#ffc107" />
                  Ask follow-up questions
                </FeatureItem>
              </FeatureList>
            </CardContent>
          </InfoCard>
        </SidebarSection>
      </MainContent>
    </PageContainer>
  );
};

export default AIAssistant;