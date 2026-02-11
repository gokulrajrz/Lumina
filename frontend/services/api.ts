/**
 * API Service — Communicates with the Lumina backend.
 * All requests include the Supabase auth token for JWT verification.
 */

import { supabase } from './supabase';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

class APIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

/**
 * Get auth headers with the current Supabase session token.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.warn('Failed to get auth session for API call:', error);
  }

  return headers;
}

/**
 * Base fetch wrapper with auth, error handling, and retry logic.
 */
async function fetchAPI<T>(
  path: string,
  options: RequestInit = {},
  retries: number = 1,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = await getAuthHeaders();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let message = `API Error: ${response.status}`;
        try {
          const parsed = JSON.parse(errorBody);
          if (parsed.detail) {
            message = typeof parsed.detail === 'object'
              ? JSON.stringify(parsed.detail)
              : parsed.detail;
          }
        } catch {
          message = errorBody || message;
        }
        throw new APIError(message, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) throw error;

      // Network error — retry if attempts remain
      if (attempt < retries) {
        console.warn(`API request failed (attempt ${attempt + 1}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }

      throw new APIError(
        error instanceof Error ? error.message : 'Network error',
        0,
      );
    }
  }

  throw new APIError('Request failed after retries', 0);
}

// ── User APIs ──

export const api = {
  /**
   * Create a new user profile.
   */
  async createUser(data: {
    display_name: string;
    email?: string;
    birth_date: string;
    birth_time: string;
    latitude: number;
    longitude: number;
    city: string;
    timezone_str: string;
  }): Promise<any> {
    return fetchAPI('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get the currently authenticated user's profile.
   */
  async getCurrentUser(): Promise<any> {
    return fetchAPI('/api/users/me');
  },

  /**
   * Get a user by their internal user_id.
   */
  async getUser(userId: string): Promise<any> {
    return fetchAPI(`/api/users/${userId}`);
  },

  /**
   * Get a user by their Supabase auth ID.
   */
  async getUserBySupabaseId(supabaseId: string): Promise<any> {
    return fetchAPI(`/api/users/by-supabase/${supabaseId}`);
  },

  // ── Daily Briefing ──

  async getDailyBriefing(userId: string): Promise<any> {
    return fetchAPI(`/api/briefing/${userId}`);
  },

  // ── Journal ──

  async getJournalEntries(userId: string): Promise<any[]> {
    return fetchAPI(`/api/journal/${userId}`);
  },

  async createJournalEntry(
    userId: string,
    data: { content: string; mood: number; tags?: string[]; prompt?: string },
  ): Promise<any> {
    return fetchAPI(`/api/journal/${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateJournalEntry(
    entryId: string,
    data: { content?: string; mood?: number; tags?: string[] },
  ): Promise<any> {
    return fetchAPI(`/api/journal/entry/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteJournalEntry(entryId: string): Promise<any> {
    return fetchAPI(`/api/journal/entry/${entryId}`, {
      method: 'DELETE',
    });
  },

  async getJournalPrompt(userId: string): Promise<{ prompt: string }> {
    return fetchAPI(`/api/journal/prompt/${userId}`);
  },

  // ── Chat ──

  async sendChatMessage(
    userId: string,
    message: string,
    conversationId?: string,
  ): Promise<{
    conversation_id: string;
    user_message: any;
    ai_message: any;
  }> {
    return fetchAPI(`/api/chat/${userId}`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
      }),
    });
  },

  async getChatHistory(conversationId: string): Promise<any[]> {
    return fetchAPI(`/api/chat/history/${conversationId}`);
  },

  async getConversations(userId: string): Promise<any[]> {
    return fetchAPI(`/api/chat/conversations/${userId}`);
  },

  // ── Astrology ──

  async calculateBirthChart(data: {
    birth_date: string;
    birth_time: string;
    latitude: number;
    longitude: number;
    city: string;
    timezone_str?: string;
  }): Promise<any> {
    return fetchAPI('/api/astrology/birth-chart', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getTransits(userId: string): Promise<any> {
    return fetchAPI(`/api/astrology/transits/${userId}`);
  },

  // ── Health ──

  async healthCheck(): Promise<any> {
    return fetchAPI('/health');
  },
};
