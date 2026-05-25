import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAppStore } from './store/appStore';
import { useKeyboard } from './hooks/useKeyboard';
import Navbar from './components/Navbar';
import ToastContainer from './components/Toast';
import PWABadge from './components/PWABadge';
import SplashScreen from './components/SplashScreen';
import { useMatchStore } from './store/matchStore';
import { syncLiveMatch, auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useStatsStore } from './store/statsStore';

// Subscribe to store changes to sync with Firebase
useMatchStore.subscribe((state) => {
  if (state.match) {
    syncLiveMatch(state.match.id.toString(), state.match);
  }
});

// Pages
import SetupPage from './pages/SetupPage';
import ScorerPage from './pages/ScorerPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import SpectatorPage from './pages/SpectatorPage';
import StatsPage from './pages/StatsPage';
import DraftPage from './pages/DraftPage';
import BroadcastPage from './pages/BroadcastPage';
import ArchivesPage from './pages/ArchivesPage';
import TournamentDashboard from './pages/TournamentDashboard';
import PlayersPage from './pages/PlayersPage';

import LoginPage from './pages/LoginPage';

// Simple Auth Wrapper
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const firebaseUser = useAppStore((s) => s.firebaseUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      useAppStore.getState().setFirebaseUser(user);
      if (user) {
        import('./store/historyStore').then(({ useHistoryStore }) => {
          const store = useHistoryStore.getState();
          store.syncToFirestore(user.uid); // Upload any local matches
          store.loadFromFirestore(user.uid); // Download cloud matches
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--chalk)' }}>Authenticating...</div>;
  }

  if (!firebaseUser) return <LoginPage />;
  return <>{children}</>;
}

function GlobalDatalist() {
  const players = useStatsStore((s) => s.players);
  return (
    <datalist id="historical-players">
      {Object.keys(players).map(p => (
        <option key={p} value={p} />
      ))}
    </datalist>
  );
}

export default function App() {
  const theme = useAppStore((s) => s.settings.theme);
  const fontSize = useAppStore((s) => s.settings.fontSize);
  const colorAccent = useAppStore((s) => s.settings.colorAccent);
  const setDeferredPrompt = useAppStore((s) => s.setDeferredPrompt);

  // Apply theme and font size to document body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-fontsize', fontSize);
    document.documentElement.setAttribute('data-accent', colorAccent);
  }, [theme, fontSize, colorAccent]);

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [setDeferredPrompt]);

  // Network Status Polish
  const addToast = useAppStore((s) => s.addToast);
  useEffect(() => {
    const handleOffline = () => addToast('You are offline. Match data is saved locally.', 'danger', 4000);
    const handleOnline = () => addToast('Back online! Syncing match data...', 'success', 3000);
    
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [addToast]);

  // Global keyboard shortcuts (only active when match is active, handled inside hook)
  useKeyboard();

  return (
    <div className="app-shell">
      <SplashScreen />
      <GlobalDatalist />
      <header className="top-header">
        <div className="nav-brand">
          🏏 <span>Backyard</span> Cricket
        </div>
      </header>
      <main className="scroll-area">
        <Routes>
          <Route path="/" element={<AuthWrapper><SetupPage /></AuthWrapper>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup" element={<AuthWrapper><SetupPage /></AuthWrapper>} />
          <Route path="/scorer" element={<AuthWrapper><ScorerPage /></AuthWrapper>} />
          <Route path="/draft" element={<DraftPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/broadcast" element={<BroadcastPage />} />
          <Route path="/archives" element={<ArchivesPage />} />
          <Route path="/tournament" element={<TournamentDashboard />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/live/:matchId" element={<SpectatorPage />} />
        </Routes>
      </main>
      <Navbar />
      <PWABadge />
      <ToastContainer />
    </div>
  );
}
