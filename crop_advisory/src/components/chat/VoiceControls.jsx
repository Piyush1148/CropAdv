/**
 * Voice Controls Component
 * Provides UI controls for voice features (TTS/STT)
 * 
 * Features:
 * - 🎤 Microphone button for speech input
 * - 🔊 Speaker button for text-to-speech
 * - ⏸️ Pause/Resume controls
 * - ⏩ Speed control
 * - 🔇 Mute toggle
 */

import React from 'react';
import styled from 'styled-components';

const theme = {
  primary: '#22c55e',
  primaryHover: '#16a34a',
  primaryLight: '#dcfce7',
  error: '#ef4444',
  warning: '#f59e0b',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0'
};

// ========== STYLED COMPONENTS ==========

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid ${theme.border};
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: ${props => props.active ? theme.primary : 'white'};
  color: ${props => props.active ? 'white' : theme.text};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  font-size: 18px;
  opacity: ${props => props.disabled ? 0.5 : 1};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover:not(:disabled) {
    background: ${props => props.active ? theme.primaryHover : theme.primaryLight};
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
`;

const MicButton = styled(IconButton)`
  background: ${props => props.active ? theme.error : 'white'};
  animation: ${props => props.active ? 'pulse 1.5s infinite' : 'none'};

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  &:hover:not(:disabled) {
    background: ${props => props.active ? theme.error : theme.primaryLight};
  }
`;

const SpeedControl = styled.select`
  padding: 6px 10px;
  border: 1px solid ${theme.border};
  border-radius: 6px;
  background: white;
  color: ${theme.text};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${theme.primary};
  }

  &:focus {
    outline: none;
    border-color: ${theme.primary};
    box-shadow: 0 0 0 3px ${theme.primaryLight};
  }

  @media (max-width: 768px) {
    font-size: 12px;
    padding: 4px 8px;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 6px 12px;
  background: ${theme.text};
  color: white;
  font-size: 12px;
  border-radius: 6px;
  white-space: nowrap;
  opacity: ${props => props.show ? 1 : 0};
  visibility: ${props => props.show ? 'visible' : 'hidden'};
  transition: opacity 0.2s, visibility 0.2s;
  pointer-events: none;
  z-index: 1000;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: ${theme.text};
  }
`;

const ButtonWrapper = styled.div`
  position: relative;
