/**
 * Settings Screen — User preferences, app configuration, and account management.
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useUserStore } from '../stores/userStore';
import { useChatStore } from '../stores/chatStore';
import { useJournalStore } from '../stores/journalStore';
import { colors, spacing, typography } from '../constants/theme';

export default function Settings() {
    const router = useRouter();
    const { profile, clearProfile } = useUserStore();
    const chatStore = useChatStore();
    const journalStore = useJournalStore();

    const [dailyBriefingNotif, setDailyBriefingNotif] = useState(
        profile?.preferences?.notifications?.daily_briefing ?? true,
    );
    const [transitAlerts, setTransitAlerts] = useState(
        profile?.preferences?.notifications?.transit_alerts ?? true,
    );

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await supabase.auth.signOut();
                            await clearProfile();
                            chatStore.newConversation();
                            router.replace('/onboarding');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to sign out. Please try again.');
                        }
                    },
                },
            ],
        );
    };

    const handleClearCache = () => {
        Alert.alert(
            'Clear Cache',
            'This will clear cached journal entries and chat history. Your data on the server is not affected.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                        chatStore.newConversation();
                        journalStore.selectEntry(null);
                        Alert.alert('Done', 'Local cache cleared.');
                    },
                },
            ],
        );
    };

    const planets = profile?.birth_chart?.planets || {};
    // @ts-ignore - Dynamic access
    const sunSign = planets?.Sun?.sign || 'Unknown';
    // @ts-ignore - Dynamic access
    const moonSign = planets?.Moon?.sign || 'Unknown';
    const asc = profile?.birth_chart?.ascendant?.sign || 'Unknown';

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                {/* @ts-ignore: Reanimated prop */}
                <Animated.View sharedTransitionTag="menuButton" style={styles.backButtonContainer}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                        accessibilityLabel="Go back"
                        accessibilityRole="button"
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </Animated.View>
                <Text style={styles.title}>Settings</Text>
            </View>

            {/* Profile Card */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Profile</Text>
                <View style={styles.profileRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {profile?.display_name?.charAt(0)?.toUpperCase() || '✨'}
                        </Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{profile?.display_name || 'Cosmic User'}</Text>
                        <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
                        <Text style={styles.bigThree}>
                            ☀️ {sunSign} · 🌙 {moonSign} · ⬆️ {asc}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Birth Info */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Birth Information</Text>
                <SettingRow label="Birth Date" value={profile?.birth_date || '-'} />
                <SettingRow label="Birth Time" value={profile?.birth_time || '-'} />
                <SettingRow label="Birth City" value={profile?.city || '-'} />
                <SettingRow
                    label="Coordinates"
                    value={
                        profile?.latitude && profile?.longitude
                            ? `${profile.latitude}, ${profile.longitude}`
                            : 'Not set'
                    }
                />
            </View>

            {/* Notifications */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.switchRow}>
                    <Text style={styles.settingLabel}>Daily Briefing</Text>
                    <Switch
                        value={dailyBriefingNotif}
                        onValueChange={setDailyBriefingNotif}
                        trackColor={{ false: colors.surfaceHover, true: colors.primary }}
                        accessibilityLabel="Toggle daily briefing notifications"
                    />
                </View>
                <View style={styles.switchRow}>
                    <Text style={styles.settingLabel}>Transit Alerts</Text>
                    <Switch
                        value={transitAlerts}
                        onValueChange={setTransitAlerts}
                        trackColor={{ false: colors.surfaceHover, true: colors.primary }}
                        accessibilityLabel="Toggle transit alert notifications"
                    />
                </View>
            </View>

            {/* App */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>App</Text>
                <TouchableOpacity
                    style={styles.actionRow}
                    onPress={handleClearCache}
                    accessibilityRole="button"
                >
                    <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
                    <Text style={styles.actionText}>Clear Local Cache</Text>
                </TouchableOpacity>
            </View>

            {/* Account Actions */}
            <View style={styles.card}>
                <TouchableOpacity
                    style={styles.signOutButton}
                    onPress={handleSignOut}
                    accessibilityRole="button"
                    accessibilityLabel="Sign out of your account"
                >
                    <Ionicons name="log-out-outline" size={20} color={colors.error} />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.version}>Lumina v2.0.0</Text>
        </ScrollView>
    );
}

function SettingRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{label}</Text>
            <Text style={styles.settingValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xl,
        paddingTop: spacing.xl,
    },
    backButtonContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginRight: spacing.md,
        overflow: 'hidden',
    },
    backButton: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.background,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colors.textPrimary,
    },
    profileEmail: {
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        marginTop: 2,
    },
    bigThree: {
        fontSize: typography.fontSize.sm,
        color: colors.textTertiary,
        marginTop: 4,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceHover,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    settingLabel: {
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
    },
    settingValue: {
        fontSize: typography.fontSize.base,
        color: colors.textSecondary,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        gap: spacing.md,
    },
    actionText: {
        fontSize: typography.fontSize.base,
        color: colors.textSecondary,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
    },
    signOutText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        color: colors.error,
    },
    version: {
        textAlign: 'center',
        color: colors.textTertiary,
        fontSize: typography.fontSize.sm,
        marginTop: spacing.lg,
    },
});
