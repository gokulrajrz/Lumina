import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '../../components/ui/Layout/GradientBackground';
import { GlassView } from '../../components/ui/Layout/GlassView';
import { ChatSkeleton } from '../../components/ui/SkeletonLoader';
import { useUserStore } from '../../stores/userStore';
import { useChatStore } from '../../stores/chatStore';
import { colors, spacing, typography } from '../../constants/theme';

export default function AskScreen() {
  const { profile } = useUserStore();
  const { messages, isLoading, sendMessage, newConversation } = useChatStore();

  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !profile?.user_id || isLoading) return;

    setInput('');
    try {
      await sendMessage(profile.user_id, trimmed);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send message.');
    }
  };

  const handleNewChat = () => {
    newConversation();
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}
      >
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={16} color={colors.background} />
          </View>
        )}
        <View
          style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}
        >
          {!isUser && (
            <Text style={styles.aiLabel}>Lumina</Text>
          )}
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <GradientBackground>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ask Lumina</Text>
          <TouchableOpacity
            onPress={handleNewChat}
            style={styles.newChatButton}
          >
            <Ionicons name="create-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.newChatText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {messages.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌟</Text>
            <Text style={styles.emptyTitle}>Ask Lumina anything</Text>
            <Text style={styles.emptyText}>
              Get cosmic insights about your day, relationships, career, or personal growth.
            </Text>
            <View style={styles.suggestions}>
              {[
                'How does my Sun sign affect my career?',
                'What should I focus on today?',
                "What's my love language based on my chart?",
              ].map((suggestion, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setInput(suggestion)}
                >
                  <View style={styles.suggestionChip}>
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => item.message_id || `msg-${index}`}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd}
            keyboardDismissMode="on-drag"
          />
        )}

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>✨ Lumina is thinking...</Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            onPress={() => Keyboard.dismiss()}
            style={styles.dismissButton}
          >
            <Ionicons name="chevron-down" size={24} color={colors.textTertiary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Ask the cosmos..."
            placeholderTextColor={colors.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
            style={[
              styles.sendButton,
              (!input.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
          >
            <Ionicons
              name="arrow-up-circle"
              size={40}
              color={input.trim() && !isLoading ? colors.textPrimary : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl * 1.5,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  newChatText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  messageList: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  userBubble: {
    backgroundColor: colors.surfaceHighlight,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  aiLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  messageText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.textPrimary,
  },
  typingIndicator: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  typingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    paddingBottom: spacing.xl,
    marginBottom: 85,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    maxHeight: 120,
    marginRight: spacing.sm,
  },
  dismissButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
  },
  sendButton: {
    paddingBottom: 4,
  },
  sendButtonDisabled: {
    opacity: 0.3,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  suggestions: {
    width: '100%',
    gap: spacing.sm,
  },
  suggestionChip: {
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  suggestionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
