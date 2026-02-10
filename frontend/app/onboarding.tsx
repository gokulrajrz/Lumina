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
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { GradientBackground } from '../components/ui/Layout/GradientBackground';
import { GlassView } from '../components/ui/Layout/GlassView';
import { useUserStore } from '../stores/userStore';
import { api } from '../services/api';
import { supabase } from '../services/supabase';
import { colors, spacing, typography } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

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
    <GradientBackground>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              ✨ Welcome to Lumina
            </Text>
            <Text style={styles.subtitle}>
              Your cosmic self-discovery journey begins
            </Text>
          </View>

          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
          </View>

          <GlassView style={styles.formContainer} intensity={20}>
            {step === 1 && (
              <View style={styles.form}>
                <Text style={styles.stepTitle}>Create Account</Text>
                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  icon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
                />
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                />
                <Button
                  title="Continue"
                  onPress={handleSignUp}
                  loading={loading}
                  fullWidth
                  style={styles.button}
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
                  icon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
                />
                <Input
                  label="Birth Date (YYYY-MM-DD) *"
                  value={birthDate}
                  onChangeText={setBirthDate}
                  placeholder="1990-01-15"
                  icon={<Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />}
                />
                <Input
                  label="Birth Time (HH:MM, 24hr) *"
                  value={birthTime}
                  onChangeText={setBirthTime}
                  placeholder="14:30"
                  icon={<Ionicons name="time-outline" size={20} color={colors.textSecondary} />}
                />
                <Input
                  label="Birth City *"
                  value={city}
                  onChangeText={setCity}
                  placeholder="New York"
                  icon={<Ionicons name="location-outline" size={20} color={colors.textSecondary} />}
                />

                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Input
                      label="Lat (opt)"
                      value={latitude}
                      onChangeText={setLatitude}
                      placeholder="40.71"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Input
                      label="Lon (opt)"
                      value={longitude}
                      onChangeText={setLongitude}
                      placeholder="-74.00"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Text style={styles.helperText}>
                  💡 Optional coordinates for higher precision.
                </Text>

                <Button
                  title="Complete Setup"
                  onPress={handleComplete}
                  loading={loading}
                  fullWidth
                  style={styles.button}
                />
              </View>
            )}
          </GlassView>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl * 1.5,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
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
    backgroundColor: colors.surfaceHighlight,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.border,
  },
  formContainer: {
    padding: spacing.lg,
    borderRadius: 24,
  },
  form: {
    width: '100%',
  },
  stepTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
