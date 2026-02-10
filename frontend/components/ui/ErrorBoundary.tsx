/**
 * ErrorBoundary — Catches unhandled React errors and displays a fallback UI.
 * Prevents the entire app from crashing when a single component fails.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View style={styles.container}>
                    <Text style={styles.emoji}>✨</Text>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.message}>
                        The stars are a bit misaligned right now. Let's try again.
                    </Text>

                    {__DEV__ && this.state.error && (
                        <ScrollView style={styles.debugContainer}>
                            <Text style={styles.debugText}>
                                {this.state.error.toString()}
                            </Text>
                        </ScrollView>
                    )}

                    <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emoji: {
        fontSize: 48,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: typography.fontSize.base,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    debugContainer: {
        maxHeight: 120,
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    debugText: {
        fontSize: typography.fontSize.xs,
        color: colors.error,
        fontFamily: 'monospace',
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: 12,
        minWidth: 160,
        alignItems: 'center',
    },
    retryText: {
        color: colors.textPrimary,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
    },
});
