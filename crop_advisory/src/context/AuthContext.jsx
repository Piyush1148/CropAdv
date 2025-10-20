import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, authService } from '../services/authService';

// Auth Context
const AuthContext = createContext();

// Auth actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  authReady: false, // Track if Firebase auth is fully initialized
  error: null,
  token: null,
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        authReady: true, // Auth is ready when login succeeds
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };

    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        authReady: true, // Auth is ready when register succeeds
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        authReady: true, // Auth is ready even on failure (not loading anymore)
        user: null,
        token: null,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        authReady: true, // Keep authReady true after logout (Firebase still initialized)
      };

    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [firebaseUser, firebaseLoading, firebaseError] = useAuthState(auth);

  // Listen to Firebase auth state changes
  useEffect(() => {
    if (firebaseLoading) {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      return;
    }

    if (firebaseError) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: 'Authentication error occurred'
      });
      return;
    }

    if (firebaseUser) {
      // User is signed in
      const userData = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        photoURL: firebaseUser.photoURL,
        // Add farm profile from localStorage or default values
        farmProfile: JSON.parse(localStorage.getItem(`farmProfile_${firebaseUser.uid}`)) || {
          farmSize: 0,
          location: '',
          soilType: '',
          irrigationType: '',
        },
      };

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: userData,
          token: firebaseUser.accessToken, // Firebase handles tokens
        },
      });
    } else {
      // User is signed out - but auth is still ready (Firebase initialized)
      if (!firebaseLoading) {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    }
  }, [firebaseUser, firebaseLoading, firebaseError]);

  // Login function using Firebase
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const result = await authService.signIn(credentials.email, credentials.password);
      
      if (result.success) {
        // Firebase auth state listener will handle the success state
        return { success: true, user: result.user };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: result.error,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register function using Firebase and Backend
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      // First, register with Firebase Auth (client-side)
      const firebaseResult = await authService.signUp(userData.email, userData.password, userData.name);
      
      if (firebaseResult.success) {
        // Store additional farm profile data in localStorage (backup)
        const farmProfile = {
          farmSize: userData.farmSize || 0,
          location: userData.location || '',
          soilType: userData.soilType || '',
          irrigationType: userData.irrigationType || '',
          phone: userData.phone || '',
        };
        
        localStorage.setItem(`farmProfile_${firebaseResult.user.uid}`, JSON.stringify(farmProfile));

        // ✅ CRITICAL: Create user profile in backend AFTER Firebase Auth success
        console.log('🔄 Attempting to create user profile in backend...');
        console.log('User UID:', firebaseResult.user.uid);
        
        // Wait for Firebase Auth to fully sync
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        try {
          // Import axios directly
          const axios = (await import('axios')).default;
          
          // Try PUBLIC endpoint first (easier for testing, no auth issues)
          console.log('🔵 Trying PUBLIC profile creation endpoint...');
          
          const publicResponse = await axios.post('http://localhost:8000/api/auth/setup-profile-public', {
            uid: firebaseResult.user.uid,
            full_name: userData.name,
            email: userData.email,
            phone_number: userData.phone,
            location: userData.location,
            farm_size: userData.farmSize ? parseFloat(userData.farmSize) : null,
            soil_type: userData.soilType,
            irrigation_type: userData.irrigationType
          });
          
          if (publicResponse.data && publicResponse.data.success) {
            console.log('✅ ✅ ✅ PUBLIC: Profile created successfully!');
            console.log('Profile UID:', publicResponse.data.uid);
            console.log('Full response:', publicResponse.data);
          } else {
            console.warn('⚠️ Public profile creation response:', publicResponse.data);
          }
          
        } catch (publicError) {
          console.error('❌ PUBLIC profile creation failed, trying authenticated...');
          console.error('Public Error:', publicError.response?.data || publicError.message);
          
          // Fallback to authenticated endpoint
          try {
            const token = await firebaseResult.user.getIdToken(true);
            console.log('✅ Got Firebase token, trying authenticated endpoint...');
            
            const { default: apiClient } = await import('../services/apiService');
            
            const authResponse = await apiClient.post('/auth/setup-profile', {
              full_name: userData.name,
              email: userData.email,
              phone_number: userData.phone,
              location: userData.location,
              farm_size: userData.farmSize ? parseFloat(userData.farmSize) : null,
              soil_type: userData.soilType,
              irrigation_type: userData.irrigationType
            });
            
            if (authResponse.data && authResponse.data.success) {
              console.log('✅ ✅ ✅ AUTHENTICATED: Profile created successfully!');
              console.log('Profile UID:', authResponse.data.uid);
            }
            
          } catch (authError) {
            console.error('❌ ❌ ❌ Both profile creation methods FAILED');
            console.error('Auth Error:', authError.response?.data || authError.message);
            console.error('Status:', authError.response?.status);
            // Don't fail registration completely
          }
        }
        
        // Firebase auth state listener will handle the success state
        return { 
          success: true, 
          user: firebaseResult.user,
          message: firebaseResult.message 
        };
      } else {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: firebaseResult.error,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred during registration';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function using Firebase
  const logout = async () => {
    try {
      await authService.signOut();
      // Firebase auth state listener will handle the logout state
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if Firebase signOut fails
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return { success: false, error: 'Logout failed' };
    }
  };

  // Update profile function
  const updateProfile = (profileData) => {
    if (state.user && state.user.uid) {
      // Update farm profile in localStorage
      const currentFarmProfile = JSON.parse(localStorage.getItem(`farmProfile_${state.user.uid}`)) || {};
      const updatedFarmProfile = { ...currentFarmProfile, ...profileData };
      localStorage.setItem(`farmProfile_${state.user.uid}`, JSON.stringify(updatedFarmProfile));
      
      // Update local state
      dispatch({
        type: AUTH_ACTIONS.UPDATE_PROFILE,
        payload: profileData,
      });
    }
  };

  // Reset password function
  const resetPassword = async (email) => {
    try {
      const result = await authService.resetPassword(email);
      return result;
    } catch (error) {
      return { success: false, error: 'Failed to send reset email' };
    }
  };

  // Send email verification
  const sendEmailVerification = async () => {
    try {
      const result = await authService.sendEmailVerification();
      return result;
    } catch (error) {
      return { success: false, error: 'Failed to send verification email' };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Context value
  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    resetPassword,
    sendEmailVerification,
    clearError,
    // Additional Firebase-specific properties
    firebaseUser,
    isLoading: state.isLoading || firebaseLoading,
    authReady: !firebaseLoading && state.authReady, // Auth is ready when Firebase loaded and state is ready
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };
export default AuthContext;