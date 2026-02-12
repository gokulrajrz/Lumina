/**
 * Onboarding Screen — Account creation + birth data collection.
 * 
 * Step 1: Supabase auth (sign up / sign in)
 * Step 2: Birth information form → calls backend to create profile
 * 
 * DESIGN NOTES:
 * 1. Absolutely NO stray text/whitespace allowed outside <Text> components.
 * 2. Icons must be full React elements <Ionicons />.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
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
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkBackend = async () => {
      if (__DEV__) console.log('[Diagnostic] Checking backend at:', process.env.EXPO_PUBLIC_BACKEND_URL);
      try {
        const status = await api.healthCheck();
        if (__DEV__) console.log('[Diagnostic] Backend is online:', status);
        setBackendStatus('online');
      } catch (error: any) {
        if (__DEV__) {
          console.warn('[Diagnostic] Backend check failed:');
          console.warn('- URL:', process.env.EXPO_PUBLIC_BACKEND_URL);
          console.warn('- Message:', error.message);
          console.warn('- Status:', error.status);
        }
        setBackendStatus('offline');
      }
    };
    checkBackend();
  }, []);

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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error('Session expired. Please sign in again.');
      }

      if (!session) {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          if (signInError.message.includes('Email not confirmed')) {
            throw new Error('Please confirm your email address before continuing.');
          }
          throw new Error(signInError.message || 'Authentication failed. Please sign in again.');
        }
        if (!signInData.user) throw new Error('Failed to authenticate.');
      }

      // Create user profile via backend API
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

      await setProfile(profile);
      router.replace('/(tabs)');
    } catch (error: any) {
      const message = error.message?.includes('Network')
        ? 'Cannot connect to server. Make sure the backend is running.'
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
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="sparkles" size={40} color="#A78BFA" />
            </View>
            <Text style={styles.title}>Lumina</Text>
            <Text style={styles.subtitle}>Begin your cosmic journey</Text>
          </View>

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
                  autoCapitalize="none"
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
                  variant="primary"
                  style={styles.button}
                />
                <TouchableOpacity
                  onPress={() => router.replace('/login')}
                  style={styles.signInLink}
                >
                  <Text style={styles.signInText}>
                    Already have an account? <Text style={styles.signInHighlight}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
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
                  placeholder="The Cosmopolitan"
                  icon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
                />

                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Input
                      label="Birth Date *"
                      value={birthDate}
                      onChangeText={setBirthDate}
                      placeholder="YYYY-MM-DD"
                      keyboardType="numeric"
                      icon={<Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Input
                      label="Birth Time *"
                      value={birthTime}
                      onChangeText={setBirthTime}
                      placeholder="HH:MM"
                      keyboardType="numeric"
                      icon={<Ionicons name="time-outline" size={20} color={colors.textSecondary} />}
                    />
                  </View>
                </View>

                <Input
                  label="City of Birth *"
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. New York, London, Tokyo"
                  icon={<Ionicons name="location-outline" size={20} color={colors.textSecondary} />}
                />

                <Text style={styles.helperText}>
                  Coordinates help us calculate the exact positions of the stars.
                </Text>

                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Input
                      label="Latitude (Optional)"
                      value={latitude}
                      onChangeText={setLatitude}
                      placeholder="e.g. 40.7128"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Input
                      label="Longitude (Optional)"
                      value={longitude}
                      onChangeText={setLongitude}
                      placeholder="e.g. -74.0060"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Button
                  title="Finish Setup"
                  onPress={handleComplete}
                  loading={loading}
                  variant="primary"
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
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
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
  signInLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  signInText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  signInHighlight: {
    color: '#A78BFA',
    fontWeight: 'bold',
  },
});
