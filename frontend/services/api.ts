import { UserProfile, DailyBriefing, JournalEntry, ChatMessage, CurrentTransits } from '../types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export const api = {
  // User endpoints
  async createUser(data: {
    supabase_id?: string;
    display_name: string;
    email?: string;
    birth_date: string;
    birth_time: string;
    latitude: number;
    longitude: number;
    city: string;
    timezone_str: string;
  }): Promise<UserProfile> {
    const res = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
  },

  async getUser(userId: string): Promise<UserProfile> {
    const res = await fetch(`${API_URL}/api/users/${userId}`);
    if (!res.ok) throw new Error('Failed to get user');
    return res.json();
  },

  async getUserBySupabase(supabaseId: string): Promise<UserProfile> {
    const res = await fetch(`${API_URL}/api/users/by-supabase/${supabaseId}`);
    if (!res.ok) throw new Error('User not found');
    return res.json();
  },

  // Briefing
  async getDailyBriefing(userId: string): Promise<DailyBriefing> {
    const res = await fetch(`${API_URL}/api/briefing/${userId}`);
    if (!res.ok) throw new Error('Failed to get briefing');
    return res.json();
  },

  // Transits
  async getTransits(userId: string): Promise<CurrentTransits> {
    const res = await fetch(`${API_URL}/api/astrology/transits/${userId}`);
    if (!res.ok) throw new Error('Failed to get transits');
    return res.json();
  },

  // Journal
  async createJournalEntry(userId: string, data: {
    content: string;
    mood: number;
    tags: string[];
    prompt: string;
  }): Promise<JournalEntry> {
    const res = await fetch(`${API_URL}/api/journal/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create entry');
    return res.json();
  },

  async getJournalEntries(userId: string, limit = 50, skip = 0): Promise<JournalEntry[]> {
    const res = await fetch(`${API_URL}/api/journal/${userId}?limit=${limit}&skip=${skip}`);
    if (!res.ok) throw new Error('Failed to get entries');
    return res.json();
  },

  async updateJournalEntry(entryId: string, data: {
    content?: string;
    mood?: number;
    tags?: string[];
  }): Promise<JournalEntry> {
    const res = await fetch(`${API_URL}/api/journal/entry/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update entry');
    return res.json();
  },

  async deleteJournalEntry(entryId: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/journal/entry/${entryId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete entry');
  },

  async getJournalPrompt(userId: string): Promise<{ prompt: string }> {
    const res = await fetch(`${API_URL}/api/journal/prompt/${userId}`);
    if (!res.ok) throw new Error('Failed to get prompt');
    return res.json();
  },

  // Chat
  async sendChatMessage(userId: string, data: {
    message: string;
    conversation_id?: string;
  }): Promise<{
    conversation_id: string;
    user_message: ChatMessage;
    ai_message: ChatMessage;
  }> {
    const res = await fetch(`${API_URL}/api/chat/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  async getChatHistory(conversationId: string): Promise<ChatMessage[]> {
    const res = await fetch(`${API_URL}/api/chat/history/${conversationId}`);
    if (!res.ok) throw new Error('Failed to get history');
    return res.json();
  },

  async getConversations(userId: string): Promise<Array<{
    conversation_id: string;
    last_message: string;
    last_at: string;
    message_count: number;
  }>> {
    const res = await fetch(`${API_URL}/api/chat/conversations/${userId}`);
    if (!res.ok) throw new Error('Failed to get conversations');
    return res.json();
  },
};
