import React from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from '../../styles/theme';
import { Leaf, Sprout } from 'lucide-react';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const bounce = keyframes`
  0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
  40%, 43% { transform: translateY(-8px); }
`;

// 🌾 NEW: Animations for Dashboard Loader
const leafFloat = keyframes`
  0%, 100% { 
    transform: translateY(0) rotate(0deg);
  }
  25% { 
    transform: translateY(-10px) rotate(5deg);
  }
  50% { 
    transform: translateY(-15px) rotate(0deg);
  }
  75% { 
    transform: translateY(-10px) rotate(-5deg);
  }
`;

const leafPulse = keyframes`
  0%, 100% { 
    transform: scale(1);
    opacity: 1;
  }
  50% { 
    transform: scale(1.1);
    opacity: 0.8;
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// 🌱 NEW: Animations for Growing Guide Loader
const plantGrow = keyframes`
  0% {
    transform: scaleY(0);
    transform-origin: bottom;
  }
  50% {
    transform: scaleY(1);
    transform-origin: bottom;
  }
  100% {
    transform: scaleY(1);
    transform-origin: bottom;
  }
`;

const leafSprout = keyframes`
  0% {
    transform: scale(0) rotate(-45deg);
    opacity: 0;
  }
  50% {
    transform: scale(0) rotate(-45deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
`;

const sunRise = keyframes`
  0% {
    transform: translateY(30px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
`;

const waterDrop = keyframes`
  0% {
    transform: translateY(-20px);
    opacity: 0;
  }
  50% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(10px);
    opacity: 0;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[4]};
  padding: ${theme.spacing[8]};
  
  ${props => props.$fullScreen && `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
    z-index: ${theme.zIndex.modal};
  `}
  
  ${props => props.$overlay && `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    z-index: ${theme.zIndex.overlay};
  `}
`;

const SpinnerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Spinner = styled.div`
  width: ${props => {
    switch (props.$size) {
      case 'sm': return '1rem';
      case 'lg': return '2.5rem';
      case 'xl': return '3rem';
      default: return '1.5rem';
    }
  }};
  height: ${props => {
    switch (props.$size) {
      case 'sm': return '1rem';
      case 'lg': return '2.5rem';
      case 'xl': return '3rem';
      default: return '1.5rem';
    }
  }};
  border: 2px solid ${theme.colors.border.light};
  border-top: 2px solid ${theme.colors.primary[600]};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const DotsContainer = styled.div`
  display: flex;
  gap: ${theme.spacing[1]};
`;

const Dot = styled.div`
  width: 0.5rem;
  height: 0.5rem;
  background-color: ${theme.colors.primary[600]};
  border-radius: 50%;
  animation: ${bounce} 1.4s infinite ease-in-out;
  animation-delay: ${props => props.$delay || '0s'};
`;

const PulseContainer = styled.div`
  display: flex;
  gap: ${theme.spacing[2]};
`;

const PulseBar = styled.div`
  width: 4px;
  height: ${props => {
    switch (props.$size) {
      case 'sm': return '1rem';
      case 'lg': return '2rem';
      default: return '1.5rem';
    }
  }};
  background-color: ${theme.colors.primary[600]};
  border-radius: 2px;
  animation: ${pulse} 1.2s infinite ease-in-out;
  animation-delay: ${props => props.$delay || '0s'};
`;

const LoadingText = styled.p`
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  text-align: center;
  margin-top: ${theme.spacing[2]};
  
  ${props => props.$size === 'lg' && `
    font-size: ${theme.typography.fontSize.base};
  `}
`;

const ProgressBar = styled.div`
  width: 100%;
  max-width: 300px;
  height: 4px;
  background-color: ${theme.colors.border.light};
  border-radius: ${theme.borderRadius.full};
  overflow: hidden;
  margin-top: ${theme.spacing[4]};
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, ${theme.colors.primary[500]}, ${theme.colors.primary[600]});
  border-radius: ${theme.borderRadius.full};
  transition: width 0.3s ease;
  width: ${props => props.$progress || 0}%;
`;

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  margin-top: ${theme.spacing[4]};
`;

const Step = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.sm};
  
  ${props => props.$active && `
    color: ${theme.colors.primary[600]};
  `}
  
  ${props => props.$completed && `
    color: ${theme.colors.success};
  `}
`;

const StepIcon = styled.div`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${theme.typography.fontSize.xs};
  font-weight: ${theme.typography.fontWeight.semibold};
  
  ${props => props.$active && `
    background-color: ${theme.colors.primary[100]};
    color: ${theme.colors.primary[700]};
  `}
  
  ${props => props.$completed && `
    background-color: ${theme.colors.success};
    color: white;
  `}
  
  ${props => !props.$active && !props.$completed && `
    background-color: ${theme.colors.border.light};
    color: ${theme.colors.text.tertiary};
  `}
`;

// 🌾 NEW: Dashboard Loader Styled Components
const DashboardLoaderContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e8 100%);
  z-index: ${theme.zIndex.modal};
  animation: ${fadeInUp} 0.3s ease-out;
`;

const LogoContainer = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
`;

const LeafIconWrapper = styled.div`
  position: absolute;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  border-radius: 50%;
  box-shadow: 0 10px 40px rgba(76, 175, 80, 0.3);
  animation: ${leafPulse} 2s ease-in-out infinite;
  
  svg {
    width: 48px;
    height: 48px;
    color: white;
    animation: ${leafFloat} 3s ease-in-out infinite;
  }
`;

const OrbitRing = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid #4caf50;
  border-radius: 50%;
  border-top-color: transparent;
  border-right-color: transparent;
  animation: ${spin} 2s linear infinite;
  opacity: 0.3;
`;

const LoadingTitle = styled.h2`
  color: #2d5016;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-align: center;
  animation: ${fadeInUp} 0.5s ease-out 0.2s both;
`;

const LoadingSubtitle = styled.p`
  color: #5d7c47;
  font-size: 1rem;
  text-align: center;
  margin-bottom: 2rem;
  animation: ${fadeInUp} 0.5s ease-out 0.3s both;
`;

const DotsLoader = styled.div`
  display: flex;
  gap: 0.5rem;
  animation: ${fadeInUp} 0.5s ease-out 0.4s both;
`;

const DotLoader = styled.div`
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  border-radius: 50%;
  animation: ${bounce} 1.4s infinite ease-in-out;
  animation-delay: ${props => props.$delay || '0s'};
`;

const LoadingStats = styled.div`
  margin-top: 2rem;
  display: flex;
  gap: 2rem;
  animation: ${fadeInUp} 0.5s ease-out 0.5s both;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  
  .icon {
    width: 24px;
    height: 24px;
    color: #4caf50;
  }
  
  .label {
    font-size: 0.75rem;
    color: #5d7c47;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const ShimmerBar = styled.div`
  width: 200px;
  height: 4px;
  background: linear-gradient(
    90deg,
    #e8f5e8 0%,
    #4caf50 50%,
    #e8f5e8 100%
  );
  background-size: 200% 100%;
  border-radius: 2px;
  animation: ${shimmer} 1.5s infinite;
  margin-top: 1.5rem;
`;

// 🌱 NEW: Growing Guide Loader Components
const GrowingGuideLoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: linear-gradient(135deg, #f8fcf8 0%, #f0f9f0 100%);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(76, 175, 80, 0.1);
  min-width: 400px;
  animation: ${fadeInUp} 0.4s ease-out;
`;

const PlantContainer = styled.div`
  position: relative;
  width: 150px;
  height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 2rem;
`;

const Soil = styled.div`
  width: 140px;
  height: 30px;
  background: linear-gradient(180deg, #8b6f47 0%, #6f5639 100%);
  border-radius: 50% 50% 0 0;
  position: relative;
  z-index: 1;
`;

const Stem = styled.div`
  width: 8px;
  height: 80px;
  background: linear-gradient(180deg, #7cb342 0%, #558b2f 100%);
  border-radius: 4px;
  position: absolute;
  bottom: 30px;
  animation: ${plantGrow} 2s ease-out;
  box-shadow: 0 2px 8px rgba(85, 139, 47, 0.3);
`;

const LeafLeft = styled.div`
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-100%);
  width: 30px;
  height: 30px;
  background: #4caf50;
  border-radius: 0 50% 50% 0;
  animation: ${leafSprout} 2s ease-out;
  box-shadow: -2px 2px 8px rgba(76, 175, 80, 0.3);
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 1px;
    background: #2e7d32;
  }
`;

const LeafRight = styled.div`
  position: absolute;
  bottom: 85px;
  right: 50%;
  transform: translateX(100%);
  width: 30px;
  height: 30px;
  background: #66bb6a;
  border-radius: 50% 0 0 50%;
  animation: ${leafSprout} 2s ease-out 0.3s both;
  box-shadow: 2px 2px 8px rgba(102, 187, 106, 0.3);
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 0;
    width: 100%;
    height: 1px;
    background: #2e7d32;
  }
`;

const Flower = styled.div`
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  background: #ffd54f;
  border-radius: 50%;
  animation: ${leafSprout} 2s ease-out 0.6s both;
  box-shadow: 0 0 20px rgba(255, 213, 79, 0.6);
  
  &::before {
    content: '';
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    height: 12px;
    background: #ffa726;
    border-radius: 50%;
  }
`;

const Sun = styled.div`
  position: absolute;
  top: -40px;
  right: -40px;
  width: 50px;
  height: 50px;
  background: radial-gradient(circle, #ffeb3b 0%, #ffc107 100%);
  border-radius: 50%;
  animation: ${sunRise} 1.5s ease-out;
  box-shadow: 0 0 30px rgba(255, 193, 7, 0.5);
  
  &::after {
    content: '';
    position: absolute;
    inset: -10px;
    background: inherit;
    border-radius: 50%;
    opacity: 0.3;
    animation: ${pulse} 2s ease-in-out infinite;
  }
`;

const WaterDrops = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const WaterDrop = styled.div`
  position: absolute;
  width: 8px;
  height: 10px;
  background: linear-gradient(180deg, #64b5f6 0%, #42a5f5 100%);
  border-radius: 50% 50% 50% 0;
  transform: rotate(45deg);
  animation: ${waterDrop} 2s ease-in-out infinite;
  animation-delay: ${props => props.$delay || '0s'};
  left: ${props => props.$left || '20%'};
  opacity: 0.7;
  box-shadow: 0 2px 4px rgba(66, 165, 245, 0.4);
`;

const GrowingGuideTitle = styled.h2`
  color: #2d5016;
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-align: center;
  animation: ${fadeInUp} 0.5s ease-out 0.2s both;
`;

const GrowingGuideSubtitle = styled.p`
  color: #5d7c47;
  font-size: 1rem;
  text-align: center;
  margin-bottom: 1.5rem;
  animation: ${fadeInUp} 0.5s ease-out 0.4s both;
`;

const GrowthStages = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  animation: ${fadeInUp} 0.5s ease-out 0.6s both;
`;

const Stage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: ${props => props.$active ? 'rgba(76, 175, 80, 0.1)' : 'transparent'};
  border-radius: 12px;
  transition: all 0.3s ease;
  
  .stage-icon {
    width: 32px;
    height: 32px;
    color: ${props => props.$active ? '#4caf50' : '#a5d6a7'};
    transition: all 0.3s ease;
  }
  
  .stage-label {
    font-size: 0.75rem;
    color: ${props => props.$active ? '#2d5016' : '#81c784'};
    font-weight: ${props => props.$active ? '600' : '500'};
    text-align: center;
  }
`;

const ProgressLine = styled.div`
  width: 100%;
  max-width: 300px;
  height: 6px;
  background: #e8f5e8;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 1.5rem;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 60%;
    background: linear-gradient(90deg, #4caf50 0%, #66bb6a 100%);
    border-radius: 3px;
    animation: ${shimmer} 2s ease-in-out infinite;
  }
`;

const Loading = ({
  variant = 'spinner',
  size = 'md',
  text,
  fullScreen = false,
  overlay = false,
  progress,
  steps,
  currentStep,
  className,
  ...props
}) => {
  const renderSpinner = () => (
    <SpinnerContainer>
      <Spinner $size={size} />
    </SpinnerContainer>
  );

  const renderDots = () => (
    <DotsContainer>
      <Dot $delay="0s" />
      <Dot $delay="0.16s" />
      <Dot $delay="0.32s" />
    </DotsContainer>
  );

  const renderPulse = () => (
    <PulseContainer>
      <PulseBar $size={size} $delay="0s" />
      <PulseBar $size={size} $delay="0.1s" />
      <PulseBar $size={size} $delay="0.2s" />
      <PulseBar $size={size} $delay="0.3s" />
    </PulseContainer>
  );

  const renderProgress = () => (
    <ProgressBar>
      <ProgressFill $progress={progress} />
    </ProgressBar>
  );

  const renderSteps = () => (
    <StepIndicator>
      {steps?.map((step, index) => (
        <Step
          key={index}
          $active={index === currentStep}
          $completed={index < currentStep}
        >
          <StepIcon
            $active={index === currentStep}
            $completed={index < currentStep}
          >
            {index < currentStep ? '✓' : index + 1}
          </StepIcon>
          {step}
        </Step>
      ))}
    </StepIndicator>
  );

  // 🌾 NEW: Dashboard Loader Renderer
  const renderDashboardLoader = () => (
    <DashboardLoaderContainer>
      <LogoContainer>
        <OrbitRing />
        <LeafIconWrapper>
          <Leaf strokeWidth={2.5} />
        </LeafIconWrapper>
      </LogoContainer>

      <LoadingTitle>Loading Dashboard</LoadingTitle>
      <LoadingSubtitle>Preparing your agricultural insights...</LoadingSubtitle>

      <DotsLoader>
        <DotLoader $delay="0s" />
        <DotLoader $delay="0.2s" />
        <DotLoader $delay="0.4s" />
      </DotsLoader>

      <LoadingStats>
        <StatItem>
          <Sprout className="icon" />
          <span className="label">Weather</span>
        </StatItem>
        <StatItem>
          <Leaf className="icon" />
          <span className="label">Crops</span>
        </StatItem>
        <StatItem>
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="label">Stats</span>
        </StatItem>
      </LoadingStats>

      <ShimmerBar />
    </DashboardLoaderContainer>
  );

  // 🌱 NEW: Growing Guide Loader Renderer
  const renderGrowingGuideLoader = () => (
    <GrowingGuideLoaderContainer>
      <PlantContainer>
        <Sun />
        <WaterDrops>
          <WaterDrop $delay="0s" $left="15%" />
          <WaterDrop $delay="0.6s" $left="50%" />
          <WaterDrop $delay="1.2s" $left="75%" />
        </WaterDrops>
        <Flower />
        <LeafLeft />
        <LeafRight />
        <Stem />
        <Soil />
      </PlantContainer>

      <GrowingGuideTitle>Loading Growing Guide</GrowingGuideTitle>
      <GrowingGuideSubtitle>Preparing cultivation insights for your crop...</GrowingGuideSubtitle>

      <GrowthStages>
        <Stage $active={true}>
          <Sprout className="stage-icon" strokeWidth={2} />
          <span className="stage-label">Seed</span>
        </Stage>
        <Stage>
          <svg className="stage-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="stage-label">Growth</span>
        </Stage>
        <Stage>
          <svg className="stage-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="6" />
            <path d="M12 14v8M8 20h8" />
          </svg>
          <span className="stage-label">Bloom</span>
        </Stage>
        <Stage>
          <svg className="stage-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <span className="stage-label">Harvest</span>
        </Stage>
      </GrowthStages>

      <ProgressLine />
    </GrowingGuideLoaderContainer>
  );

  // If dashboard variant, render special dashboard loader
  if (variant === 'dashboard') {
    return renderDashboardLoader();
  }

  // If growingGuide variant, render special growing guide loader
  if (variant === 'growingGuide') {
    return renderGrowingGuideLoader();
  }

  return (
    <LoadingContainer
      $fullScreen={fullScreen}
      $overlay={overlay}
      className={className}
      {...props}
    >
      {variant === 'spinner' && renderSpinner()}
      {variant === 'dots' && renderDots()}
      {variant === 'pulse' && renderPulse()}
      
      {text && (
        <LoadingText $size={size}>
          {text}
        </LoadingText>
      )}
      
      {progress !== undefined && renderProgress()}
      {steps && renderSteps()}
    </LoadingContainer>
  );
};

export const LoadingSpinner = ({ size = 'md', ...props }) => (
  <Spinner $size={size} {...props} />
);

export const LoadingDots = ({ ...props }) => (
  <DotsContainer {...props}>
    <Dot $delay="0s" />
    <Dot $delay="0.16s" />
    <Dot $delay="0.32s" />
  </DotsContainer>
);

export const LoadingOverlay = ({ children, loading, ...props }) => (
  <div style={{ position: 'relative' }}>
    {children}
    {loading && (
      <Loading
        variant="spinner"
        text="Loading..."
        overlay // This prop is passed to Loading, which handles it as $overlay
        {...props}
      />
    )}
  </div>
);

export default Loading;