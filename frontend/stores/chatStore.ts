import { create } from 'zustand';
import { ChatMessage } from '../types';
import { api } from '../services/api';

interface ChatState {
  messages: ChatMessage[];
  conversationId: string | null;
  isLoading: boolean;
  sendMessage: (userId: string, message: string) => Promise<void>;
  loadHistory: (conversationId: string) => Promise<void>;
  startNewConversation: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  conversationId: null,
  isLoading: false,

  sendMessage: async (userId, message) => {
    set({ isLoading: true });
    try {
      const response = await api.sendChatMessage(userId, {
        message,
        conversation_id: get().conversationId || undefined,
      });
      
      set({
        conversationId: response.conversation_id,
        messages: [...get().messages, response.user_message, response.ai_message],
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  loadHistory: async (conversationId) => {
    set({ isLoading: true });
    try {
      const messages = await api.getChatHistory(conversationId);
      set({ messages, conversationId, isLoading: false });
    } catch (error) {
      console.error('Failed to load history:', error);
      set({ isLoading: false });
    }
  },

  startNewConversation: () => {
    set({ messages: [], conversationId: null });
  },
}));
