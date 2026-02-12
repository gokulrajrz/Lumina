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
  const { profile, isInitialized, loadProfile, clearProfile } = useUserStore();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession) {
        loadProfile();
      } else {
        useUserStore.setState({ isInitialized: true });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        if (event === 'SIGNED_IN') {
          loadProfile();
        } else if (event === 'SIGNED_OUT') {
          clearProfile();
          router.replace('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const rootSegment = segments[0];
    const inTabs = rootSegment === '(tabs)';
    const inAuth = rootSegment === 'login' || rootSegment === 'onboarding';
    const inSettings = rootSegment === 'settings';

    if (session) {
      if (profile) {
        // User is logged in and has a profile.
        // Allow them to stay in (tabs) or settings.
        // If they are in auth screens or at an unknown root, send to (tabs).
        if (inAuth || (!inTabs && !inSettings)) {
          router.replace('/(tabs)');
        }
      } else {
        // Logged in but no profile -> must complete onboarding.
        if (rootSegment !== 'onboarding') {
          router.replace('/onboarding');
        }
      }
    } else {
      // Not logged in -> must go to login.
      if (!inAuth) {
        router.replace('/login');
      }
    }
  }, [session, profile, isInitialized, segments]);

  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
      </Stack>
    </ErrorBoundary>
  );
}
