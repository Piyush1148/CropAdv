import React from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from '../../styles/theme';

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