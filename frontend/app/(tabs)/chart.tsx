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
import { Card } from '../../components/ui/Card';
import { GradientBackground } from '../../components/ui/Layout/GradientBackground';
import { BriefingSkeleton } from '../../components/ui/SkeletonLoader';
import { useUserStore } from '../../stores/userStore';
import { api } from '../../services/api';
import { colors, spacing, typography } from '../../constants/theme';
import { BirthChart } from '../../types';
import { ZODIAC_SYMBOLS, PLANET_SYMBOLS, ELEMENTS, QUALITIES } from '../../constants/zodiac';

export default function ChartScreen() {
  const { profile, setProfile } = useUserStore();
  const [chart, setChart] = useState<BirthChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChart = useCallback(async () => {
    if (!profile?.user_id) return;
    try {
      const user = await api.getUser(profile.user_id);
      setProfile(user);
      if (user.birth_chart) {
        setChart(user.birth_chart);
      }
    } catch (error) {
      console.error('Failed to fetch chart:', error);
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

  const getElementColor = (element: string) => {
    switch (element.toLowerCase()) {
      case 'fire': return '#FF6B6B';
      case 'earth': return '#4ECDC4';
      case 'air': return '#45B7D1';
      case 'water': return '#5F27CD';
      default: return colors.textSecondary;
    }
  };

  return (
    <GradientBackground>
      <StatusBar style="light" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.title}>Natal Chart</Text>
        <Text style={styles.subtitle}>
          {profile?.display_name}'s Cosmic Blueprint
        </Text>

        {loading ? (
          <BriefingSkeleton />
        ) : chart ? (
          <View>
            {/* Core Planets */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>The Big Three</Text>
              <View style={styles.bigThreeContainer}>
                <View style={styles.bigThreeItem}>
                  <Text style={styles.planetSymbol}>☉</Text>
                  <Text style={styles.bigThreeLabel}>Sun</Text>
                  <Text style={styles.bigThreeValue}>{chart.planets.Sun.sign}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.bigThreeItem}>
                  <Text style={styles.planetSymbol}>☽</Text>
                  <Text style={styles.bigThreeLabel}>Moon</Text>
                  <Text style={styles.bigThreeValue}>{chart.planets.Moon.sign}</Text>
                </View>
                {chart.ascendant && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.bigThreeItem}>
                      <Text style={styles.planetSymbol}>↑</Text>
                      <Text style={styles.bigThreeLabel}>Rising</Text>
                      <Text style={styles.bigThreeValue}>{chart.ascendant.sign}</Text>
                    </View>
                  </>
                )}
              </View>
            </Card>

            {/* Planetary Placements */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Planetary Placements</Text>
              {Object.entries(chart.planets).map(([planet, data]: [string, any]) => {
                if (planet === 'Ascendant') return null;
                const element = ELEMENTS[data.sign] || 'Unknown';
                const quality = QUALITIES[data.sign] || 'Unknown';

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
                      <View style={styles.houseBadge}>
                        <Text style={styles.houseText}>
                          {data.house ? `House ${data.house}` : ''} {data.retrograde ? ' (Rx)' : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.elementDot, { backgroundColor: getElementColor(element) }]} />
                  </View>
                );
              })}
            </Card>

            {/* Houses (if available) */}
            {chart.houses && (
              <Card style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>House Cups</Text>
                {chart.houses.map((data) => (
                  <View key={data.house} style={styles.houseRow}>
                    <Text style={styles.houseNumber}>House {data.house}</Text>
                    <Text style={styles.houseSign}>{data.sign}</Text>
                    <Text style={styles.houseDegree}>{data.degree?.toFixed(1)}°</Text>
                  </View>
                ))}
              </Card>
            )}
          </View>
        ) : (
          <Card>
            <Text style={styles.errorText}>
              Chart data unavailable. Please verify your birth details in settings.
            </Text>
          </Card>
        )}
      </ScrollView>
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
    paddingBottom: spacing.xxl * 3,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  bigThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  bigThreeItem: {
    alignItems: 'center',
  },
  planetSymbol: {
    fontSize: 24,
    color: colors.primary,
    marginBottom: 4,
  },
  bigThreeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  bigThreeValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  planetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  planetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  planetSymbolText: {
    fontSize: 16,
    color: colors.primary,
    marginRight: spacing.sm,
    width: 20,
    textAlign: 'center',
  },
  planetName: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  placementInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  signBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  signSymbol: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
  },
  signName: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  houseBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  houseText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  elementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  houseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  houseNumber: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    width: 80,
  },
  houseSign: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  houseDegree: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  errorText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
