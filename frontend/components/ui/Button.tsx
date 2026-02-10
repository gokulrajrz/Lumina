import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, typography, spacing } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        (disabled || loading) && styles.disabled,
        fullWidth && styles.fullWidth,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.textPrimary : colors.primary} />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  primaryText: {
    color: colors.textPrimary,
  },
  secondaryText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.textSecondary,
  },
});
