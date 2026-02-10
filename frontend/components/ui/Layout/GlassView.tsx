import React from 'react';
import { StyleSheet, View, ViewStyle, Platform, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, shadows, spacing } from '../../../constants/theme';

interface GlassViewProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
}

export function GlassView({
    children,
    style,
    intensity = 20,
    tint = 'dark'
}: GlassViewProps) {
    // Android doesn't support BlurView well in expo-go sometimes, 
    // so we use a fallback semi-transparent view if needed, 
    // but expo-blur works on modern Androids too.

    if (Platform.OS === 'android') {
        return (
            <View style={[styles.androidGlass, style]}>
                {children}
            </View>
        );
    }

    return (
        <BlurView intensity={intensity} tint={tint} style={[styles.glass, style]}>
            {children}
        </BlurView>
    );
}

const styles = StyleSheet.create({
    glass: {
        backgroundColor: colors.surface,
        borderColor: colors.glassBorder,
        borderWidth: 1,
        borderRadius: spacing.md,
        overflow: 'hidden',
        ...shadows.sm,
    },
    androidGlass: {
        backgroundColor: 'rgba(30, 30, 46, 0.85)', // Fallback for Android
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderRadius: spacing.md,
        ...shadows.sm,
    },
});
