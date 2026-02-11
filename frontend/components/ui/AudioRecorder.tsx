import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { useAudioRecorder, useAudioPlayer, AudioSource } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants/theme';

interface AudioRecorderProps {
    onRecordingComplete: (uri: string) => void;
    existingAudioUri?: string;
    onDeleteAudio?: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
    onRecordingComplete,
    existingAudioUri,
    onDeleteAudio,
}) => {
    // Recorder setup
    const audioRecorder = useAudioRecorder({
        sampleRate: 44100,
        bitRate: 128000,
        numberOfChannels: 1,
        extension: '.m4a',
        android: {
            extension: '.m4a',
            outputFormat: 2, // MPEG_4
            audioEncoder: 3, // AAC
        } as any,
        ios: {
            extension: '.m4a',
            outputFormat: 'mpeg4aac',
            audioQuality: 127,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
        } as any,
        web: {
            mimeType: 'audio/mp4',
            bitsPerSecond: 128000,
        }
    });

    useEffect(() => {
        console.log('AudioRecorder mounted');
    }, []);

    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);

    // Player setup
    const [playingUri, setPlayingUri] = useState<string | null>(existingAudioUri || null);
    const player = useAudioPlayer(playingUri ? { uri: playingUri } : null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Recording Timer
    useEffect(() => {
        let interval: any;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingDuration((prev) => prev + 1);
            }, 1000);
        } else {
            setRecordingDuration(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    // Update player when prop changes
    useEffect(() => {
        if (existingAudioUri) {
            setPlayingUri(existingAudioUri);
        }
    }, [existingAudioUri]);

    // Handle Playback Status
    useEffect(() => {
        if (!player) return;

        const subscription = player.addListener('playbackStatusUpdate', (status) => {
            setIsPlaying(status.playing);
            if (status.didJustFinish) {
                player.seekTo(0);
                player.pause();
            }
        });

        return () => subscription.remove();
    }, [player]);


    const startRecording = async () => {
        try {
            if (!audioRecorder.isRecording) {
                await audioRecorder.prepareToRecordAsync();
                audioRecorder.record();
                setIsRecording(true);
            }
        } catch (err) {
            Alert.alert('Failed to start recording', err as string);
        }
    };

    const stopRecording = async () => {
        if (isRecording) {
            await audioRecorder.stop();
            setIsRecording(false);
            const uri = audioRecorder.uri;
            if (uri) {
                setPlayingUri(uri);
                onRecordingComplete(uri);
            }
        }
    };

    const togglePlayback = () => {
        if (player) {
            if (player.playing) {
                player.pause();
            } else {
                player.play();
            }
        }
    };

    const handleDelete = () => {
        setPlayingUri(null);
        if (onDeleteAudio) onDeleteAudio();
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (playingUri) {
        return (
            <View style={styles.container}>
                <View style={styles.playbackContainer}>
                    <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
                        <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={24}
                            color={colors.background}
                        />
                    </TouchableOpacity>
                    <Text style={styles.audioLabel}>Voice Note</Text>
                    <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {isRecording ? (
                <View style={styles.recordingContainer}>
                    <View style={styles.recordingIndicator}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingTimer}>{formatDuration(recordingDuration)}</Text>
                    </View>
                    <TouchableOpacity onPress={stopRecording} style={styles.stopButton}>
                        <Ionicons name="stop" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity onPress={startRecording} style={styles.recordButton}>
                    <Ionicons name="mic" size={20} color={colors.textPrimary} />
                    <Text style={styles.recordText}>Record Audio</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
    recordButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceHover,
        padding: spacing.md,
        borderRadius: 24,
        gap: 8,
    },
    recordText: {
        color: colors.textPrimary,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
    recordingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#3a1c1c',
        padding: spacing.sm,
        borderRadius: 24,
        paddingHorizontal: spacing.md,
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    recordingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.error,
    },
    recordingTimer: {
        color: colors.error,
        fontWeight: typography.fontWeight.bold,
    },
    stopButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.error,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playbackContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceHover,
        borderRadius: 24,
        padding: spacing.xs,
        gap: spacing.md,
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.textPrimary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    audioLabel: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: typography.fontSize.sm,
    },
    deleteButton: {
        padding: spacing.sm,
    },
});