`;

// ========== MICROPHONE BUTTON COMPONENT ==========

export const MicrophoneButton = ({ isListening, onStart, onStop, disabled }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  const handleClick = () => {
    if (isListening) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <ButtonWrapper
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <MicButton
        onClick={handleClick}
        active={isListening}
        disabled={disabled}
        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? '⏹️' : '🎤'}
      </MicButton>
      <Tooltip show={showTooltip}>
        {isListening ? 'Stop listening' : 'Voice input'}
      </Tooltip>
    </ButtonWrapper>
  );
};

// ========== SPEAKER BUTTON COMPONENT ==========

export const SpeakerButton = ({ isSpeaking, isPaused, onClick, disabled }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  const getIcon = () => {
    if (isSpeaking && !isPaused) return '⏸️';
    if (isPaused) return '▶️';
    return '🔊';
  };

  const getTooltipText = () => {
    if (isSpeaking && !isPaused) return 'Pause';
    if (isPaused) return 'Resume';
    return 'Read aloud';
  };

  return (
    <ButtonWrapper
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <IconButton
        onClick={onClick}
        active={isSpeaking}
        disabled={disabled}
        aria-label={getTooltipText()}
      >
        {getIcon()}
      </IconButton>
      <Tooltip show={showTooltip}>
        {getTooltipText()}
      </Tooltip>
    </ButtonWrapper>
  );
};

// ========== STOP SPEAKING BUTTON ==========

export const StopButton = ({ onClick, disabled }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <ButtonWrapper
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <IconButton
        onClick={onClick}
        disabled={disabled}
        aria-label="Stop speaking"
      >
        ⏹️
      </IconButton>
      <Tooltip show={showTooltip}>
        Stop speaking
      </Tooltip>
    </ButtonWrapper>
  );
};

// ========== MUTE TOGGLE BUTTON ==========

export const MuteButton = ({ isMuted, onClick }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <ButtonWrapper
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <IconButton
        onClick={onClick}
        active={isMuted}
        aria-label={isMuted ? 'Unmute voice' : 'Mute voice'}
      >
        {isMuted ? '🔇' : '🔊'}
      </IconButton>
      <Tooltip show={showTooltip}>
        {isMuted ? 'Unmute' : 'Mute'}
      </Tooltip>
    </ButtonWrapper>
  );
};

// ========== SPEED CONTROL COMPONENT ==========

export const SpeedSelector = ({ value, onChange }) => {
  const speeds = [
    { value: 0.75, label: '🐢 Slow' },
    { value: 1.0, label: '🚶 Normal' },
    { value: 1.25, label: '🏃 Fast' },
    { value: 1.5, label: '🚀 Very Fast' }
  ];

  return (
    <SpeedControl
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      aria-label="Speech speed"
    >
      {speeds.map(speed => (
        <option key={speed.value} value={speed.value}>
          {speed.label}
        </option>
      ))}
    </SpeedControl>
  );
};

// ========== NEW: LANGUAGE SELECTOR ==========

export const LanguageSelector = ({ 
  selectedLanguage, 
  availableLanguages, 
  onChange 
}) => {
  if (!availableLanguages || availableLanguages.length === 0) {
    return null; // Don't render if no languages available
  }

  // Don't show selector if only one language available
  if (availableLanguages.length === 1) {
    return null;
  }

  return (
    <SpeedControl
      value={selectedLanguage}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Select language"
      style={{ minWidth: '140px' }}
    >
      {availableLanguages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.name}
        </option>
      ))}
    </SpeedControl>
  );
};

// ========== VOICE SETTINGS PANEL ==========

export const VoiceSettingsPanel = ({
  speechRate,
  onSpeedChange,
  isMuted,
  onMuteToggle,
  // NEW: Language support
  selectedLanguage,
  availableLanguages,
  onLanguageChange,
  compact = false
}) => {
  if (compact) {
    return (
      <ControlsContainer style={{ padding: '4px', gap: '4px' }}>
        {availableLanguages && availableLanguages.length > 1 && (
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            availableLanguages={availableLanguages}
            onChange={onLanguageChange}
          />
        )}
        <MuteButton isMuted={isMuted} onClick={onMuteToggle} />
        <SpeedSelector value={speechRate} onChange={onSpeedChange} />
      </ControlsContainer>
    );
  }

  return (
    <ControlsContainer>
      {availableLanguages && availableLanguages.length > 1 && (
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          availableLanguages={availableLanguages}
          onChange={onLanguageChange}
        />
      )}
      <MuteButton isMuted={isMuted} onClick={onMuteToggle} />
      <SpeedSelector value={speechRate} onChange={onSpeedChange} />
    </ControlsContainer>
  );
};

// ========== VOICE INPUT PANEL ==========

export const VoiceInputPanel = ({
  isListening,
  onStartListening,
  onStopListening,
  disabled
}) => {
  return (
    <MicrophoneButton
      isListening={isListening}
      onStart={onStartListening}
      onStop={onStopListening}
      disabled={disabled}
    />
  );
};

// ========== MESSAGE VOICE CONTROLS ==========

export const MessageVoiceControls = ({
  isSpeaking,
  isPaused,
  onSpeak,
  onPause,
  onResume,
  onStop,
  disabled
}) => {
  const handleSpeakerClick = () => {
    if (isSpeaking && !isPaused) {
      onPause();
    } else if (isPaused) {
      onResume();
    } else {
      onSpeak();
    }
  };

  return (
    <ControlsContainer style={{ padding: '4px', gap: '4px', display: 'inline-flex' }}>
      <SpeakerButton
        isSpeaking={isSpeaking}
        isPaused={isPaused}
        onClick={handleSpeakerClick}
        disabled={disabled}
      />
      {isSpeaking && (
        <StopButton onClick={onStop} disabled={disabled} />
      )}
    </ControlsContainer>
  );
};
