import { create } from 'zustand';
import { JournalEntry } from '../types';
import { api } from '../services/api';

interface JournalState {
  entries: JournalEntry[];
  currentEntry: JournalEntry | null;
  isLoading: boolean;
  loadEntries: (userId: string) => Promise<void>;
  addEntry: (userId: string, data: {
    content: string;
    mood: number;
    tags: string[];
    prompt: string;
  }) => Promise<void>;
  updateEntry: (entryId: string, data: {
    content?: string;
    mood?: number;
    tags?: string[];
  }) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  setCurrentEntry: (entry: JournalEntry | null) => void;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  currentEntry: null,
  isLoading: false,

  loadEntries: async (userId) => {
    set({ isLoading: true });
    try {
      const entries = await api.getJournalEntries(userId);
      set({ entries, isLoading: false });
    } catch (error) {
      console.error('Failed to load entries:', error);
      set({ isLoading: false });
    }
  },

  addEntry: async (userId, data) => {
    try {
      const entry = await api.createJournalEntry(userId, data);
      set({ entries: [entry, ...get().entries] });
    } catch (error) {
      console.error('Failed to add entry:', error);
      throw error;
    }
  },

  updateEntry: async (entryId, data) => {
    try {
      const updated = await api.updateJournalEntry(entryId, data);
      set({
        entries: get().entries.map(e => e.entry_id === entryId ? updated : e)
      });
    } catch (error) {
      console.error('Failed to update entry:', error);
      throw error;
    }
  },

  deleteEntry: async (entryId) => {
    try {
      await api.deleteJournalEntry(entryId);
      set({ entries: get().entries.filter(e => e.entry_id !== entryId) });
    } catch (error) {
      console.error('Failed to delete entry:', error);
      throw error;
    }
  },

  setCurrentEntry: (entry) => {
    set({ currentEntry: entry });
  },
}));
