/**
 * Birth Chart Screen — Displays astrological chart details with accessibility.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from '../../components/ui/Card';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { useUserStore } from '../../stores/userStore';
import { colors, spacing, typography } from '../../constants/theme';
import { ZODIAC_SYMBOLS, PLANET_SYMBOLS, ELEMENTS, QUALITIES } from '../../constants/zodiac';

export default function ChartScreen() {
  const { profile } = useUserStore();
  const birthChart = profile?.birth_chart;
  const planets = birthChart?.planets || {};

  const sunSign = planets?.Sun?.sign || 'Unknown';
  const moonSign = planets?.Moon?.sign || 'Unknown';
  const ascSign = birthChart?.ascendant?.sign || 'Unknown';

  if (!birthChart) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🌌</Text>
        <Text style={styles.emptyTitle}>No birth chart found</Text>
        <Text style={styles.emptyText}>
          Complete your profile to see your birth chart.
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title} accessibilityRole="header">Your Birth Chart</Text>
        <Text style={styles.subtitle}>
          {profile?.birth_date} • {profile?.birth_time} • {profile?.city}
        </Text>

        {/* Big Three */}
        <Card>
          <Text style={styles.cardLabel}>The Big Three</Text>
          <View style={styles.bigThreeRow}>
            <BigThreeItem
              label="Sun"
              sign={sunSign}
              icon="☀️"
              description="Your core identity"
            />
            <BigThreeItem
              label="Moon"
              sign={moonSign}
              icon="🌙"
              description="Your emotional self"
            />
            <BigThreeItem
              label="Rising"
              sign={ascSign}
              icon="⬆️"
              description="How others see you"
            />
          </View>
        </Card>

        {/* Planetary Placements */}
        <Card>
          <Text style={styles.cardLabel}>Planetary Placements</Text>
          {Object.entries(planets).map(([name, data]: [string, any]) => (
            <View
              key={name}
              style={styles.planetRow}
              accessibilityLabel={`${name} in ${data.sign} at ${data.degree} degrees, house ${data.house}${data.retrograde ? ', retrograde' : ''}`}
            >
              <Text style={styles.planetSymbol}>
                {PLANET_SYMBOLS[name] || '⚫'}
              </Text>
              <View style={styles.planetInfo}>
                <Text style={styles.planetName}>{name}</Text>
                <Text style={styles.planetDetail}>
                  {ZODIAC_SYMBOLS[data.sign] || ''} {data.sign} {data.degree}°
                  {data.retrograde ? ' ℞' : ''}
                </Text>
              </View>
              <Text style={styles.houseLabel}>H{data.house}</Text>
            </View>
          ))}
        </Card>

        {/* Houses */}
        {birthChart.houses && birthChart.houses.length > 0 && (
          <Card>
            <Text style={styles.cardLabel}>Houses</Text>
            <View style={styles.houseGrid}>
              {birthChart.houses.map((house: any) => (
                <View
                  key={house.house}
                  style={styles.houseCell}
                  accessibilityLabel={`House ${house.house}: ${house.sign} at ${house.degree} degrees`}
                >
                  <Text style={styles.houseNumber}>{house.house}</Text>
                  <Text style={styles.houseSign}>
                    {ZODIAC_SYMBOLS[house.sign] || ''} {house.sign}
                  </Text>
                  <Text style={styles.houseDegree}>{house.degree}°</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Aspects */}
        {birthChart.aspects && birthChart.aspects.length > 0 && (
          <Card>
            <Text style={styles.cardLabel}>Major Aspects</Text>
            {birthChart.aspects.slice(0, 12).map((aspect: any, i: number) => (
              <View
                key={i}
                style={styles.aspectRow}
                accessibilityLabel={`${aspect.planet1} ${aspect.type} ${aspect.planet2}, orb ${aspect.orb} degrees`}
              >
                <Text style={styles.aspectPlanet}>{aspect.planet1}</Text>
                <Text style={styles.aspectType}>
                  {getAspectSymbol(aspect.type)}
                </Text>
                <Text style={styles.aspectPlanet}>{aspect.planet2}</Text>
                <Text style={styles.aspectOrb}>
                  {aspect.orb}° orb
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Element & Quality */}
        <Card>
          <Text style={styles.cardLabel}>Sun Sign Profile</Text>
          <View style={styles.profileRow}>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Element</Text>
              <Text style={styles.profileValue}>
                {ELEMENTS[sunSign] || '-'}
              </Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Quality</Text>
              <Text style={styles.profileValue}>
                {QUALITIES[sunSign] || '-'}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </ErrorBoundary>
  );
}

function BigThreeItem({
  label,
  sign,
  icon,
  description,
}: {
  label: string;
  sign: string;
  icon: string;
  description: string;
}) {
  return (
    <View style={styles.bigThreeItem} accessibilityLabel={`${label}: ${sign}. ${description}`}>
      <Text style={styles.bigThreeIcon}>{icon}</Text>
      <Text style={styles.bigThreeSign}>
        {ZODIAC_SYMBOLS[sign] || ''} {sign}
      </Text>
      <Text style={styles.bigThreeLabel}>{label}</Text>
    </View>
  );
}

function getAspectSymbol(type: string): string {
  const symbols: Record<string, string> = {
    conjunction: '☌',
    opposition: '☍',
    trine: '△',
    square: '□',
    sextile: '⚹',
  };
  return symbols[type] || type;
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
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  cardLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  bigThreeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bigThreeItem: {
    alignItems: 'center',
    flex: 1,
  },
  bigThreeIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  bigThreeSign: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  bigThreeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  planetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceHover,
  },
  planetSymbol: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  planetInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  planetName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  planetDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  houseLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    fontWeight: typography.fontWeight.medium,
    minWidth: 28,
    textAlign: 'right',
  },
  houseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  houseCell: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  houseNumber: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 2,
  },
  houseSign: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  houseDegree: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  aspectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  aspectPlanet: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    minWidth: 70,
  },
  aspectType: {
    fontSize: 16,
    color: colors.primary,
    minWidth: 24,
    textAlign: 'center',
  },
  aspectOrb: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginLeft: 'auto',
  },
  profileRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  profileItem: {
    flex: 1,
  },
  profileLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  profileValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
