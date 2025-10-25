/**
 * Growing Guide Page
 * AI-powered comprehensive growing guides using n8n workflow
 * Integrates weather, soil data, and expert AI recommendations
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sprout, 
  MapPin, 
  Calendar, 
  Droplets,
  Sun,
  Leaf,
  TrendingUp,
  BookOpen,
  Download,
  Share2,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Phone,
  Video,
  FileText,
  Loader,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';
import { getUserGuides } from '../services/growingGuideService';

// ==================== STYLED COMPONENTS ====================

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e8 100%);
  padding: 2rem 1rem;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

// Header Section
const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const MainTitle = styled(motion.h1)`
  color: #2d5016;
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;

  svg {
    color: #4caf50;
  }

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled(motion.p)`
  color: #5d7c47;
  font-size: 1.2rem;
  margin-bottom: 2rem;
  line-height: 1.6;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
`;

// Form Section
const FormCard = styled(Card)`
  background: white;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 2px solid #e8f5e8;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const FormTitle = styled.h2`
  color: #2d5016;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: #4caf50;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: #2d5016;
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    width: 16px;
    height: 16px;
    color: #4caf50;
  }
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #d4e7d4;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;

  &:focus {
    outline: none;
    border-color: #4caf50;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 2px solid #d4e7d4;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #4caf50;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const GenerateButton = styled.button`
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  border: none;
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 200px;
  justify-content: center;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(76, 175, 80, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

// Guide Display Section
const GuideContainer = styled(motion.div)`
  margin-top: 2rem;
`;

const GuideHeader = styled.div`
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  padding: 2rem;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 10px 30px rgba(76, 175, 80, 0.2);
`;

const GuideTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg {
    width: 32px;
    height: 32px;
  }
`;

const GuideMetaInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  opacity: 0.95;

  svg {
    width: 18px;
    height: 18px;
  }
`;

// Summary Cards
const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
  background: white;
  border-bottom: 1px solid #e8f5e8;
`;

const SummaryCard = styled.div`
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fdf9 0%, #e8f5e8 100%);
  border-radius: 12px;
  border: 2px solid #d4e7d4;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
  }
`;

const SummaryLabel = styled.div`
  color: #5d7c47;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    width: 16px;
    height: 16px;
    color: #4caf50;
  }
`;

const SummaryValue = styled.div`
  color: #2d5016;
  font-size: 1.5rem;
  font-weight: 700;
`;

// Timeline Section
const TimelineContainer = styled.div`
  padding: 2rem;
  background: white;
  border-bottom: 1px solid #e8f5e8;
`;

const TimelineTitle = styled.h3`
  color: #2d5016;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: #4caf50;
  }
`;

const TimelineGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const TimelineItem = styled.div`
  padding: 1rem;
  background: #f8fdf9;
  border-radius: 12px;
  border-left: 4px solid #4caf50;
`;

const TimelineLabel = styled.div`
  color: #5d7c47;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TimelineValue = styled.div`
  color: #2d5016;
  font-size: 1rem;
  font-weight: 600;
`;

// Sections Display
const SectionsContainer = styled.div`
  padding: 2rem;
  background: white;
`;

const SectionItem = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8fdf9;
  border-radius: 12px;
  border: 1px solid #e8f5e8;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: ${props => props.$expanded ? '1rem' : '0'};
`;

const SectionTitle = styled.h4`
  color: #2d5016;
  font-size: 1.3rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: #4caf50;
    width: 20px;
    height: 20px;
  }
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: #4caf50;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(76, 175, 80, 0.1);
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const SectionContent = styled(motion.div)`
  color: #2d5016;
  font-size: 1rem;
  line-height: 1.8;
  white-space: pre-wrap;

  ul, ol {
    margin-left: 1.5rem;
    margin-top: 0.5rem;
  }

  li {
    margin-bottom: 0.5rem;
  }

  strong {
    color: #1b3409;
    font-weight: 700;
  }
`;

// Resources Section
const ResourcesContainer = styled.div`
  padding: 2rem;
  background: linear-gradient(135deg, #f8fdf9 0%, #e8f5e8 100%);
  border-radius: 0 0 16px 16px;
`;

const ResourcesTitle = styled.h3`
  color: #2d5016;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: #4caf50;
  }
`;

const ResourcesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ResourceCard = styled.a`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  border: 2px solid #d4e7d4;
  text-decoration: none;
  transition: all 0.3s ease;
  color: #2d5016;

  &:hover {
    border-color: #4caf50;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(76, 175, 80, 0.15);
  }

  svg {
    width: 24px;
    height: 24px;
    color: #4caf50;
    flex-shrink: 0;
  }
`;

const ResourceText = styled.div`
  flex: 1;
`;

const ResourceLabel = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
`;

const ResourceDescription = styled.div`
  font-size: 0.85rem;
  color: #5d7c47;
`;

// Helpline Section
const HelplineContainer = styled.div`
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  border: 2px solid #4caf50;
`;

const HelplineTitle = styled.h4`
  color: #2d5016;
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: #4caf50;
  }
`;

const HelplineGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const HelplineItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fdf9;
  border-radius: 8px;

  svg {
    color: #4caf50;
    width: 20px;
    height: 20px;
  }
`;

const HelplineInfo = styled.div``;

const HelplineLabel = styled.div`
  color: #5d7c47;
  font-size: 0.85rem;
  font-weight: 600;
`;

const HelplineNumber = styled.div`
  color: #2d5016;
  font-size: 1rem;
  font-weight: 700;
`;

// Loading State
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1.5rem;
`;

const LoadingText = styled.p`
  color: #5d7c47;
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
`;

const LoadingSteps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
`;

const LoadingStep = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 8px;
  border: 2px solid ${props => props.$active ? '#4caf50' : '#e8f5e8'};
  transition: all 0.3s ease;

  svg {
    width: 18px;
    height: 18px;
    color: ${props => props.$active ? '#4caf50' : '#d4e7d4'};
  }

  span {
    color: ${props => props.$active ? '#2d5016' : '#5d7c47'};
    font-weight: ${props => props.$active ? '600' : '500'};
    font-size: 0.9rem;
  }
`;

// ==================== COMPONENT ====================

const GrowingGuidePage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get guide from navigation state (passed from CropPredictionForm)
  const navigationGuide = location.state?.guide;
  const cropNameFromNav = location.state?.cropName;
  const fromPrediction = location.state?.fromPrediction;

  // Guide state
  const [guide, setGuide] = useState(navigationGuide || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  // Load most recent guide if no navigation guide provided
  useEffect(() => {
    const loadRecentGuide = async () => {
      if (!navigationGuide && !guide) {
        try {
          setIsLoading(true);
          console.log('🔄 Loading most recent growing guide...');
          const recentGuides = await getUserGuides(1); // Get most recent guide
          
          console.log('📦 Recent guides response:', recentGuides);
          
          if (recentGuides && recentGuides.length > 0) {
            // Guide data is at root level, not nested in guide_data
            console.log('✅ Setting guide:', recentGuides[0]);
            setGuide(recentGuides[0]);
            toast.success('Loaded your most recent growing guide');
          } else {
            toast.error('No growing guides found. Please generate a guide from crop prediction first.');
            navigate('/crop-advisory');
          }
        } catch (err) {
          console.error('❌ Error loading recent guide:', err);
          toast.error('Failed to load growing guide');
          navigate('/crop-advisory');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadRecentGuide();
  }, [navigationGuide, guide, navigate]);

  // Set guide from navigation state
  useEffect(() => {
    if (navigationGuide) {
      setGuide(navigationGuide);
      toast.success(`Growing guide for ${cropNameFromNav} loaded successfully!`);
    }
  }, [navigationGuide, cropNameFromNav]);

  // Toggle section expansion
  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Expand all sections
  const expandAllSections = () => {
    const allExpanded = {};
    guide?.sections?.forEach((_, index) => {
      allExpanded[index] = true;
    });
    setExpandedSections(allExpanded);
  };

  // Collapse all sections
  const collapseAllSections = () => {
    setExpandedSections({});
  };

  // Navigate back to crop advisory page
  const handleBackToAdvisory = () => {
    navigate('/crop-advisory');
  };

  // Loading state while checking for guide
  if (!guide && !navigationGuide) {
    return (
      <PageContainer>
        <Container>
          <Loading size="lg" />
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Container>
        {/* Header */}
        <Header>
          <MainTitle
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Sprout size={40} />
            Growing Guide Generator
          </MainTitle>
          <Subtitle
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Get comprehensive, AI-powered growing guides tailored to your location, 
            soil type, and seasonal conditions
          </Subtitle>
        </Header>

        {/* Back Button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Button variant="secondary" onClick={handleBackToAdvisory}>
            ← Back to Crop Advisory
          </Button>
        </div>

        {/* Guide Display (now from navigation state, no form needed) */}
        {guide && (
          <GuideContainer
            id="guide-display"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Guide Header */}
            <GuideHeader>
              <GuideTitle>
                <Sprout />
                Growing Guide for {guide.cropName}
              </GuideTitle>
              <GuideMetaInfo>
                <MetaItem>
                  <MapPin />
                  {guide.location}
                </MetaItem>
                <MetaItem>
                  <Calendar />
                  {guide.season} Season
                </MetaItem>
                <MetaItem>
                  <Clock />
                  Generated: {new Date(guide.generatedAt).toLocaleDateString()}
                </MetaItem>
              </GuideMetaInfo>
            </GuideHeader>

            {/* Summary Cards */}
            <SummaryGrid>
              <SummaryCard>
                <SummaryLabel>
                  <Sun />
                  Climate Suitability
                </SummaryLabel>
                <SummaryValue style={{ 
                  color: guide.summary.climateSuitability?.toLowerCase().includes('excellent') ? '#4caf50' : 
                         guide.summary.climateSuitability?.toLowerCase().includes('good') ? '#8bc34a' : 
                         guide.summary.climateSuitability?.toLowerCase().includes('moderate') ? '#ffa726' : '#f44336'
                }}>
                  {guide.summary.climateSuitability}
                </SummaryValue>
              </SummaryCard>

              <SummaryCard>
                <SummaryLabel>
                  <Leaf />
                  Soil Quality
                </SummaryLabel>
                <SummaryValue style={{ 
                  color: guide.summary.soilQuality?.toLowerCase().includes('excellent') ? '#4caf50' : 
                         guide.summary.soilQuality?.toLowerCase().includes('good') ? '#8bc34a' : 
                         guide.summary.soilQuality?.toLowerCase().includes('moderate') ? '#ffa726' : '#f44336'
                }}>
                  {guide.summary.soilQuality}
                </SummaryValue>
              </SummaryCard>

              <SummaryCard>
                <SummaryLabel>
                  <TrendingUp />
                  Estimated Yield
                </SummaryLabel>
                <SummaryValue style={{ fontSize: '1.2rem' }}>
                  {guide.summary.estimatedYield}
                </SummaryValue>
              </SummaryCard>

              <SummaryCard>
                <SummaryLabel>
                  <Clock />
                  Total Duration
                </SummaryLabel>
                <SummaryValue style={{ fontSize: '1.2rem' }}>
                  {guide.summary.totalDuration}
                </SummaryValue>
              </SummaryCard>
            </SummaryGrid>

            {/* Timeline */}
            <TimelineContainer>
              <TimelineTitle>
                <Calendar />
                Growing Timeline
              </TimelineTitle>
              <TimelineGrid>
                <TimelineItem>
                  <TimelineLabel>Land Preparation</TimelineLabel>
                  <TimelineValue>{guide.timeline.landPreparation}</TimelineValue>
                </TimelineItem>
                <TimelineItem>
                  <TimelineLabel>Sowing Period</TimelineLabel>
                  <TimelineValue>{guide.timeline.sowingPeriod}</TimelineValue>
                </TimelineItem>
                <TimelineItem>
                  <TimelineLabel>First Harvest</TimelineLabel>
                  <TimelineValue>{guide.timeline.firstHarvest}</TimelineValue>
                </TimelineItem>
                <TimelineItem>
                  <TimelineLabel>Total Duration</TimelineLabel>
                  <TimelineValue>{guide.timeline.totalDuration}</TimelineValue>
                </TimelineItem>
              </TimelineGrid>
            </TimelineContainer>

            {/* Sections */}
            <SectionsContainer>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ 
                  color: '#2d5016',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <BookOpen size={24} style={{ color: '#4caf50' }} />
                  Detailed Growing Instructions
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={expandAllSections}
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={collapseAllSections}
                  >
                    Collapse All
                  </Button>
                </div>
              </div>

              {guide.sections?.map((section, index) => (
                <SectionItem key={index}>
                  <SectionHeader 
                    $expanded={expandedSections[index]}
                    onClick={() => toggleSection(index)}
                  >
                    <SectionTitle>
                      <CheckCircle />
                      {section.title}
                    </SectionTitle>
                    <ExpandButton type="button">
                      {expandedSections[index] ? (
                        <ChevronUp />
                      ) : (
                        <ChevronDown />
                      )}
                    </ExpandButton>
                  </SectionHeader>
                  
                  <AnimatePresence>
                    {expandedSections[index] && (
                      <SectionContent
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {section.content}
                      </SectionContent>
                    )}
                  </AnimatePresence>
                </SectionItem>
              ))}
            </SectionsContainer>

            {/* Resources */}
            {guide.resources && (
              <ResourcesContainer>
                <ResourcesTitle>
                  <ExternalLink />
                  Helpful Resources
                </ResourcesTitle>

                <ResourcesGrid>
                  {guide.resources.videoTutorials && (
                    <ResourceCard
                      href={guide.resources.videoTutorials}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Video />
                      <ResourceText>
                        <ResourceLabel>Video Tutorials</ResourceLabel>
                        <ResourceDescription>Watch farming guides</ResourceDescription>
                      </ResourceText>
                      <ExternalLink size={18} />
                    </ResourceCard>
                  )}

                  {guide.resources.governmentSchemes && (
                    <ResourceCard
                      href={guide.resources.governmentSchemes}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText />
                      <ResourceText>
                        <ResourceLabel>Government Schemes</ResourceLabel>
                        <ResourceDescription>Farming subsidies & support</ResourceDescription>
                      </ResourceText>
                      <ExternalLink size={18} />
                    </ResourceCard>
                  )}

                  {guide.resources.marketPrices && (
                    <ResourceCard
                      href={guide.resources.marketPrices}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <TrendingUp />
                      <ResourceText>
                        <ResourceLabel>Market Prices</ResourceLabel>
                        <ResourceDescription>Check current crop prices</ResourceDescription>
                      </ResourceText>
                      <ExternalLink size={18} />
                    </ResourceCard>
                  )}

                  {guide.resources.weatherUpdates && (
                    <ResourceCard
                      href={guide.resources.weatherUpdates}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Sun />
                      <ResourceText>
                        <ResourceLabel>Weather Updates</ResourceLabel>
                        <ResourceDescription>Daily weather forecasts</ResourceDescription>
                      </ResourceText>
                      <ExternalLink size={18} />
                    </ResourceCard>
                  )}

                  {guide.resources.seedSuppliers && (
                    <ResourceCard
                      href={guide.resources.seedSuppliers}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Sprout />
                      <ResourceText>
                        <ResourceLabel>Seed Suppliers</ResourceLabel>
                        <ResourceDescription>Find quality seeds</ResourceDescription>
                      </ResourceText>
                      <ExternalLink size={18} />
                    </ResourceCard>
                  )}

                  {guide.resources.soilTesting && (
                    <ResourceCard
                      href={guide.resources.soilTesting}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Leaf />
                      <ResourceText>
                        <ResourceLabel>Soil Testing</ResourceLabel>
                        <ResourceDescription>Test your soil health</ResourceDescription>
                      </ResourceText>
                      <ExternalLink size={18} />
                    </ResourceCard>
                  )}
                </ResourcesGrid>

                {/* Helpline */}
                {guide.resources.helpline && (
                  <HelplineContainer>
                    <HelplineTitle>
                      <Phone />
                      Emergency Helplines
                    </HelplineTitle>
                    <HelplineGrid>
                      {guide.resources.helpline.kisanCallCenter && (
                        <HelplineItem>
                          <Phone />
                          <HelplineInfo>
                            <HelplineLabel>Kisan Call Center</HelplineLabel>
                            <HelplineNumber>
                              {guide.resources.helpline.kisanCallCenter}
                            </HelplineNumber>
                          </HelplineInfo>
                        </HelplineItem>
                      )}
                      {guide.resources.helpline.soilHealthHelpline && (
                        <HelplineItem>
                          <Phone />
                          <HelplineInfo>
                            <HelplineLabel>Soil Health Helpline</HelplineLabel>
                            <HelplineNumber>
                              {guide.resources.helpline.soilHealthHelpline}
                            </HelplineNumber>
                          </HelplineInfo>
                        </HelplineItem>
                      )}
                      {guide.resources.helpline.weatherInfoHelpline && (
                        <HelplineItem>
                          <Phone />
                          <HelplineInfo>
                            <HelplineLabel>Weather Info</HelplineLabel>
                            <HelplineNumber>
                              {guide.resources.helpline.weatherInfoHelpline}
                            </HelplineNumber>
                          </HelplineInfo>
                        </HelplineItem>
                      )}
                    </HelplineGrid>
                  </HelplineContainer>
                )}
              </ResourcesContainer>
            )}
          </GuideContainer>
        )}
      </Container>
    </PageContainer>
  );
};

export default GrowingGuidePage;
