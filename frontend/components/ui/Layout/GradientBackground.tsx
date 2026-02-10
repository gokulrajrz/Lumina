import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../../../constants/theme';

interface GradientBackgroundProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

// Pre-generate grain dot positions for performance
function generateGrainDots(count: number) {
    const dots = [];
    // Use a seeded pseudo-random for consistent grain pattern
    let seed = 42;
    const random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < count; i++) {
        dots.push({
            left: `${random() * 100}%`,
            top: `${random() * 100}%`,
            opacity: random() * 0.12 + 0.02, // 0.02 to 0.14
            size: random() > 0.7 ? 2 : 1, // Mostly 1px, some 2px
        });
    }
    return dots;
}

export function GradientBackground({ children, style }: GradientBackgroundProps) {
    // Increased grain density for better visible texture
    const grainDots = useMemo(() => generateGrainDots(1500), []);

    return (
        <View style={[styles.container, style]}>
            {/* Grain texture overlay */}
            <View style={styles.grainLayer} pointerEvents="none">
                {grainDots.map((dot, i) => (
                    <View
                        key={i}
                        style={[
                            styles.grainDot,
                            {
                                left: dot.left as any,
                                top: dot.top as any,
                                opacity: dot.opacity,
                                width: dot.size,
                                height: dot.size,
                            },
                        ]}
                    />
                ))}
            </View>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    grainLayer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    grainDot: {
        position: 'absolute',
        borderRadius: 1,
        backgroundColor: '#FFFFFF',
    },
});
