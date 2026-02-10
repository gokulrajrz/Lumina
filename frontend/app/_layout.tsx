/**
 * Root Layout — App entry point with auth routing and error boundary.
 */

import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../services/supabase';
import { useUserStore } from '../stores/userStore';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { colors } from '../constants/theme';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { profile, isOnboarded, loadProfile } = useUserStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadProfile().then(() => setIsReady(true));
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          useUserStore.getState().clearProfile();
          router.replace('/onboarding');
          return;
        }

        if (session && !isOnboarded) {
          // User is authed but hasn't completed onboarding
          const inOnboarding = segments[0] === 'onboarding';
          if (!inOnboarding) {
            router.replace('/onboarding');
          }
        } else if (session && isOnboarded) {
          const inTabs = segments[0] === '(tabs)';
          if (!inTabs) {
            router.replace('/(tabs)');
          }
        } else if (!session) {
          router.replace('/onboarding');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [isReady, isOnboarded]);

  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
      </Stack>
    </ErrorBoundary>
  );
}
