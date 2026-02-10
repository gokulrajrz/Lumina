/**
 * Chat Store — Manages chat messages and conversations.
 * Persists active conversation locally.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { ChatMessage } from '../types';

interface ChatState {
  messages: ChatMessage[];
  conversationId: string | null;
  isLoading: boolean;

  sendMessage: (userId: string, message: string) => Promise<void>;
  loadHistory: (conversationId: string) => Promise<void>;
  newConversation: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      conversationId: null,
      isLoading: false,

      sendMessage: async (userId, message) => {
        set({ isLoading: true });

        try {
          const result = await api.sendChatMessage(
            userId,
            message,
            get().conversationId || undefined,
          );

          set((state) => ({
            messages: [...state.messages, result.user_message, result.ai_message],
            conversationId: result.conversation_id,
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loadHistory: async (conversationId) => {
        set({ isLoading: true });
        try {
          const messages = await api.getChatHistory(conversationId);
          set({
            messages,
            conversationId,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to load chat history:', error);
          set({ isLoading: false });
        }
      },

      newConversation: () => {
        set({
          messages: [],
          conversationId: null,
        });
      },
    }),
    {
      name: 'lumina-chat-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        messages: state.messages,
        conversationId: state.conversationId,
      }),
    },
  ),
);
