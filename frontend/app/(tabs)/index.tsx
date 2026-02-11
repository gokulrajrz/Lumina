/**
 * Home Screen — Matte Dark Daily Briefing with date picker header.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { GradientBackground } from '../../components/ui/Layout/GradientBackground';
import { BriefingSkeleton } from '../../components/ui/SkeletonLoader';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { useUserStore } from '../../stores/userStore';
import { api } from '../../services/api';
import { colors, spacing, typography } from '../../constants/theme';
import { DailyBriefing } from '../../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekDays() {
  const today = new Date();
  const currentDay = today.getDay();
  const result = [];

  for (let i = -2; i <= 4; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push({
      dayName: DAYS[d.getDay()],
      date: d.getDate(),
      isToday: i === 0,
    });
  }
  return result;
}



import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

// ...

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useUserStore();

  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const weekDays = getWeekDays();

  // Header Constants
  const HEADER_MAX_HEIGHT = 200;
  const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 120 : 100;
  const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerHeightStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE],
      [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      Extrapolation.CLAMP
    );
    return { height };
  });

  const headerBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE / 2],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const greetingOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE / 2],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ translateY: scrollY.value * 0.5 }] }; // Parallax fade
  });

  const smallTitleOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [SCROLL_DISTANCE / 1.5, SCROLL_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const fetchBriefing = useCallback(async () => {
    // ... (fetch logic same)
    if (!profile?.user_id) {
      // ...
      return;
    }
    try {
      // ...
      const data = await api.getDailyBriefing(profile.user_id);
      setBriefing(data);
    } catch (err) {
      // ...
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


  const firstName = profile?.display_name?.split(' ')[0] || 'Traveler';

  return (
    <GradientBackground>
      <StatusBar style="light" />
      <ErrorBoundary>

        {/* Unified Animated Header */}
        <Animated.View style={[styles.fixedHeader, headerHeightStyle]}>
          {/* Glass Background - Fades In */}
          <Animated.View style={[StyleSheet.absoluteFill, styles.headerBackground, headerBackgroundStyle]}>
            <BlurView tint="dark" intensity={80} style={StyleSheet.absoluteFill} />
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(21,21,21,0.3)' }} />
          </Animated.View>

          {/* Top Row: Menu - Title - Avatar */}
          <View style={styles.headerTopRow}>
            {/* @ts-ignore: Reanimated prop */}
            <Animated.View sharedTransitionTag="menuButton" style={styles.menuButton}>
              <TouchableOpacity
                onPress={() => router.push('/settings')}
                style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                accessibilityLabel="Open settings"
                accessibilityRole="button"
              >
                <Ionicons name="grid-outline" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </Animated.View>

            {/* Collapsed Title */}
            <Animated.Text style={[styles.stickyTitle, smallTitleOpacityStyle]}>
              Hello, {firstName}
            </Animated.Text>

            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={22} color={colors.textSecondary} />
              </View>
            </View>
          </View>

          {/* Expanded Greeting Section */}
          <Animated.View style={[styles.expandedGreeting, greetingOpacityStyle]}>
            <Text style={styles.greeting}>
              Hello {firstName},
            </Text>
            <Text style={styles.subGreeting}>
              What do you want to know?
            </Text>
          </Animated.View>
        </Animated.View>

        <Animated.ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingTop: HEADER_MAX_HEIGHT + 20 }]}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.textPrimary}
              colors={[colors.textPrimary]}
              progressViewOffset={HEADER_MAX_HEIGHT}
            />
          }
        >
          {/* ScrollView Content Starts Here */}

          {/* Date Picker */}
          <View style={styles.datePicker}>
            {weekDays.map((day, i) => (
              <TouchableOpacity
                key={i}
                style={styles.dayItem}
                activeOpacity={0.7}
              >
                <View style={[styles.dayCircle, day.isToday && styles.dayCircleActive]}>
                  <Text style={[styles.dayDate, day.isToday && styles.dayDateActive]}>
                    {day.date}
                  </Text>
                </View>
                <Text style={[styles.dayName, day.isToday && styles.dayNameActive]}>
                  {day.dayName}
                </Text>
              </TouchableOpacity>
            ))}
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
            <View style={styles.briefingContainer}>
              {/* Theme */}
              <Card>
                <Text style={styles.cardLabel}>Today's Theme</Text>
                <Text style={styles.themeText}>{briefing.theme}</Text>
                <View style={styles.energyRow}>
                  <Text style={styles.energyLabel}>Cosmic Energy</Text>
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

              {/* Lucky Info */}
              <View style={styles.row}>
                <Card style={styles.halfCard}>
                  <Text style={styles.cardLabel}>Lucky Color</Text>
                  <Text style={styles.luckyValue}>
                    {briefing.luckyColor || '—'}
                  </Text>
                </Card>
                <Card style={styles.halfCard}>
                  <Text style={styles.cardLabel}>Lucky Number</Text>
                  <Text style={styles.luckyValue}>{briefing.luckyNumber ?? '—'}</Text>
                </Card>
              </View>

              {/* Journal Prompt */}
              {briefing.journalPrompt && (
                <Card>
                  <Text style={styles.cardLabel}>Journal Prompt</Text>
                  <Text style={styles.promptText}>{briefing.journalPrompt}</Text>
                  <Button
                    title="Write Entry"
                    variant="ghost"
                    onPress={() => router.push('/journal')}
                    style={{ alignSelf: 'flex-start', marginTop: spacing.sm, paddingLeft: 0 }}
                  />
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
            </View>
          )}
        </Animated.ScrollView>
      </ErrorBoundary>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl * 3,
    // paddingTop is handled inline
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden', // Clip greeting when it slides up? No, fade is better.
    // justifyContent: 'flex-start',
  },
  headerBackground: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTopRow: {
    marginTop: Platform.OS === 'ios' ? 50 : 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    zIndex: 10,
    paddingHorizontal: 4, // Slight offset for buttons
  },
  stickyTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: Platform.OS === 'ios' ? 60 : undefined, // Center vertically on iOS
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    zIndex: -1,
  },
  // Restored Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    alignItems: 'flex-end',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ... rest of styles
  greetingSection: {
    marginBottom: spacing.lg,
  },
  expandedGreeting: {
    marginTop: spacing.lg + 10,
    paddingLeft: 4, // Align with menu button visually
  },
  greeting: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.regular,
  },
  datePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  dayItem: {
    alignItems: 'center',
    gap: 6,
  },
  dayCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: colors.textPrimary,
  },
  dayDate: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  dayDateActive: {
    color: colors.background,
  },
  dayName: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'capitalize',
  },
  dayNameActive: {
    color: colors.textPrimary,
  },
  briefingContainer: {
    gap: spacing.sm,
    paddingBottom: 110,
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
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  themeText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    lineHeight: 28,
  },
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceHighlight,
  },
  dotActive: {
    backgroundColor: colors.textPrimary,
  },
  forecastRow: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  periodLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  forecastText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  favorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  favorIcon: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 2,
  },
  favorText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfCard: {
    flex: 1,
    minHeight: 100,
    justifyContent: 'center',
  },
  luckyValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  promptText: {
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 28,
    marginBottom: spacing.sm,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  transitInfo: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontWeight: typography.fontWeight.medium,
  },
  transitDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 6,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.textTertiary,
  },
});
