/**
 * Journal Screen — Write & reflect with AI-powered prompts and tag input.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { JournalSkeleton } from '../../components/ui/SkeletonLoader';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { useUserStore } from '../../stores/userStore';
import { useJournalStore } from '../../stores/journalStore';
import { api } from '../../services/api';
import { colors, spacing, typography } from '../../constants/theme';
import { format } from 'date-fns';

const MOODS = ['😔', '😐', '🙂', '😊', '🤩'];

export default function JournalScreen() {
  const { profile } = useUserStore();
  const { entries, isLoading, loadEntries, addEntry } = useJournalStore();

  const [isWriting, setIsWriting] = useState(false);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState(3);
  const [prompt, setPrompt] = useState('');
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.user_id) {
      loadEntries(profile.user_id);
    }
  }, [profile?.user_id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (profile?.user_id) await loadEntries(profile.user_id);
    setRefreshing(false);
  };

  const handleLoadPrompt = async () => {
    if (!profile?.user_id) return;
    setLoadingPrompt(true);
    try {
      const result = await api.getJournalPrompt(profile.user_id);
      setPrompt(result.prompt);
    } catch (err) {
      console.error('Failed to load prompt:', err);
    } finally {
      setLoadingPrompt(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = async () => {
    if (!profile?.user_id || !content.trim()) {
      Alert.alert('Error', 'Please write something before saving.');
      return;
    }

    setSaving(true);
    try {
      await addEntry(profile.user_id, {
        content: content.trim(),
        mood: selectedMood,
        tags,
        prompt,
      });
      setContent('');
      setSelectedMood(3);
      setPrompt('');
      setTags([]);
      setIsWriting(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ErrorBoundary>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">Journal</Text>
          {!isWriting && (
            <TouchableOpacity
              onPress={() => {
                setIsWriting(true);
                handleLoadPrompt();
              }}
              style={styles.newButton}
              accessibilityLabel="Start a new journal entry"
              accessibilityRole="button"
            >
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Writing Mode */}
        {isWriting && (
          <Card>
            {/* AI Prompt */}
            {(loadingPrompt || prompt) && (
              <View style={styles.promptContainer}>
                {loadingPrompt ? (
                  <Text style={styles.promptText}>Loading cosmic prompt...</Text>
                ) : (
                  <Text style={styles.promptText}>💫 {prompt}</Text>
                )}
              </View>
            )}

            {/* Mood Selector */}
            <Text style={styles.label}>How are you feeling?</Text>
            <View style={styles.moodRow}>
              {MOODS.map((emoji, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedMood(i + 1)}
                  style={[
                    styles.moodButton,
                    selectedMood === i + 1 && styles.moodButtonActive,
                  ]}
                  accessibilityLabel={`Mood ${i + 1} of 5`}
                  accessibilityRole="button"
                >
                  <Text style={styles.moodEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Content Input */}
            <TextInput
              style={styles.textArea}
              placeholder="Write your thoughts..."
              placeholderTextColor={colors.textTertiary}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              accessibilityLabel="Journal entry content"
            />

            {/* Tag Input */}
            <Text style={styles.label}>Tags</Text>
            <View style={styles.tagInputRow}>
              <TextInput
                style={styles.tagInput}
                placeholder="Add a tag..."
                placeholderTextColor={colors.textTertiary}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
                accessibilityLabel="Add tag"
              />
              <TouchableOpacity onPress={handleAddTag} style={styles.addTagButton}>
                <Ionicons name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {tags.length > 0 && (
              <View style={styles.tagList}>
                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => handleRemoveTag(tag)}
                    style={styles.tag}
                    accessibilityLabel={`Remove tag ${tag}`}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                    <Ionicons name="close-circle" size={14} color={colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionRow}>
              <Button
                title="Cancel"
                onPress={() => setIsWriting(false)}
                variant="ghost"
              />
              <Button
                title="Save Entry"
                onPress={handleSave}
                loading={saving}
                disabled={!content.trim()}
              />
            </View>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && entries.length === 0 && <JournalSkeleton />}

        {/* Empty State */}
        {!isLoading && !isWriting && entries.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyTitle}>Your journal is empty</Text>
            <Text style={styles.emptyText}>
              Start writing to discover patterns in your cosmic journey.
            </Text>
            <Button
              title="Write First Entry"
              onPress={() => {
                setIsWriting(true);
                handleLoadPrompt();
              }}
            />
          </Card>
        )}

        {/* Entries List */}
        {!isWriting && entries.map((entry) => (
          <Card key={entry.entry_id}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryDate}>
                {format(new Date(entry.created_at), 'MMM d, yyyy')}
              </Text>
              <Text style={styles.entryMood}>{MOODS[(entry.mood || 3) - 1]}</Text>
            </View>
            <Text style={styles.entryContent} numberOfLines={4}>
              {entry.content}
            </Text>
            {entry.tags && entry.tags.length > 0 && (
              <View style={styles.entryTags}>
                {entry.tags.map((tag: string) => (
                  <View key={tag} style={styles.entryTag}>
                    <Text style={styles.entryTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        ))}
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  newButton: {
    padding: spacing.xs,
  },
  promptContainer: {
    backgroundColor: colors.surfaceHover,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  promptText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  moodButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodButtonActive: {
    backgroundColor: colors.primary,
  },
  moodEmoji: {
    fontSize: 22,
  },
  textArea: {
    backgroundColor: colors.surfaceHover,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    minHeight: 140,
    marginBottom: spacing.md,
    textAlignVertical: 'top',
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  tagInput: {
    flex: 1,
    backgroundColor: colors.surfaceHover,
    borderRadius: 12,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  addTagButton: {
    padding: spacing.sm,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHover,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  tagText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  entryDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    fontWeight: typography.fontWeight.medium,
  },
  entryMood: {
    fontSize: 18,
  },
  entryContent: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  entryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  entryTag: {
    backgroundColor: colors.surfaceHover,
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  entryTagText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
});
