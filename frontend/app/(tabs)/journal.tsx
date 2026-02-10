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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { GradientBackground } from '../../components/ui/Layout/GradientBackground';
import { GlassView } from '../../components/ui/Layout/GlassView';
import { JournalSkeleton } from '../../components/ui/SkeletonLoader';
import { useUserStore } from '../../stores/userStore';
import { api } from '../../services/api';
import { colors, spacing, typography } from '../../constants/theme';
import { JournalEntry } from '../../types';

export default function JournalScreen() {
  const { profile } = useUserStore();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [writing, setWriting] = useState(false);
  const [newEntryText, setNewEntryText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!profile?.user_id) return;
    try {
      const data = await api.getJournalEntries(profile.user_id);
      setEntries(data);
    } catch (error) {
      console.error('Failed to fetch journal entries:', error);
      Alert.alert('Error', 'Could not load journal entries.');
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEntries();
    setRefreshing(false);
  };

  const handleCreateEntry = async () => {
    if (!newEntryText.trim()) {
      Alert.alert('Empty Entry', 'Please write something before saving.');
      return;
    }

    if (!profile?.user_id) return;

    setSubmitting(true);
    try {
      const newEntry = await api.createJournalEntry(profile.user_id, {
        content: newEntryText,
        mood: 3, // Neutral
        tags: [],
      });

      setEntries([newEntry, ...entries]);
      setNewEntryText('');
      setWriting(false);
      Alert.alert('Saved', 'Your cosmic thought has been recorded.');
    } catch (error) {
      console.error('Failed to save entry:', error);
      Alert.alert('Error', 'Could not save your entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: JournalEntry }) => (
    <Card style={styles.entryCard}>
      <View style={styles.entryHeader}>
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
      <Text style={styles.entryContent}>{item.content}</Text>
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
            onPress={() => setWriting(true)}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {loading ? (
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
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Your journal is empty. Start documenting your cosmic journey.
                </Text>
                <Button
                  title="Write First Entry"
                  onPress={() => setWriting(true)}
                  style={styles.emptyButton}
                />
              </View>
            }
          />
        )}

        <Modal visible={writing} animationType="slide" transparent>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <GlassView style={styles.modalContainer} intensity={90} tint="dark">
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setWriting(false)}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                  <Text style={styles.modalTitle}>New Entry</Text>
                  <TouchableOpacity onPress={Keyboard.dismiss} style={styles.headerDismiss}>
                    <Ionicons name="chevron-down-circle-outline" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={handleCreateEntry}
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
            </GlassView>
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 130, // Clearance for tab bar
  },
  entryCard: {
    marginBottom: spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  entryDate: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
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
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderRadius: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
  },
  insightLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  modalCancel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  modalSave: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  disabledText: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    padding: spacing.lg,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDismiss: {
    padding: 4,
  },
});
