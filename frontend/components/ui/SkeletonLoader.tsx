/**
 * SkeletonLoader — Animated loading placeholder for content.
 * Used across screens while data is loading.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../../constants/theme';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
}) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: colors.surfaceHover,
                    opacity,
                },
                style,
            ]}
        />
    );
};

/**
 * Pre-built skeleton layouts for common screen patterns.
 */

export const BriefingSkeleton: React.FC = () => (
    <View style={skeletonStyles.container}>
        <Skeleton width={200} height={28} style={{ marginBottom: spacing.sm }} />
        <Skeleton width={140} height={16} style={{ marginBottom: spacing.xl }} />

        {/* Energy card */}
        <View style={skeletonStyles.card}>
            <Skeleton width={120} height={18} style={{ marginBottom: spacing.md }} />
            <Skeleton height={14} style={{ marginBottom: spacing.sm }} />
            <Skeleton height={14} style={{ marginBottom: spacing.sm }} />
            <Skeleton width="80%" height={14} />
        </View>

        {/* Favors card */}
        <View style={skeletonStyles.card}>
            <Skeleton width={100} height={18} style={{ marginBottom: spacing.md }} />
            <Skeleton height={14} style={{ marginBottom: spacing.sm }} />
            <Skeleton height={14} style={{ marginBottom: spacing.sm }} />
            <Skeleton width="60%" height={14} />
        </View>

        {/* Journal prompt card */}
        <View style={skeletonStyles.card}>
            <Skeleton width={150} height={18} style={{ marginBottom: spacing.md }} />
            <Skeleton height={14} style={{ marginBottom: spacing.sm }} />
            <Skeleton width="90%" height={14} />
        </View>
    </View>
);

export const JournalSkeleton: React.FC = () => (
    <View style={skeletonStyles.container}>
        {[1, 2, 3].map(i => (
            <View key={i} style={skeletonStyles.card}>
                <Skeleton width={160} height={16} style={{ marginBottom: spacing.sm }} />
                <Skeleton height={14} style={{ marginBottom: spacing.sm }} />
                <Skeleton width="70%" height={14} />
            </View>
        ))}
    </View>
);

export const ChatSkeleton: React.FC = () => (
    <View style={[skeletonStyles.container, { justifyContent: 'flex-end' }]}>
        <View style={{ alignItems: 'flex-end', marginBottom: spacing.md }}>
            <Skeleton width={200} height={40} borderRadius={16} />
        </View>
        <View style={{ alignItems: 'flex-start', marginBottom: spacing.md }}>
            <Skeleton width={260} height={80} borderRadius={16} />
        </View>
    </View>
);

const skeletonStyles = StyleSheet.create({
    container: {
        padding: spacing.lg,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
});
