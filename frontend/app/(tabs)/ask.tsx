/**
 * Ask AI Screen — Chat with Lumina AI with conversation management.
 */

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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
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
        style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}
        accessibilityLabel={`${isUser ? 'You' : 'Lumina'} said: ${item.content}`}
      >
        {!isUser && (
          <Text style={styles.aiLabel}>✨ Lumina</Text>
        )}
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <ErrorBoundary>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">Ask Lumina</Text>
          <TouchableOpacity
            onPress={handleNewChat}
            style={styles.newChatButton}
            accessibilityLabel="Start a new conversation"
            accessibilityRole="button"
          >
            <Ionicons name="create-outline" size={22} color={colors.primary} />
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
                  style={styles.suggestionChip}
                  onPress={() => setInput(suggestion)}
                  accessibilityLabel={`Suggestion: ${suggestion}`}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
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
          <TextInput
            style={styles.input}
            placeholder="Ask the cosmos..."
            placeholderTextColor={colors.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            accessibilityLabel="Type your message"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
            style={[
              styles.sendButton,
              (!input.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            accessibilityLabel="Send message"
            accessibilityRole="button"
          >
            <Ionicons
              name="arrow-up-circle"
              size={36}
              color={input.trim() && !isLoading ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceHover,
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
  },
  newChatText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  messageList: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  aiLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 4,
  },
  messageText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceHover,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    maxHeight: 120,
    marginRight: spacing.sm,
  },
  sendButton: {
    paddingBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceHover,
  },
  suggestionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
});
