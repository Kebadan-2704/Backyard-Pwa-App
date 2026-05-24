import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, off, get } from 'firebase/database';
import type { Match } from '../types/cricket';

// TODO: Replace with actual Firebase config from console
const firebaseConfig = {
  apiKey: "AIzaSyAdN-rnoYuNk68hUj4oTEDgP3XkGAebVgY",
  authDomain: "backyard-786cd.firebaseapp.com",
  databaseURL: "https://backyard-786cd-default-rtdb.firebaseio.com",
  projectId: "backyard-786cd",
  storageBucket: "backyard-786cd.firebasestorage.app",
  messagingSenderId: "642678416834",
  appId: "1:642678416834:web:c9945f824c7b8feef1a25b"
};

// Initialize Firebase only if config is provided (prevents crashing if not setup)
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const db = app ? getDatabase(app) : null;

/**
 * Pushes the live match state to Firebase Realtime Database
 */
export function syncLiveMatch(matchId: string, matchData: Match) {
  if (!db) return;
  const matchRef = ref(db, `live_matches/${matchId}`);
  set(matchRef, matchData).catch(err => console.error("Firebase sync error:", err));
}

/**
 * Subscribes to a live match (for spectator mode)
 */
export function subscribeToMatch(matchId: string, callback: (data: Match | null) => void) {
  if (!db) {
    callback(null);
    return () => {};
  }
  
  const matchRef = ref(db, `live_matches/${matchId}`);
  onValue(matchRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as Match);
    } else {
      callback(null);
    }
  });

  return () => off(matchRef);
}

/**
 * Listens only to the activeScorerId to detect handovers without infinite loops
 */
export function listenToActiveScorer(matchId: string, callback: (scorerId: string) => void) {
  if (!db) {
    return () => {};
  }
  const scorerRef = ref(db, `live_matches/${matchId}/activeScorerId`);
  onValue(scorerRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
  return () => off(scorerRef);
}

/**
 * Fetches a live match once (for importing/taking over scoring)
 */
export async function fetchMatch(matchId: string): Promise<Match | null> {
  if (!db) return null;
  const matchRef = ref(db, `live_matches/${matchId}`);
  try {
    const snapshot = await get(matchRef);
    if (snapshot.exists()) {
      return snapshot.val() as Match;
    }
    return null;
  } catch (err) {
    console.error("Firebase fetch error:", err);
    return null;
  }
}
