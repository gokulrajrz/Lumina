/**
 * Journal Store — Manages journal entries with Zustand persist.
 * Entries are cached locally for offline viewing.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { JournalEntry } from '../types';

interface JournalState {
  entries: JournalEntry[];
  selectedEntry: JournalEntry | null;
  isLoading: boolean;
  lastFetched: number | null;

  loadEntries: (userId: string) => Promise<void>;
  addEntry: (
    userId: string,
    data: { content: string; mood: number; tags?: string[]; prompt?: string; audio_url?: string },
  ) => Promise<void>;
  updateEntry: (
    entryId: string,
    data: { content?: string; mood?: number; tags?: string[]; audio_url?: string },
  ) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  selectEntry: (entry: JournalEntry | null) => void;
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],
      selectedEntry: null,
      isLoading: false,
      lastFetched: null,

      loadEntries: async (userId) => {
        set({ isLoading: true });
        try {
          const entries = await api.getJournalEntries(userId);
          set({
            entries,
            isLoading: false,
            lastFetched: Date.now(),
          });
        } catch (error) {
          console.error('Failed to load journal entries:', error);
          set({ isLoading: false });
        }
      },

      addEntry: async (userId, data) => {
        set({ isLoading: true });
        try {
          const newEntry = await api.createJournalEntry(userId, data);
          set((state) => ({
            entries: [newEntry, ...state.entries],
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateEntry: async (entryId, data) => {
        try {
          const updated = await api.updateJournalEntry(entryId, data);
          set((state) => ({
            entries: state.entries.map((e) =>
              e.entry_id === entryId ? { ...e, ...updated } : e,
            ),
          }));
        } catch (error) {
          throw error;
        }
      },

      deleteEntry: async (entryId) => {
        try {
          await api.deleteJournalEntry(entryId);
          set((state) => ({
            entries: state.entries.filter((e) => e.entry_id !== entryId),
            selectedEntry:
              state.selectedEntry?.entry_id === entryId
                ? null
                : state.selectedEntry,
          }));
        } catch (error) {
          throw error;
        }
      },

      selectEntry: (entry) => set({ selectedEntry: entry }),
    }),
    {
      name: 'lumina-journal-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        entries: state.entries,
        lastFetched: state.lastFetched,
      }),
    },
  ),
);
