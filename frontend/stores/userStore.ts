import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

interface UserState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  isLoading: boolean;
  setProfile: (profile: UserProfile) => Promise<void>;
  loadProfile: () => Promise<void>;
  clearProfile: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isOnboarded: false,
  isLoading: true,

  setProfile: async (profile) => {
    set({ profile, isOnboarded: true });
    await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
  },

  loadProfile: async () => {
    try {
      const stored = await AsyncStorage.getItem('user_profile');
      if (stored) {
        set({ profile: JSON.parse(stored), isOnboarded: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      set({ isLoading: false });
    }
  },

  clearProfile: async () => {
    set({ profile: null, isOnboarded: false });
    await AsyncStorage.removeItem('user_profile');
  },
}));
