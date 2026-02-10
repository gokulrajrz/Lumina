import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import { colors, typography, spacing } from '../../constants/theme';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  secureTextEntry = false,
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.surfaceHover,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
