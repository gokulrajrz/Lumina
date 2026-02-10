/**
 * Tab Navigator Layout — Bottom tabs with proper icons and accessibility.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceHover,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sunny-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Home - Daily Briefing',
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Journal - Write & Reflect',
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask AI',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Ask AI - Chat with Lumina',
        }}
      />
      <Tabs.Screen
        name="chart"
        options={{
          title: 'Chart',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="planet-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Birth Chart Details',
        }}
      />
    </Tabs>
  );
}
