import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const ButtonStyled = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: ${theme.typography.fontFamily.primary};
  font-weight: ${theme.typography.fontWeight.medium};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid transparent;
  transition: all ${theme.animations.transition.fast};
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  outline: none;
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  &:focus-visible {
    outline: 2px solid ${theme.colors.primary[500]};
    outline-offset: 2px;
  }
  
  /* Size Variants */
  ${props => props.$size === 'sm' && `
    padding: ${theme.spacing[2]} ${theme.spacing[3]};
    font-size: ${theme.typography.fontSize.sm};
    line-height: ${theme.typography.lineHeight.tight};
  `}
  
  ${props => props.$size === 'md' && `
    padding: ${theme.spacing[3]} ${theme.spacing[5]};
    font-size: ${theme.typography.fontSize.sm};
    line-height: ${theme.typography.lineHeight.normal};
  `}
  
  ${props => props.$size === 'lg' && `
    padding: ${theme.spacing[4]} ${theme.spacing[6]};
    font-size: ${theme.typography.fontSize.base};
    line-height: ${theme.typography.lineHeight.normal};
  `}
  
  /* Variant Styles */
  ${props => props.$variant === 'primary' && `
    background-color: ${theme.colors.primary[600]};
    color: ${theme.colors.text.inverse};
    border-color: ${theme.colors.primary[600]};
    
    &:hover:not(:disabled) {
      background-color: ${theme.colors.primary[700]};
      border-color: ${theme.colors.primary[700]};
      transform: translateY(-1px);
      box-shadow: ${theme.shadows.lg};
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: ${theme.shadows.md};
    }
  `}
  
  ${props => props.$variant === 'secondary' && `
    background-color: ${theme.colors.background.primary};
    color: ${theme.colors.text.primary};
    border-color: ${theme.colors.border.medium};
    
    &:hover:not(:disabled) {
      background-color: ${theme.colors.background.secondary};
      border-color: ${theme.colors.border.dark};
    }
  `}
  
  ${props => props.$variant === 'outline' && `
    background-color: transparent;
    color: ${theme.colors.primary[600]};
    border-color: ${theme.colors.primary[600]};
    
    &:hover:not(:disabled) {
      background-color: ${theme.colors.primary[600]};
      color: ${theme.colors.text.inverse};
    }
  `}
  
  ${props => props.$variant === 'ghost' && `
    background-color: transparent;
    color: ${theme.colors.text.secondary};
    border-color: transparent;
    
    &:hover:not(:disabled) {
      background-color: ${theme.colors.background.secondary};
      color: ${theme.colors.text.primary};
    }
  `}
  
  ${props => props.$variant === 'danger' && `
    background-color: ${theme.colors.error};
    color: ${theme.colors.text.inverse};
    border-color: ${theme.colors.error};
    
    &:hover:not(:disabled) {
      background-color: #dc2626;
      border-color: #dc2626;
      transform: translateY(-1px);
      box-shadow: ${theme.shadows.lg};
    }
  `}
  
  /* Loading State */
  ${props => props.$loading && `
    pointer-events: none;
    position: relative;
    color: transparent;
    
    &::after {
      content: '';
      position: absolute;
      width: 1rem;
      height: 1rem;
      border: 2px solid currentColor;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      color: ${props.$variant === 'outline' || props.$variant === 'ghost' 
        ? theme.colors.primary[600] 
        : theme.colors.text.inverse
      };
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}
  
  /* Full Width */
  ${props => props.$fullWidth && `
    width: 100%;
  `}
`;

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  className,
  ...props
}) => {
  return (
    <ButtonStyled
      $variant={variant}
      $size={size}
      $loading={loading}
      disabled={disabled || loading}
      $fullWidth={fullWidth}
      onClick={onClick}
      type={type}
      className={className}
      {...props}
    >
      {leftIcon && !loading && leftIcon}
      {!loading && children}
      {rightIcon && !loading && rightIcon}
    </ButtonStyled>
  );
};

export default Button;