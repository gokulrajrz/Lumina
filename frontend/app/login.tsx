/**
 * Login Screen — Dedicated sign-in for returning users.
 * 
 * DESIGN NOTES:
 * 1. Absolutely NO stray text/whitespace allowed outside <Text> components.
 * 2. Icons must be full React elements <Ionicons />.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { GradientBackground } from '../components/ui/Layout/GradientBackground';
import { GlassView } from '../components/ui/Layout/GlassView';
import { supabase } from '../services/supabase';
import { useUserStore } from '../stores/userStore';
import { colors, spacing, typography } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
    const router = useRouter();
    const loadProfile = useUserStore(state => state.loadProfile);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                // RootLayout will detect session change and handle redirect 
                // after the profile is automatically loaded.
            }
        } catch (error: any) {
            Alert.alert('Login Error', error.message || 'Failed to sign in');
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
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="moon" size={40} color="#A78BFA" />
                        </View>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to continue your cosmic journey</Text>
                    </View>

                    <GlassView style={styles.formCard}>
                        <Input
                            label="Email"
                            placeholder="your@email.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            icon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
                        />
                        <Input
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                        />

                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            loading={loading}
                            variant="primary"
                            style={styles.loginButton}
                        />

                        <TouchableOpacity
                            onPress={() => router.replace('/onboarding')}
                            style={styles.signUpLink}
                        >
                            <Text style={styles.signUpText}>
                                Don't have an account? <Text style={styles.signUpHighlight}>Sign Up</Text>
                            </Text>
                        </TouchableOpacity>
                    </GlassView>
                </View>
            </KeyboardAvoidingView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.lg,
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
        fontSize: typography.fontSize.xxxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: typography.fontSize.base,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    formCard: {
        padding: spacing.lg,
        borderRadius: 24,
    },
    loginButton: {
        marginTop: spacing.md,
    },
    signUpLink: {
        marginTop: spacing.lg,
        alignItems: 'center',
    },
    signUpText: {
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
    },
    signUpHighlight: {
        color: '#A78BFA',
        fontWeight: 'bold',
    },
});
