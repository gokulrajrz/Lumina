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
  isOnboarded: boolean;
  isLoading: boolean;
  lastFetched: number | null;

  setProfile: (profile: UserProfile | null) => Promise<void>;
  loadProfile: () => Promise<void>;
  validateProfile: () => Promise<boolean>;
  clearProfile: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      isOnboarded: false,
      isLoading: false,
      lastFetched: null,

      setProfile: async (profile) => {
        set({
          profile,
          isOnboarded: !!profile,
          lastFetched: Date.now(),
        });
      },

      loadProfile: async () => {
        const state = get();
        if (state.profile) {
          set({ isOnboarded: true });
        }
      },

      validateProfile: async () => {
        const state = get();
        if (!state.profile?.user_id) return false;

        try {
          const user = await api.getUser(state.profile.user_id);
          if (user) {
            set({
              profile: user,
              isOnboarded: true,
              lastFetched: Date.now(),
            });
            return true;
          }
          return false;
        } catch (error) {
          console.warn('Profile validation failed:', error);
          return false;
        }
      },

      clearProfile: async () => {
        set({
          profile: null,
          isOnboarded: false,
          lastFetched: null,
        });
      },
    }),
    {
      name: 'lumina-user-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        isOnboarded: state.isOnboarded,
        lastFetched: state.lastFetched,
      }),
    },
  ),
);
