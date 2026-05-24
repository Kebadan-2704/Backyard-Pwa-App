import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAppStore } from './store/appStore';
import { useKeyboard } from './hooks/useKeyboard';
import Navbar from './components/Navbar';
import ToastContainer from './components/Toast';
import PWABadge from './components/PWABadge';
import SplashScreen from './components/SplashScreen';
import { useMatchStore } from './store/matchStore';
import { syncLiveMatch } from './lib/firebase';

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

export default function App() {
  const theme = useAppStore((s) => s.settings.theme);
  const fontSize = useAppStore((s) => s.settings.fontSize);
  const setDeferredPrompt = useAppStore((s) => s.setDeferredPrompt);

  // Apply theme and font size to document body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-fontsize', fontSize);
  }, [theme, fontSize]);

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
      <header className="top-header">
        <div className="nav-brand">
          🏏 <span>Backyard</span> Cricket
        </div>
      </header>
      <main className="scroll-area">
        <Routes>
          <Route path="/" element={<SetupPage />} />
          <Route path="/scorer" element={<ScorerPage />} />
          <Route path="/draft" element={<DraftPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/broadcast" element={<BroadcastPage />} />
          <Route path="/live/:matchId" element={<SpectatorPage />} />
        </Routes>
      </main>
      <Navbar />
      <PWABadge />
      <ToastContainer />
    </div>
  );
}
