import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, Platform, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, shadows } from '../../constants/theme';
import { GlassView } from './Layout/GlassView';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}) => {
  const isDisabled = disabled || loading;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'primary' ? styles.primaryText : styles.secondaryText,
            variant === 'ghost' && styles.ghostText,
          ]}
        >
          {title}
        </Text>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.touchable, fullWidth && styles.fullWidth, style, isDisabled && styles.disabled]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={colors.primaryGradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.touchable, fullWidth && styles.fullWidth, style, isDisabled && styles.disabled]}
        activeOpacity={0.7}
      >
        <GlassView style={styles.secondaryContainer} intensity={10}>
          {content}
        </GlassView>
      </TouchableOpacity>
    );
  }

  // Ghost
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.ghost, fullWidth && styles.fullWidth, style, isDisabled && styles.disabled]}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    borderRadius: 16,
    ...shadows.md,
  },
  fullWidth: {
    width: '100%',
  },
  gradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  secondaryContainer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  ghost: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.5,
  },
  primaryText: {
    color: colors.textPrimary,
  },
  secondaryText: {
    color: colors.textSecondary,
  },
  ghostText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
});
