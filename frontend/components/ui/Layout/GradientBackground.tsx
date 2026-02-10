import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../constants/theme';

interface GradientBackgroundProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export function GradientBackground({ children, style }: GradientBackgroundProps) {
    return (
        <LinearGradient
            // Deep space gradient: Void -> Midnight Blue -> Deep Purple
            colors={[colors.background, '#1A1A2E', '#2D2D44']}
            locations={[0, 0.6, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.container, style]}
        >
            {children}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
