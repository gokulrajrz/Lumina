import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { GradientBackground } from '../../components/ui/Layout/GradientBackground';
import { JournalSkeleton } from '../../components/ui/SkeletonLoader';
import { useUserStore } from '../../stores/userStore';
import { useJournalStore } from '../../stores/journalStore';
import { api } from '../../services/api';
import { audioService } from '../../services/audioService';
import { AudioRecorder } from '../../components/ui/AudioRecorder';
import { colors, spacing, typography } from '../../constants/theme';
import { JournalEntry } from '../../types';

export default function JournalScreen() {
  const { profile } = useUserStore();
  const { entries, loadEntries, addEntry, updateEntry, deleteEntry, isLoading } = useJournalStore();
  const [refreshing, setRefreshing] = useState(false);
  const [writing, setWriting] = useState(false);
  const [newEntryText, setNewEntryText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!profile?.user_id) return;
    await loadEntries(profile.user_id);
  }, [profile?.user_id, loadEntries]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEntries();
    setRefreshing(false);
  };

  const openEditor = (entry?: JournalEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setNewEntryText(entry.content);
      setAudioUri(entry.audio_url || null);
    } else {
      setEditingEntry(null);
      setNewEntryText('');
      setAudioUri(null);
    }
    setWriting(true);
  };

  const handleSaveEntry = async () => {
    if (!newEntryText.trim() && !audioUri) {
      Alert.alert('Empty Entry', 'Please write something or record audio before saving.');
      return;
    }

    if (!profile?.user_id) return;

    setSubmitting(true);
    try {
      let uploadedAudioUrl = audioUri;

      // If it's a local file (not already an http URL), upload it
      if (audioUri && !audioUri.startsWith('http')) {
        uploadedAudioUrl = await audioService.uploadAudio(audioUri, profile.user_id);
      }

      if (editingEntry) {
        await updateEntry(editingEntry.entry_id, {
          content: newEntryText,
          audio_url: uploadedAudioUrl || undefined
        });
        Alert.alert('Updated', 'Your entry has been updated.');
      } else {
        await addEntry(profile.user_id, {
          content: newEntryText,
          mood: 3,
          tags: [],
          audio_url: uploadedAudioUrl || undefined
        });
        Alert.alert('Saved', 'Your cosmic thought has been recorded.');
      }
      setNewEntryText('');
      setAudioUri(null);
      setEditingEntry(null);
      setWriting(false);
    } catch (error) {
      console.error('Failed to save entry:', error);
      Alert.alert('Error', 'Could not save your entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (entry: JournalEntry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this specific cosmic memory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(entry.entry_id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: JournalEntry }) => (
    <Card style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View>
          <Text style={styles.entryDate}>
            {new Date(item.created_at).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.entryTime}>
            {new Date(item.created_at).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => openEditor(item)}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="pencil-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.entryContent}>{item.content}</Text>
      {item.audio_url && (
        <AudioRecorder
          onRecordingComplete={() => { }}
          existingAudioUri={item.audio_url}
        />
      )}
      {item.ai_insight && (
        <View style={styles.insightContainer}>
          <Text style={styles.insightLabel}>✨ Cosmic Insight</Text>
          <Text style={styles.insightText}>{item.ai_insight}</Text>
        </View>
      )}
    </Card>
  );

  return (
    <GradientBackground>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cosmic Journal</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => openEditor()}
          >
            <Ionicons name="add" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <JournalSkeleton />
        ) : (
          <FlatList
            data={entries}
            renderItem={renderItem}
            keyExtractor={(item) => item.entry_id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.textPrimary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Your journal is empty. Start documenting your cosmic journey.
                </Text>
                <Button
                  title="Write First Entry"
                  onPress={() => openEditor()}
                  style={styles.emptyButton}
                />
              </View>
            }
          />
        )}

        <Modal visible={writing} animationType="slide" transparent>
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setWriting(false)}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.titleRow}>
                  <Text style={styles.modalTitle}>
                    {editingEntry ? 'Edit Entry' : 'New Entry'}
                  </Text>
                  <TouchableOpacity onPress={() => Keyboard.dismiss()} style={styles.headerDismiss}>
                    <Ionicons name="chevron-down-circle-outline" size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={handleSaveEntry}
                  disabled={submitting}
                >
                  <Text style={[styles.modalSave, submitting && styles.disabledText]}>
                    {submitting ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                multiline
                placeholder="What's on your mind?..."
                placeholderTextColor={colors.textTertiary}
                value={newEntryText}
                onChangeText={setNewEntryText}
                autoFocus
              />
              <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
                <AudioRecorder
                  onRecordingComplete={setAudioUri}
                  existingAudioUri={audioUri || undefined}
                  onDeleteAudio={() => setAudioUri(null)}
                />
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl * 1.5,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 130,
  },
  entryCard: {
    marginBottom: spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    padding: 4,
  },
  entryDate: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  entryTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  entryContent: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  insightContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceHover,
    borderRadius: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.textTertiary,
  },
  insightLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  insightText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    minWidth: 200,
  },
  modalContainer: {
    flex: 1,
    paddingTop: spacing.xxl,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerDismiss: {
    padding: 4,
  },
  modalCancel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  modalSave: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  disabledText: {
    opacity: 0.4,
  },
  input: {
    flex: 1,
    padding: spacing.lg,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
});
