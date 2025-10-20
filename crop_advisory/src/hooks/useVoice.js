/**
 * useVoice Hook - Voice Features for AI Assistant
 * Provides TTS (Text-to-Speech) and STT (Speech-to-Text) functionality
 * Using browser Web Speech API - FREE and no backend changes needed
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export const useVoice = () => {
  // State management
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0); // Normal speed
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [error, setError] = useState(null);

  // Refs for Speech APIs
  const synthRef = useRef(null);
  const recognitionRef = useRef(null);
  const currentUtteranceRef = useRef(null);
  const currentTextRef = useRef(''); // Track current text being spoken
  const currentCharIndexRef = useRef(0); // Track position in text
  const isChangingSpeedRef = useRef(false); // Track if we're in the middle of a speed change
  const speechStartTimeRef = useRef(0); // Track when speech started
  const estimatedCharsPerSecond = useRef(15); // Estimate ~15 chars per second at normal speed
  
  // Web Audio API refs for real-time volume control
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const audioSourceRef = useRef(null);

  // ========== INITIALIZATION ==========

  useEffect(() => {
    // Initialize Speech Synthesis (TTS)
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      // Load available voices
      const loadVoices = () => {
        const voices = synthRef.current.getVoices();
        setAvailableVoices(voices);
        
        // Auto-select best English voice
        const bestVoice = selectBestEnglishVoice(voices);
        if (bestVoice) {
          setSelectedVoice(bestVoice);
        }
      };

      // Voices might not be loaded immediately
      loadVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    } else {
      setError('Text-to-Speech not supported in this browser');
    }

    // Initialize Speech Recognition (STT)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US'; // English only
    } else {
      setError('Speech Recognition not supported in this browser');
    }

    // Load saved preferences from localStorage
    const savedRate = localStorage.getItem('voiceSpeechRate');
    const savedMuted = localStorage.getItem('voiceMuted');
    
    if (savedRate) setSpeechRate(parseFloat(savedRate));
    if (savedMuted) setIsMuted(savedMuted === 'true');

    // Cleanup on unmount
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ========== VOICE SELECTION ==========

  const selectBestEnglishVoice = (voices) => {
    // Priority order for best English voices
    const priorities = [
      'Google UK English Female',
      'Google US English Female',
      'Microsoft Zira Desktop',
      'Samantha', // macOS
      'Karen', // macOS
      'Alex' // macOS
    ];

    // Try to find exact match
    for (const priority of priorities) {
      const voice = voices.find(v => v.name === priority);
      if (voice) return voice;
    }

    // Fallback: Any female English voice
    const femaleEnglish = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman'))
    );
    if (femaleEnglish) return femaleEnglish;

    // Fallback: Any English voice
    const anyEnglish = voices.find(v => v.lang.startsWith('en'));
    if (anyEnglish) return anyEnglish;

    // Last resort: First available voice
    return voices[0] || null;
  };

  // ========== TEXT-TO-SPEECH (TTS) ==========

  const speak = useCallback((text) => {
    if (!synthRef.current || !text) return;

    // Clear any previous errors
    setError(null);

    // Stop any current speech
    stopSpeaking();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure utterance
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = speechRate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0; // Always full volume (mute uses pause/resume)

      // Store the text being spoken
      currentTextRef.current = text;
      currentCharIndexRef.current = 0;
      speechStartTimeRef.current = Date.now(); // Track start time
      
      console.log(`🎤 Starting speech: ${text.length} characters at ${speechRate}x speed${isMuted ? ' (will pause immediately - muted)' : ''}`);

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setError(null);
        speechStartTimeRef.current = Date.now(); // Reset on actual start
        console.log('▶️ Speech started');
        
        // If muted, pause immediately after starting
        if (isMuted && synthRef.current) {
          setTimeout(() => {
            synthRef.current.pause();
            console.log('🔇 Auto-paused (muted state)');
          }, 50); // Small delay to ensure speech has started
        }
      };

      // Track character position during speech
      utterance.onboundary = (event) => {
        currentCharIndexRef.current = event.charIndex;
        // Log every 50 characters to track progress
        if (event.charIndex % 50 === 0) {
          console.log(`📊 Progress: ${event.charIndex}/${text.length} characters (boundary event)`);
        }
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        currentUtteranceRef.current = null;
        currentTextRef.current = '';
        currentCharIndexRef.current = 0;
      };

      utterance.onerror = (event) => {
        // Ignore "interrupted" error - it's expected when user stops speech manually
        if (event.error === 'interrupted' || event.error === 'canceled') {
          console.log('Speech stopped by user');
          setIsSpeaking(false);
          setIsPaused(false);
          currentUtteranceRef.current = null;
          currentTextRef.current = '';
          currentCharIndexRef.current = 0;
          return;
        }
        
        // Show actual errors to user
        console.error('Speech error:', event);
        setError(`Speech error: ${event.error}`);
        setIsSpeaking(false);
        setIsPaused(false);
        currentUtteranceRef.current = null;
        currentTextRef.current = '';
        currentCharIndexRef.current = 0;
      };

      // Store reference and speak
      currentUtteranceRef.current = utterance;
      synthRef.current.speak(utterance);
      
    } catch (err) {
      console.error('Error in speak function:', err);
      setError(err.message);
    }
  }, [selectedVoice, speechRate, isMuted]);

  const pauseSpeaking = useCallback(() => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  }, [isSpeaking]);

  const resumeSpeaking = useCallback(() => {
    if (synthRef.current && isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setError(null); // Clear any errors when manually stopping
      currentUtteranceRef.current = null;
      currentTextRef.current = '';
      currentCharIndexRef.current = 0;
    }
  }, []);

  // ========== SPEECH-TO-TEXT (STT) ==========

  const startListening = useCallback((onResult, onError) => {
    if (!recognitionRef.current) {
      const err = 'Speech recognition not available';
      setError(err);
      if (onError) onError(err);
      return;
    }

    try {
      // Set up event handlers
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (onResult) {
          onResult(transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Recognition error:', event.error);
        setError(`Recognition error: ${event.error}`);
        setIsListening(false);
        if (onError) {
          onError(event.error);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      // Start recognition
      recognitionRef.current.start();
      
    } catch (err) {
      console.error('Error starting recognition:', err);
      setError(err.message);
      setIsListening(false);
      if (onError) onError(err.message);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
  }, [isListening]);

  // ========== SETTINGS ==========

  const changeSpeechRate = useCallback((rate) => {
    const validRate = Math.max(0.5, Math.min(2.0, rate)); // Clamp between 0.5x and 2x
    const previousRate = speechRate;
    setSpeechRate(validRate);
    localStorage.setItem('voiceSpeechRate', validRate.toString());
    
    console.log(`🎯 Speed change requested: ${previousRate}x → ${validRate}x`);
    
    // Apply rate change immediately if currently speaking
    if (isSpeaking && currentTextRef.current && synthRef.current && !isChangingSpeedRef.current) {
      isChangingSpeedRef.current = true; // Prevent concurrent speed changes
      
      const originalFullText = currentTextRef.current;
      let currentPosition = currentCharIndexRef.current;
      
      // CRITICAL FIX: If position is still 0, boundary events might not be firing
      // Estimate position based on time elapsed
      if (currentPosition === 0 && speechStartTimeRef.current > 0) {
        const timeElapsed = (Date.now() - speechStartTimeRef.current) / 1000; // seconds
        const charsPerSecond = estimatedCharsPerSecond.current * previousRate;
        currentPosition = Math.floor(timeElapsed * charsPerSecond);
        currentPosition = Math.min(currentPosition, originalFullText.length);
        console.log(`⚠️ Boundary events not firing! Estimating position based on time:
          - Time elapsed: ${timeElapsed.toFixed(1)}s
          - Rate: ${previousRate}x
          - Estimated position: ${currentPosition}
        `);
      } else if (speechStartTimeRef.current > 0) {
        // Even if we have a position, update it based on time elapsed since last restart
        const timeElapsed = (Date.now() - speechStartTimeRef.current) / 1000;
        if (timeElapsed > 0.5) { // Only add if enough time has passed
          const charsPerSecond = estimatedCharsPerSecond.current * previousRate;
          const additionalChars = Math.floor(timeElapsed * charsPerSecond);
          currentPosition = Math.min(currentPosition + additionalChars, originalFullText.length);
          console.log(`⏱️ Updating position based on time:
            - Previous position: ${currentCharIndexRef.current}
            - Time elapsed: ${timeElapsed.toFixed(1)}s
            - Additional chars: ${additionalChars}
            - New position: ${currentPosition}
          `);
        } else {
          console.log(`⏱️ Too soon to update (${timeElapsed.toFixed(1)}s), keeping position: ${currentPosition}`);
        }
      }
      
      console.log(`📍 Current state:
        - Original text length: ${originalFullText.length}
        - Current position: ${currentPosition}
        - Text so far: "${originalFullText.substring(0, Math.min(currentPosition + 50, originalFullText.length))}..."
      `);
      
      // Calculate remaining text
      const remainingText = originalFullText.substring(currentPosition);
      
      if (!remainingText.trim()) {
        console.log('⚠️ No remaining text to speak');
        isChangingSpeedRef.current = false;
        return;
      }
      
      console.log(`📝 Remaining text: ${remainingText.length} characters
        Preview: "${remainingText.substring(0, Math.min(100, remainingText.length))}..."
      `);
      
      // Stop current speech
      synthRef.current.cancel();
      
      // Wait for cancel to complete, then restart
      setTimeout(() => {
        if (!synthRef.current) {
          isChangingSpeedRef.current = false;
          return;
        }
        
        // Create new utterance with remaining text
        const newUtterance = new SpeechSynthesisUtterance(remainingText);
        
        if (selectedVoice) {
          newUtterance.voice = selectedVoice;
        }
        newUtterance.rate = validRate;
        newUtterance.pitch = 1.0;
        newUtterance.volume = 1.0; // Always full volume (mute uses pause/resume)
        
        // CRITICAL: Track that this new utterance is a continuation
        // The boundary events will be relative to remainingText, not originalFullText
        const offsetInOriginalText = currentPosition;
        
        // Event handlers for the new utterance
        newUtterance.onstart = () => {
          setIsSpeaking(true);
          setIsPaused(false);
          isChangingSpeedRef.current = false;
          speechStartTimeRef.current = Date.now(); // Track restart time for next change
          // CRITICAL: Update currentCharIndexRef to the offset so it's ready for next change
          currentCharIndexRef.current = offsetInOriginalText;
          console.log(`✅ Speech restarted from position ${offsetInOriginalText} at ${validRate}x speed`);
          
          // If muted, pause immediately after speed change
          if (isMuted && synthRef.current) {
            setTimeout(() => {
              synthRef.current.pause();
              console.log('🔇 Auto-paused after speed change (muted state)');
            }, 50);
          }
        };
        
        newUtterance.onboundary = (event) => {
          // CRITICAL FIX: event.charIndex is relative to remainingText
          // To get absolute position in original text: offset + event.charIndex
          const absolutePosition = offsetInOriginalText + event.charIndex;
          currentCharIndexRef.current = absolutePosition;
          
          // Debug every 10th boundary to avoid log spam
          if (event.charIndex % 50 === 0) {
            console.log(`📊 Boundary: relative=${event.charIndex}, absolute=${absolutePosition}/${originalFullText.length} (WORKING!)`);
          }
        };
        
        newUtterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          currentUtteranceRef.current = null;
          currentTextRef.current = '';
          currentCharIndexRef.current = 0;
          isChangingSpeedRef.current = false;
          console.log('✅ Speech completed');
        };
        
        newUtterance.onerror = (event) => {
          if (event.error === 'interrupted' || event.error === 'canceled') {
            console.log('⏹️ Speech interrupted (normal)');
          } else {
            console.error('❌ Speech error:', event.error);
            setError(`Speech error: ${event.error}`);
          }
          setIsSpeaking(false);
          setIsPaused(false);
          currentUtteranceRef.current = null;
          currentTextRef.current = '';
          currentCharIndexRef.current = 0;
          isChangingSpeedRef.current = false;
        };
        
        // CRITICAL: Keep the ORIGINAL full text reference
        // This ensures next speed change can calculate from the full text
        currentTextRef.current = originalFullText;
        currentCharIndexRef.current = offsetInOriginalText; // Start position for this utterance
        currentUtteranceRef.current = newUtterance;
        
        console.log(`🚀 Starting speech: ${remainingText.length} chars at ${validRate}x from position ${offsetInOriginalText}`);
        synthRef.current.speak(newUtterance);
        
      }, 100); // Increased delay to ensure clean cancel
    }
  }, [isSpeaking, speechRate, selectedVoice, isMuted]);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('voiceMuted', newMuted.toString());
    
    console.log(`🔇 Mute toggled: ${newMuted ? 'MUTING...' : 'UNMUTING...'}`);
    
    // Web Speech API doesn't support real-time volume changes
    // Solution: Pause when muting, resume when unmuting
    if (synthRef.current && isSpeaking) {
      if (newMuted) {
        // Mute: Pause the speech
        synthRef.current.pause();
        console.log('🔇 Speech paused (muted)');
      } else {
        // Unmute: Resume the speech
        synthRef.current.resume();
        console.log('� Speech resumed (unmuted)');
      }
    }
  }, [isMuted, isSpeaking]);

  const changeVoice = useCallback((voice) => {
    setSelectedVoice(voice);
  }, []);

  // ========== UTILITY FUNCTIONS ==========

  const isSupported = useCallback(() => {
    return 'speechSynthesis' in window && 
           ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  const getVoiceInfo = useCallback(() => {
    return {
      currentVoice: selectedVoice?.name || 'Default',
      availableVoicesCount: availableVoices.length,
      ttsSupported: 'speechSynthesis' in window,
      sttSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    };
  }, [selectedVoice, availableVoices]);

  // ========== RETURN API ==========

  return {
    // TTS (Text-to-Speech)
    speak,
    pauseSpeaking,
    resumeSpeaking,
    stopSpeaking,
    isSpeaking,
    isPaused,

    // STT (Speech-to-Text)
    startListening,
    stopListening,
    isListening,

    // Settings
    speechRate,
    changeSpeechRate,
    isMuted,
    toggleMute,
    availableVoices,
    selectedVoice,
    changeVoice,

    // Utilities
    isSupported,
    getVoiceInfo,
    error
  };
};
