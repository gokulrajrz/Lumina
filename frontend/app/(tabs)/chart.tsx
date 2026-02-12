/**
 * Chart Screen — Natal chart display with matte dark aesthetic.
 * Layout pattern matches Home & Journal screens.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { GradientBackground } from '../../components/ui/Layout/GradientBackground';
import { BriefingSkeleton } from '../../components/ui/SkeletonLoader';
import { useUserStore } from '../../stores/userStore';
import { api } from '../../services/api';
import { colors, spacing, typography } from '../../constants/theme';
import { BirthChart } from '../../types';
import { ZODIAC_SYMBOLS, PLANET_SYMBOLS, ELEMENTS, QUALITIES } from '../../constants/zodiac';

// ── Element Colors ──────────────────────────────────────────────────────
const ELEMENT_COLORS: Record<string, string> = {
  fire: '#FF6B6B',
  earth: '#4ECDC4',
  air: '#45B7D1',
  water: '#5F27CD',
};

export default function ChartScreen() {
  const { profile, setProfile } = useUserStore();
  const [chart, setChart] = useState<BirthChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChart = useCallback(async () => {
    if (!profile?.user_id) return;
    try {
      const user = await api.getCurrentUser();
      setProfile(user);
      if (user.birth_chart) {
        setChart(user.birth_chart);
      }
    } catch (error) {
      if (__DEV__) console.error('Failed to fetch chart:', error);
      Alert.alert('Error', 'Could not load birth chart.');
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id, setProfile]);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChart();
    setRefreshing(false);
  };

  const getElementColor = (element: string) =>
    ELEMENT_COLORS[element.toLowerCase()] || colors.textSecondary;

  // ── Main Render ──────────────────────────────────────────────────────
  return (
    <GradientBackground>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header — left-aligned, matching Home & Journal */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Natal Chart</Text>
            <Text style={styles.subtitle}>
              {profile?.display_name ? `${profile.display_name}'s Cosmic Blueprint` : 'Your Cosmic Blueprint'}
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="planet-outline" size={22} color={colors.textTertiary} />
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.skeletonWrap}>
            <BriefingSkeleton />
          </View>
        ) : chart ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.textPrimary}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* ── Big Three ──────────────────────────────────────────── */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>The Big Three</Text>
              <View style={styles.bigThreeContainer}>
                <View style={styles.bigThreeItem}>
                  <Text style={styles.bigThreeSymbol}>☉</Text>
                  <Text style={styles.bigThreeLabel}>Sun</Text>
                  <Text style={styles.bigThreeValue}>{chart.planets.Sun.sign}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.bigThreeItem}>
                  <Text style={styles.bigThreeSymbol}>☽</Text>
                  <Text style={styles.bigThreeLabel}>Moon</Text>
                  <Text style={styles.bigThreeValue}>{chart.planets.Moon.sign}</Text>
                </View>
                {chart.ascendant && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.bigThreeItem}>
                      <Text style={styles.bigThreeSymbol}>↑</Text>
                      <Text style={styles.bigThreeLabel}>Rising</Text>
                      <Text style={styles.bigThreeValue}>{chart.ascendant.sign}</Text>
                    </View>
                  </>
                )}
              </View>
            </Card>

            {/* ── Planetary Placements ────────────────────────────────── */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Planetary Placements</Text>
              {Object.entries(chart.planets).map(([planet, data]: [string, any]) => {
                if (planet === 'Ascendant') return null;
                const element = ELEMENTS[data.sign] || 'Unknown';

                return (
                  <View key={planet} style={styles.planetRow}>
                    <View style={styles.planetInfo}>
                      <Text style={styles.planetSymbolText}>
                        {PLANET_SYMBOLS[planet] || ''}
                      </Text>
                      <Text style={styles.planetName}>{planet}</Text>
                    </View>
                    <View style={styles.placementInfo}>
                      <View style={styles.signBadge}>
                        <Text style={styles.signSymbol}>
                          {ZODIAC_SYMBOLS[data.sign] || ''}
                        </Text>
                        <Text style={styles.signName}>{data.sign}</Text>
                      </View>
                      {(data.house || data.retrograde) && (
                        <View style={styles.houseBadge}>
                          <Text style={styles.houseText}>
                            {data.house ? `H${data.house}` : ''}{data.retrograde ? ' Rx' : ''}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View
                      style={[styles.elementDot, { backgroundColor: getElementColor(element) }]}
                    />
                  </View>
                );
              })}
            </Card>

            {/* ── Houses ─────────────────────────────────────────────── */}
            {chart.houses && (
              <Card style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>House Cusps</Text>
                {chart.houses.map((data) => (
                  <View key={data.house} style={styles.houseRow}>
                    <Text style={styles.houseNumber}>House {data.house}</Text>
                    <Text style={styles.houseSign}>{data.sign}</Text>
                    <Text style={styles.houseDegree}>{data.degree?.toFixed(1)}°</Text>
                  </View>
                ))}
              </Card>
            )}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Card>
              <View style={styles.emptyContent}>
                <Ionicons name="telescope-outline" size={40} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No Chart Available</Text>
                <Text style={styles.emptyText}>
                  Please verify your birth details in settings to generate your natal chart.
                </Text>
              </View>
            </Card>
          </View>
        )}
      </View>
    </GradientBackground>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ─ Screen ─
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl * 1.5,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonWrap: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 130,
  },

  // ─ Section Cards ─
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },

  // ─ Big Three ─
  bigThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  bigThreeItem: {
    alignItems: 'center',
    flex: 1,
  },
  bigThreeSymbol: {
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  bigThreeLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bigThreeValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  divider: {
    width: 1,
    height: 48,
    backgroundColor: colors.border,
  },

  // ─ Planet Rows ─
  planetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  planetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  planetSymbolText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginRight: spacing.sm,
    width: 22,
    textAlign: 'center',
  },
  planetName: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  placementInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  signBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signSymbol: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  signName: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  houseBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  houseText: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: typography.fontWeight.medium,
  },
  elementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },

  // ─ House Rows ─
  houseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  houseNumber: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    width: 80,
    fontWeight: typography.fontWeight.medium,
  },
  houseSign: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  houseDegree: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },

  // ─ Empty State ─
  emptyContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
