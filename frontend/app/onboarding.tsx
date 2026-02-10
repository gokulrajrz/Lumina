/**
 * Onboarding Screen — Account creation + birth data collection.
 * 
 * Step 1: Supabase auth (sign up / sign in)
 * Step 2: Birth information form → calls backend to create profile
 * 
 * The backend uses the JWT token to identify the user (supabase_id),
 * so we don't send supabase_id explicitly in the payload.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useUserStore } from '../stores/userStore';
import { api } from '../services/api';
import { supabase } from '../services/supabase';
import { colors, spacing, typography } from '../constants/theme';

export default function Onboarding() {
  const router = useRouter();
  const setProfile = useUserStore(state => state.setProfile);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Profile
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        // Check if user already exists
        if (error.message?.includes('already registered')) {
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({ email, password });

          if (signInError) throw signInError;
          if (signInData.session) {
            setLoading(false);
            setStep(2);
            return;
          }
        }
        throw error;
      }

      if (!data.user) throw new Error('No user returned');

      if (data.session) {
        // Session created immediately
        setLoading(false);
        setStep(2);
      } else {
        // Email confirmation required
        setLoading(false);
        Alert.alert(
          'Check your email',
          'Please check your email to confirm your account, then click Continue.',
          [{ text: 'Continue', onPress: () => setStep(2) }],
        );
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Sign Up Error', error.message || 'Failed to create account');
    }
  };

  const handleComplete = async () => {
    if (!displayName || !birthDate || !birthTime || !city) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      Alert.alert('Error', 'Birth date must be in YYYY-MM-DD format');
      return;
    }

    // Validate time format
    if (!/^\d{2}:\d{2}$/.test(birthTime)) {
      Alert.alert('Error', 'Birth time must be in HH:MM format');
      return;
    }

    // Validate coordinates if provided
    const lat = latitude ? parseFloat(latitude) : 0;
    const lon = longitude ? parseFloat(longitude) : 0;

    if (latitude && isNaN(lat)) {
      Alert.alert('Error', 'Latitude must be a valid number');
      return;
    }
    if (longitude && isNaN(lon)) {
      Alert.alert('Error', 'Longitude must be a valid number');
      return;
    }

    setLoading(true);
    try {
      // Ensure we have a valid session
      console.log('[Onboarding] Checking session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[Onboarding] Session error:', sessionError);
        throw new Error('Session expired. Please go back and sign in again.');
      }

      if (!session) {
        console.log('[Onboarding] No session, attempting sign in...');
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          console.error('[Onboarding] Sign-in error:', signInError);
          throw new Error('Session expired. Please go back and sign in again.');
        }
        if (!signInData.user) throw new Error('Failed to authenticate.');
      }

      // Create user profile via backend API with timeout
      console.log('[Onboarding] Creating profile via API...');
      const timeoutMs = 15000;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const profile = await api.createUser({
          display_name: displayName,
          email: email,
          birth_date: birthDate,
          birth_time: birthTime,
          latitude: lat,
          longitude: lon,
          city,
          timezone_str: 'UTC',
        });

        clearTimeout(timeout);
        console.log('[Onboarding] Profile created:', profile?.user_id);
        await setProfile(profile);
        router.replace('/(tabs)');
      } catch (apiError: any) {
        clearTimeout(timeout);
        if (apiError.name === 'AbortError') {
          throw new Error(
            'Could not reach the server. Please check that the backend is running and your network connection.',
          );
        }
        throw apiError;
      }
    } catch (error: any) {
      console.error('[Onboarding] Setup error:', error);
      const message =
        error.message?.includes('Network')
          ? 'Cannot connect to server. Make sure the backend is running and check EXPO_PUBLIC_BACKEND_URL in your .env file.'
          : error.message || 'Something went wrong. Please try again.';
      Alert.alert('Setup Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title} accessibilityRole="header">
        ✨ Welcome to Lumina
      </Text>
      <Text style={styles.subtitle}>
        Your cosmic self-discovery journey begins
      </Text>

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
        <View style={styles.stepLine} />
        <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
      </View>

      {step === 1 && (
        <View style={styles.form}>
          <Text style={styles.stepTitle}>Create Account</Text>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          <Button
            title="Continue"
            onPress={handleSignUp}
            loading={loading}
            fullWidth
          />
        </View>
      )}

      {step === 2 && (
        <View style={styles.form}>
          <Text style={styles.stepTitle}>Birth Information</Text>
          <Text style={styles.stepDescription}>
            This data powers your personalized birth chart and daily cosmic insights.
          </Text>
          <Input
            label="Display Name *"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
          />
          <Input
            label="Birth Date (YYYY-MM-DD) *"
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="1990-01-15"
          />
          <Input
            label="Birth Time (HH:MM, 24hr) *"
            value={birthTime}
            onChangeText={setBirthTime}
            placeholder="14:30"
          />
          <Input
            label="Birth City *"
            value={city}
            onChangeText={setCity}
            placeholder="New York"
          />
          <Input
            label="Latitude (optional)"
            value={latitude}
            onChangeText={setLatitude}
            placeholder="e.g., 40.7128"
            keyboardType="numeric"
          />
          <Input
            label="Longitude (optional)"
            value={longitude}
            onChangeText={setLongitude}
            placeholder="e.g., -74.0060"
            keyboardType="numeric"
          />
          <Text style={styles.helperText}>
            💡 Optional — for a more accurate chart, search "[city name] coordinates" online.
          </Text>
          <Button
            title="Complete Setup"
            onPress={handleComplete}
            loading={loading}
            fullWidth
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surfaceHover,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.surfaceHover,
  },
  form: {
    marginTop: spacing.md,
  },
  stepTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  stepDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
