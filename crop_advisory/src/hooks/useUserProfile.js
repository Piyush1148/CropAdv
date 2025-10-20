/**
 * useUserProfile Hook
 * 
 * Custom React hook to fetch and manage user profile data from user_profiles collection.
 * Provides personalized farming context for AI Assistant and other features.
 * 
 * Features:
 * - Fetches profile on mount
 * - Caches profile data in state
 * - Auto-refetch on user change
 * - Error handling
 * - Loading states
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiService';

export const useUserProfile = () => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);

  // Fetch user profile from backend
  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      setProfileComplete(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (import.meta.env.DEV) {
        console.log('🔍 Fetching user profile from /auth/profile...');
      }

      const response = await apiClient.get('/auth/profile');

      if (response.data.success && response.data.profile) {
        const fetchedProfile = response.data.profile;
        setProfile(fetchedProfile);
        setProfileComplete(fetchedProfile.profile_complete || false);

        if (import.meta.env.DEV) {
          console.log('✅ User profile loaded:', {
            name: fetchedProfile.full_name,
            location: fetchedProfile.location,
            complete: fetchedProfile.profile_complete
          });
        }
      } else {
        setProfile(null);
        setProfileComplete(false);

        if (import.meta.env.DEV) {
          console.log('⚠️ No profile found for user');
        }
      }
    } catch (err) {
      console.error('❌ Error fetching user profile:', err);
      setError(err.message || 'Failed to load profile');
      setProfile(null);
      setProfileComplete(false);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch profile on mount and when user changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Build personalized context string for AI
  const getAIContext = useCallback(() => {
    if (!profile) {
      return null;
    }

    const contextParts = [];

    if (profile.full_name) {
      contextParts.push(`User: ${profile.full_name}`);
    }

    if (profile.location) {
      contextParts.push(`Location: ${profile.location}`);
    }

    if (profile.farm_size) {
      contextParts.push(`Farm Size: ${profile.farm_size} acres`);
    }

    if (profile.soil_type) {
      contextParts.push(`Soil Type: ${profile.soil_type}`);
    }

    if (profile.irrigation_type) {
      contextParts.push(`Irrigation: ${profile.irrigation_type}`);
    }

    return contextParts.length > 0 ? contextParts.join(' | ') : null;
  }, [profile]);

  // Refetch profile (useful after profile updates)
  const refetch = useCallback(() => {
    return fetchProfile();
  }, [fetchProfile]);

  return {
    profile,                  // Full profile object
    isLoading,               // Loading state
    error,                   // Error message if any
    profileComplete,         // Boolean: whether profile has all optional fields
    getAIContext,            // Function to get formatted AI context string
    refetch                  // Function to manually refetch profile
  };
};

export default useUserProfile;
