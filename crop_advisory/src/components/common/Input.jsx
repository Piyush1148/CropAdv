import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[1]};
  width: 100%;
`;

const Label = styled.label`
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${theme.spacing[1]};
  
  ${props => props.required && `
    &::after {
      content: '*';
      color: ${theme.colors.error};
      margin-left: ${theme.spacing[1]};
    }
  `}
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input`
  width: 100%;
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm};
  line-height: ${theme.typography.lineHeight.normal};
  color: ${theme.colors.text.primary};
  background-color: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.border.medium};
  border-radius: ${theme.borderRadius.lg};
  outline: none;
  transition: all ${theme.animations.transition.fast};
  
  /* Size variants */
  ${props => props.size === 'sm' && `
    padding: ${theme.spacing[2]} ${theme.spacing[3]};
    font-size: ${theme.typography.fontSize.xs};
  `}
  
  ${props => props.size === 'md' && `
    padding: ${theme.spacing[3]} ${theme.spacing[4]};
    font-size: ${theme.typography.fontSize.sm};
  `}
  
  ${props => props.size === 'lg' && `
    padding: ${theme.spacing[4]} ${theme.spacing[5]};
    font-size: ${theme.typography.fontSize.base};
  `}
  
  /* Icon padding */
  ${props => props.hasLeftIcon && `
    padding-left: ${props.size === 'lg' ? '3rem' : props.size === 'sm' ? '2rem' : '2.5rem'};
  `}
  
  ${props => props.hasRightIcon && `
    padding-right: ${props.size === 'lg' ? '3rem' : props.size === 'sm' ? '2rem' : '2.5rem'};
  `}
  
  /* States */
  &:focus {
    border-color: ${theme.colors.primary[500]};
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
  }
  
  &:hover:not(:focus):not(:disabled) {
    border-color: ${theme.colors.border.dark};
  }
  
  &:disabled {
    background-color: ${theme.colors.background.secondary};
    color: ${theme.colors.text.tertiary};
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  &::placeholder {
    color: ${theme.colors.text.tertiary};
  }
  
  /* Error state */
  ${props => props.error && `
    border-color: ${theme.colors.error};
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    
    &:focus {
      border-color: ${theme.colors.error};
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  `}
  
  /* Success state */
  ${props => props.success && `
    border-color: ${theme.colors.success};
    
    &:focus {
      border-color: ${theme.colors.success};
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }
  `}
`;

const IconContainer = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.text.tertiary};
  transition: color ${theme.animations.transition.fast};
  pointer-events: none;
  
  ${props => props.position === 'left' && `
    left: ${props.size === 'lg' ? theme.spacing[4] : props.size === 'sm' ? theme.spacing[2] : theme.spacing[3]};
  `}
  
  ${props => props.position === 'right' && `
    right: ${props.size === 'lg' ? theme.spacing[4] : props.size === 'sm' ? theme.spacing[2] : theme.spacing[3]};
    cursor: pointer;
    pointer-events: auto;
  `}
`;

const HelpText = styled.p`
  font-size: ${theme.typography.fontSize.xs};
  color: ${theme.colors.text.tertiary};
  margin-top: ${theme.spacing[1]};
  
  ${props => props.error && `
    color: ${theme.colors.error};
  `}
  
  ${props => props.success && `
    color: ${theme.colors.success};
  `}
`;

const CharacterCount = styled.span`
  font-size: ${theme.typography.fontSize.xs};
  color: ${theme.colors.text.tertiary};
  margin-top: ${theme.spacing[1]};
  text-align: right;
  
  ${props => props.isNearLimit && `
    color: ${theme.colors.warning};
  `}
  
  ${props => props.isOverLimit && `
    color: ${theme.colors.error};
  `}
`;

const Input = forwardRef(({
  label,
  required = false,
  size = 'md',
  leftIcon,
  rightIcon,
  onRightIconClick,
  error,
  success,
  helpText,
  maxLength,
  showCharacterCount = false,
  className,
  value,
  ...props
}, ref) => {
  const characterCount = value?.length || 0;
  const isNearLimit = maxLength && characterCount > maxLength * 0.8;
  const isOverLimit = maxLength && characterCount > maxLength;

  return (
    <InputContainer className={className}>
      {label && (
        <Label required={required}>
          {label}
        </Label>
      )}
      
      <InputWrapper>
        {leftIcon && (
          <IconContainer position="left" size={size}>
            {leftIcon}
          </IconContainer>
        )}
        
        <StyledInput
          ref={ref}
          size={size}
          hasLeftIcon={!!leftIcon}
          hasRightIcon={!!rightIcon}
          error={error}
          success={success}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        
        {rightIcon && (
          <IconContainer
            position="right"
            size={size}
            onClick={onRightIconClick}
          >
            {rightIcon}
          </IconContainer>
        )}
      </InputWrapper>
      
      {(helpText || error) && (
        <HelpText error={!!error} success={success}>
          {error || helpText}
        </HelpText>
      )}
      
      {showCharacterCount && maxLength && (
        <CharacterCount
          isNearLimit={isNearLimit}
          isOverLimit={isOverLimit}
        >
          {characterCount}/{maxLength}
        </CharacterCount>
      )}
    </InputContainer>
  );
});

Input.displayName = 'Input';

export default Input;