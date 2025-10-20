import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const CardContainer = styled.div`
  background: ${theme.colors.background.primary};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.sm};
  border: 1px solid ${theme.colors.border.light};
  transition: all ${theme.animations.transition.normal};
  overflow: hidden;
  
  ${props => props.$hover && `
    &:hover {
      box-shadow: ${theme.shadows.md};
      transform: translateY(-2px);
      border-color: ${theme.colors.primary[200]};
    }
  `}
  
  ${props => props.$interactive && `
    cursor: pointer;
    
    &:hover {
      box-shadow: ${theme.shadows.lg};
      transform: translateY(-4px);
      border-color: ${theme.colors.primary[300]};
    }
    
    &:active {
      transform: translateY(-1px);
      box-shadow: ${theme.shadows.md};
    }
  `}
  
  ${props => props.$variant === 'outlined' && `
    border: 2px solid ${theme.colors.border.medium};
    box-shadow: none;
    
    &:hover {
      border-color: ${theme.colors.primary[400]};
      box-shadow: ${theme.shadows.sm};
    }
  `}
  
  ${props => props.$variant === 'elevated' && `
    box-shadow: ${theme.shadows.lg};
    
    &:hover {
      box-shadow: ${theme.shadows.xl};
      transform: translateY(-3px);
    }
  `}
  
  ${props => props.$variant === 'gradient' && `
    background: linear-gradient(135deg, ${theme.colors.primary[50]} 0%, ${theme.colors.secondary[50]} 100%);
    border: 1px solid ${theme.colors.primary[200]};
  `}
`;

const CardHeader = styled.div`
  padding: ${theme.spacing[6]} ${theme.spacing[6]} 0 ${theme.spacing[6]};
  
  ${props => props.$compact && `
    padding: ${theme.spacing[4]} ${theme.spacing[4]} 0 ${theme.spacing[4]};
  `}
`;

const CardBody = styled.div`
  padding: ${theme.spacing[6]};
  
  ${props => props.$compact && `
    padding: ${theme.spacing[4]};
  `}
  
  ${props => props.$noPadding && `
    padding: 0;
  `}
`;

const CardFooter = styled.div`
  padding: 0 ${theme.spacing[6]} ${theme.spacing[6]} ${theme.spacing[6]};
  border-top: 1px solid ${theme.colors.border.light};
  margin-top: ${theme.spacing[4]};
  padding-top: ${theme.spacing[4]};
  
  ${props => props.$compact && `
    padding: 0 ${theme.spacing[4]} ${theme.spacing[4]} ${theme.spacing[4]};
  `}
  
  ${props => props.$noBorder && `
    border-top: none;
    margin-top: 0;
    padding-top: 0;
  `}
`;

const CardTitle = styled.h3`
  font-family: ${theme.typography.fontFamily.secondary};
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[2]};
  line-height: ${theme.typography.lineHeight.tight};
`;

const CardSubtitle = styled.p`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing[4]};
  line-height: ${theme.typography.lineHeight.relaxed};
`;

const CardDescription = styled.p`
  font-size: ${theme.typography.fontSize.base};
  color: ${theme.colors.text.secondary};
  line-height: ${theme.typography.lineHeight.relaxed};
  margin-bottom: ${theme.spacing[4]};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Card = ({
  children,
  variant = 'default',
  hover = false,
  interactive = false,
  className,
  onClick,
  ...props
}) => {
  return (
    <CardContainer
      $variant={variant}
      $hover={hover}
      $interactive={interactive}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </CardContainer>
  );
};

Card.Header = ({ children, compact = false, ...props }) => (
  <CardHeader $compact={compact} {...props}>
    {children}
  </CardHeader>
);

Card.Body = ({ children, compact = false, noPadding = false, ...props }) => (
  <CardBody $compact={compact} $noPadding={noPadding} {...props}>
    {children}
  </CardBody>
);

Card.Footer = ({ children, compact = false, noBorder = false, ...props }) => (
  <CardFooter $compact={compact} $noBorder={noBorder} {...props}>
    {children}
  </CardFooter>
);

Card.Title = ({ children, ...props }) => (
  <CardTitle {...props}>{children}</CardTitle>
);

Card.Subtitle = ({ children, ...props }) => (
  <CardSubtitle {...props}>{children}</CardSubtitle>
);

Card.Description = ({ children, ...props }) => (
  <CardDescription {...props}>{children}</CardDescription>
);

export default Card;