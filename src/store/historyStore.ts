// ═══════════════════════════════════════════════════════
//  HISTORY STORE v3.0 (Zustand + persist)
// ═══════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Match } from '../types/cricket';

interface HistoryState {
  matches: Match[];
  saveMatch: (match: Match) => void;
  deleteMatch: (id: number) => void;
  clearHistory: () => void;
  searchHistory: (query: string) => Match[];
  importMatches: (matches: Match[]) => void;
  getStorageInfo: () => { used: number; limit: number; matchCount: number };
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      matches: [],

      saveMatch: (match) => {
        set((state) => ({
          matches: [match, ...state.matches.filter(m => m.id !== match.id)].slice(0, 200),
        }));
      },

      deleteMatch: (id) => {
        set((state) => ({
          matches: state.matches.filter((m) => m.id !== id),
        }));
      },

      clearHistory: () => {
        set({ matches: [] });
      },

      searchHistory: (query) => {
        const q = query.toLowerCase();
        return get().matches.filter(
          (m) =>
            m.teams[0].toLowerCase().includes(q) ||
            m.teams[1].toLowerCase().includes(q) ||
            m.winner.toLowerCase().includes(q) ||
            m.date.toLowerCase().includes(q) ||
            (m.venue && m.venue.toLowerCase().includes(q)) ||
            (m.seriesName && m.seriesName.toLowerCase().includes(q)) ||
            (m.matchType && m.matchType.toLowerCase().includes(q))
        );
      },

      importMatches: (matches) => {
        set((state) => {
          const existingIds = new Set(state.matches.map((m) => m.id));
          const newMatches = matches.filter((m) => !existingIds.has(m.id));
          return { matches: [...newMatches, ...state.matches].slice(0, 200) };
        });
      },

      getStorageInfo: () => {
        const raw = localStorage.getItem('cricket-history');
        const used = raw ? new Blob([raw]).size : 0;
        return {
          used,
          limit: 5 * 1024 * 1024, // 5MB typical limit
          matchCount: get().matches.length,
        };
      },
    }),
    {
      name: 'cricket-history',
    }
  )
);
