import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

// Simple storage adapter that works on all platforms
const StorageAdapter = {
  getItem: async (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // Ignore errors
    }
  },
  removeItem: async (key: string) => {
    if (typeof window === 'undefined') return;
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: StorageAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
