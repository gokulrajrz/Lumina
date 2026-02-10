/**
 * Home Screen — Daily Briefing Dashboard with skeleton loading and settings.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BriefingSkeleton } from '../../components/ui/SkeletonLoader';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { useUserStore } from '../../stores/userStore';
import { api } from '../../services/api';
import { colors, spacing, typography } from '../../constants/theme';
import { DailyBriefing } from '../../types';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUserStore();

  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = useCallback(async () => {
    if (!profile?.user_id) {
      setError('Profile not found. Please complete onboarding.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await api.getDailyBriefing(profile.user_id);
      setBriefing(data);
    } catch (err: any) {
      console.error('Briefing fetch error:', err);
      if (err.status === 404) {
        setError('Profile not found on server. Please sign out and re-register.');
      } else if (err.status === 0) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to load your daily briefing.');
      }
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id]);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBriefing();
    setRefreshing(false);
  };

  const planets = profile?.birth_chart?.planets || {};
  const sunSign = planets?.Sun?.sign || 'Cosmic';

  return (
    <ErrorBoundary>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting} accessibilityRole="header">
              Good {getTimeOfDay()}, {profile?.display_name || 'Traveler'} ☀️
            </Text>
            <Text style={styles.subGreeting}>{sunSign} Sun</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={styles.settingsButton}
            accessibilityLabel="Open settings"
            accessibilityRole="button"
          >
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading && <BriefingSkeleton />}

        {/* Error State */}
        {!loading && error && (
          <Card style={styles.errorCard}>
            <Ionicons name="cloud-offline-outline" size={32} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Retry" onPress={handleRefresh} variant="secondary" />
          </Card>
        )}

        {/* Briefing Content */}
        {!loading && !error && briefing && (
          <>
            {/* Theme */}
            <Card>
              <Text style={styles.cardLabel}>Today's Theme</Text>
              <Text style={styles.themeText}>{briefing.theme}</Text>
              <View style={styles.energyRow}>
                <Text style={styles.energyLabel}>Energy</Text>
                <View style={styles.energyDots}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i <= (briefing.energyRating || 3) && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>
            </Card>

            {/* Energy Forecast */}
            {briefing.energyForecast && (
              <Card>
                <Text style={styles.cardLabel}>Energy Forecast</Text>
                {Object.entries(briefing.energyForecast).map(([period, forecast]) => (
                  <View key={period} style={styles.forecastRow}>
                    <Text style={styles.periodLabel}>
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </Text>
                    <Text style={styles.forecastText}>{forecast as string}</Text>
                  </View>
                ))}
              </Card>
            )}

            {/* Cosmic Favors */}
            {briefing.favors && briefing.favors.length > 0 && (
              <Card>
                <Text style={styles.cardLabel}>Cosmic Favors</Text>
                {briefing.favors.map((favor, i) => (
                  <View key={i} style={styles.favorRow}>
                    <Text style={styles.favorIcon}>✦</Text>
                    <Text style={styles.favorText}>{favor}</Text>
                  </View>
                ))}
              </Card>
            )}

            {/* Mindful Notes */}
            {briefing.mindful && briefing.mindful.length > 0 && (
              <Card>
                <Text style={styles.cardLabel}>Be Mindful Of</Text>
                {briefing.mindful.map((note, i) => (
                  <View key={i} style={styles.favorRow}>
                    <Text style={styles.favorIcon}>⚡</Text>
                    <Text style={styles.favorText}>{note}</Text>
                  </View>
                ))}
              </Card>
            )}

            {/* Lucky Info & Journal Prompt */}
            <Card>
              <View style={styles.luckyRow}>
                {briefing.luckyColor && (
                  <View style={styles.luckyItem}>
                    <Text style={styles.luckyLabel}>Lucky Color</Text>
                    <Text style={styles.luckyValue}>{briefing.luckyColor}</Text>
                  </View>
                )}
                {briefing.luckyNumber !== undefined && (
                  <View style={styles.luckyItem}>
                    <Text style={styles.luckyLabel}>Lucky Number</Text>
                    <Text style={styles.luckyValue}>{briefing.luckyNumber}</Text>
                  </View>
                )}
              </View>
            </Card>

            {briefing.journalPrompt && (
              <Card>
                <Text style={styles.cardLabel}>Journal Prompt</Text>
                <Text style={styles.promptText}>{briefing.journalPrompt}</Text>
              </Card>
            )}

            {/* Transits */}
            {briefing.transits && (
              <Card>
                <Text style={styles.cardLabel}>Cosmic Weather</Text>
                <Text style={styles.transitInfo}>
                  🌙 Moon in {briefing.transits.moon_sign} — {briefing.transits.moon_phase}
                </Text>
                {briefing.transits.active_transits?.slice(0, 3).map((t: any, i: number) => (
                  <Text key={i} style={styles.transitDetail}>
                    {t.planet} {t.type} natal {t.natal_planet}
                  </Text>
                ))}
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </ErrorBoundary>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  settingsButton: {
    padding: spacing.sm,
  },
  errorCard: {
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: typography.fontSize.base,
    lineHeight: 22,
  },
  cardLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  themeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: 26,
  },
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  energyLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  energyDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceHover,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  forecastRow: {
    marginBottom: spacing.sm,
  },
  periodLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: 2,
  },
  forecastText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  favorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  favorIcon: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
  favorText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  luckyRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  luckyItem: {
    flex: 1,
  },
  luckyLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  luckyValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  promptText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  transitInfo: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  transitDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.md,
    marginBottom: 4,
  },
});
