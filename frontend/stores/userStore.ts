/**
 * User Store — Manages user profile, auth state, and onboarding status.
 * Persists profile to AsyncStorage for offline availability.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { UserProfile } from '../types';

interface UserState {
  profile: UserProfile | null;
  isInitialized: boolean;
  isLoading: boolean;
  lastFetched: number | null;

  setProfile: (profile: UserProfile | null) => Promise<void>;
  loadProfile: () => Promise<void>;
  initialize: () => Promise<void>;
  clearProfile: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      isInitialized: false,
      isLoading: false,
      lastFetched: null,

      setProfile: async (profile) => {
        set({
          profile,
          lastFetched: Date.now(),
        });
      },

      loadProfile: async () => {
        set({ isLoading: true, isInitialized: false });
        try {
          const profile = await api.getCurrentUser();
          set({
            profile,
            lastFetched: Date.now(),
            isInitialized: true,
          });
        } catch (error: any) {
          // If 404 or 401, user just doesn't have a profile yet
          if (error.status === 404 || error.status === 401) {
            set({ profile: null });
          } else {
            if (__DEV__) console.warn('Failed to load profile:', error);
          }
          set({ isInitialized: true });
        } finally {
          set({ isLoading: false });
        }
      },

      initialize: async () => {
        const state = get();
        if (!state.isInitialized) {
          await state.loadProfile();
        }
      },


      clearProfile: async () => {
        set({
          profile: null,
          lastFetched: null,
          isInitialized: true, // We are "initialized" in an unauthenticated state
        });
      },
    }),
    {
      name: 'lumina-user-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        lastFetched: state.lastFetched,
      }),
    },
  ),
);
