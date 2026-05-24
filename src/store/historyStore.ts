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
  syncToFirestore: (uid: string) => Promise<void>;
  loadFromFirestore: (uid: string) => Promise<void>;
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
        
        // Also sync to firestore if logged in
        import('./appStore').then(({ useAppStore }) => {
          const user = useAppStore.getState().firebaseUser;
          if (user) {
            get().syncToFirestore(user.uid);
          }
        });
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

      syncToFirestore: async (uid: string) => {
        const { firestore } = await import('../lib/firebase');
        if (!firestore) return;
        const { doc, setDoc } = await import('firebase/firestore');
        
        const state = get();
        for (const match of state.matches) {
          try {
            // Firestore forbids nested arrays, so we must flatten/objectify `players` and `battingOrder`
            const safeMatch = JSON.parse(JSON.stringify(match));
            if (Array.isArray(safeMatch.players)) {
              safeMatch.players = { 0: safeMatch.players[0] || [], 1: safeMatch.players[1] || [] };
            }
            if (Array.isArray(safeMatch.battingOrder)) {
              safeMatch.battingOrder = { 0: safeMatch.battingOrder[0] || [], 1: safeMatch.battingOrder[1] || [] };
            }
            
            await setDoc(doc(firestore, `users/${uid}/matches`, match.id.toString()), safeMatch, { merge: true });
          } catch (e) {
            console.error('Error syncing match to firestore:', e);
          }
        }
      },

      loadFromFirestore: async (uid: string) => {
        const { firestore } = await import('../lib/firebase');
        if (!firestore) return;
        const { collection, getDocs } = await import('firebase/firestore');

        try {
          const snapshot = await getDocs(collection(firestore, `users/${uid}/matches`));
          const cloudMatches: Match[] = [];
          
          snapshot.forEach(docSnap => {
            const m = docSnap.data();
            // Restore nested arrays
            if (m.players && !Array.isArray(m.players)) {
              m.players = [m.players['0'] || [], m.players['1'] || []];
            }
            if (m.battingOrder && !Array.isArray(m.battingOrder)) {
              m.battingOrder = [m.battingOrder['0'] || [], m.battingOrder['1'] || []];
            }
            cloudMatches.push(m as Match);
          });
          
          if (cloudMatches.length > 0) {
            // Merge with local matches
            get().importMatches(cloudMatches);
            
            // Recompute stats from combined history
            import('./statsStore').then(({ useStatsStore }) => {
              useStatsStore.getState().recomputeAllStats(get().matches);
            });
          }
        } catch (e) {
          console.error('Error loading history from firestore:', e);
        }
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
