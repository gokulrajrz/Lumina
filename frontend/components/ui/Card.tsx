import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { GlassView } from './Layout/GlassView';
import { spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return <GlassView style={[styles.card, style]} intensity={10} tint="dark">{children}</GlassView>;
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 24, // Smoother corners for modern look
  },
});
