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
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { GradientBackground } from '../../components/ui/Layout/GradientBackground';
import { JournalSkeleton } from '../../components/ui/SkeletonLoader';
import { useUserStore } from '../../stores/userStore';
import { useJournalStore } from '../../stores/journalStore';
import { audioService } from '../../services/audioService';
import { AudioRecorder } from '../../components/ui/AudioRecorder';
import { colors, spacing, typography } from '../../constants/theme';
import { JournalEntry } from '../../types';

export default function JournalScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  const { entries, loadEntries, addEntry, updateEntry, deleteEntry, isLoading } = useJournalStore();
  const params = useLocalSearchParams();

  const [refreshing, setRefreshing] = useState(false);
  const [writing, setWriting] = useState(false);
  const [newEntryText, setNewEntryText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [entryPrompt, setEntryPrompt] = useState<string>('');
  const [entryMood, setEntryMood] = useState<number>(3);
  const [entryTags, setEntryTags] = useState<string>('');

  const fetchEntries = useCallback(async () => {
    if (!profile?.user_id) return;
    await loadEntries(profile.user_id);
  }, [profile?.user_id, loadEntries]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Handle incoming prompt from navigation using useFocusEffect
  // This ensures it triggers even if the tab is already mounted
  useFocusEffect(
    useCallback(() => {
      if (params.prompt) {
        setEntryPrompt(params.prompt as string);
        setWriting(true);
        router.setParams({ prompt: '' });
      }
    }, [params.prompt, router])
  );

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
      setEntryPrompt(entry.prompt || '');
      setEntryMood(entry.mood || 3);
      setEntryTags(entry.tags?.join(', ') || '');
    } else {
      setEditingEntry(null);
      setNewEntryText('');
      setAudioUri(null);
      setEntryPrompt('');
      setEntryMood(3);
      setEntryTags('');
    }
    setWriting(true);
  };

  const handleSaveEntry = async () => {
    if (!newEntryText.trim() && !audioUri) {
      Alert.alert('Empty Entry', 'Please write something or record audio before saving.');
      return;
    }

    if (!profile?.user_id) return;

    const tagsArray = entryTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    setSubmitting(true);
    try {
      let uploadedAudioUrl = audioUri;

      if (audioUri && !audioUri.startsWith('http')) {
        uploadedAudioUrl = await audioService.uploadAudio(audioUri, profile.user_id);
      }

      if (editingEntry) {
        await updateEntry(editingEntry.entry_id, {
          content: newEntryText,
          mood: entryMood as any,
          tags: tagsArray,
          audio_url: uploadedAudioUrl || undefined,
        });
        Alert.alert('Updated', 'Your entry has been updated.');
      } else {
        await addEntry(profile.user_id, {
          content: newEntryText,
          mood: entryMood as any,
          tags: tagsArray,
          prompt: entryPrompt,
          audio_url: uploadedAudioUrl || undefined,
        });
        Alert.alert('Saved', 'Your cosmic thought has been recorded.');
      }
      setNewEntryText('');
      setAudioUri(null);
      setEntryPrompt('');
      setEntryMood(3);
      setEntryTags('');
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
      'Are you sure you want to delete this entry?',
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

  // ── List Item ──────────────────────────────────────────────────────────
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

      {/* Mood & Tags */}
      {(item.mood || (item.tags && item.tags.length > 0)) && (
        <View style={styles.metaDisplayRow}>
          {item.mood && (
            <View style={styles.moodDisplay}>
              {[...Array(item.mood)].map((_, i) => (
                <Ionicons key={i} name="star" size={14} color={colors.primary} />
              ))}
            </View>
          )}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsDisplay}>
              {item.tags.map((tag, index) => (
                <View key={index} style={styles.tagBadge}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Prompt */}
      {item.prompt ? (
        <Text style={styles.savedPrompt}>"{item.prompt}"</Text>
      ) : null}

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

  // ── Main Screen ────────────────────────────────────────────────────────
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

        {/* ── Editor Modal ─────────────────────────────────────────────── */}
        <Modal visible={writing} animationType="slide" transparent>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            {/* Header: Cancel ─ Title (centered) ─ Save */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setWriting(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>

              {/* Absolutely centered title */}
              <View style={styles.titleRowCentered} pointerEvents="none">
                <Text style={styles.modalTitle}>
                  {editingEntry ? 'Edit Entry' : 'New Entry'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSaveEntry}
                disabled={submitting}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.modalSave, submitting && styles.disabledText]}>
                  {submitting ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable body */}
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {/* Prompt */}
              {entryPrompt ? (
                <View style={styles.promptContainer}>
                  <Text style={styles.promptLabel}>Reflecting on</Text>
                  <Text style={styles.promptText}>{entryPrompt}</Text>
                </View>
              ) : null}

              {/* Text input */}
              <TextInput
                style={styles.input}
                multiline
                placeholder="What's on your mind?..."
                placeholderTextColor={colors.textTertiary}
                value={newEntryText}
                onChangeText={setNewEntryText}
                autoFocus
              />
            </ScrollView>

            {/* Bottom toolbar: Mood, Tags, Audio */}
            <View style={styles.toolbar}>
              {/* Mood row */}
              <View style={styles.toolbarRow}>
                <Text style={styles.toolbarLabel}>Mood</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setEntryMood(star)}>
                      <Ionicons
                        name={star <= entryMood ? 'star' : 'star-outline'}
                        size={28}
                        color={colors.primary}
                        style={{ marginHorizontal: 3 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Tags row */}
              <View style={styles.toolbarRow}>
                <Text style={styles.toolbarLabel}>Tags</Text>
                <TextInput
                  style={styles.tagsInput}
                  placeholder="gratitude, dreams, work..."
                  placeholderTextColor={colors.textTertiary}
                  value={entryTags}
                  onChangeText={setEntryTags}
                />
              </View>

              {/* Audio */}
              <View style={styles.audioRow}>
                <AudioRecorder
                  onRecordingComplete={setAudioUri}
                  existingAudioUri={audioUri || undefined}
                  onDeleteAudio={() => setAudioUri(null)}
                />
              </View>
            </View>

            {/* Saving overlay */}
            {submitting && (
              <View style={styles.savingOverlay}>
                <View style={styles.savingBox}>
                  <ActivityIndicator size="large" color={colors.textPrimary} />
                  <Text style={styles.savingText}>Saving your entry...</Text>
                </View>
              </View>
            )}
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </GradientBackground >
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ─ Screen ─
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

  // ─ Entry Card ─
  entryCard: {
    marginBottom: spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
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
  savedPrompt: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
    opacity: 0.8,
  },

  // ─ Entry Meta (list view) ─
  metaDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  moodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  tagsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tagBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // ─ Entry Insight ─
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

  // ─ Empty State ─
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

  // ─ Modal Container ─
  modalContainer: {
    flex: 1,
    paddingTop: spacing.xxl,
    backgroundColor: colors.background,
  },

  // ─ Modal Header ─
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 50,
  },
  titleRowCentered: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  modalCancel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    zIndex: 1,
  },
  modalSave: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
    zIndex: 1,
  },
  disabledText: {
    opacity: 0.4,
  },

  // ─ Modal Body (scrollable) ─
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    flexGrow: 1,
  },

  // ─ Prompt ─
  promptContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  promptLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  promptText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // ─ Text Input ─
  input: {
    flex: 1,
    padding: spacing.lg,
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 200,
  },

  // ─ Bottom Toolbar (Mood, Tags, Audio) ─
  toolbar: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolbarLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsInput: {
    flex: 1,
    marginLeft: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
  },
  audioRow: {
    marginTop: 4,
  },

  // ─ Saving Overlay ─
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  savingBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 16,
  },
  savingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
});
