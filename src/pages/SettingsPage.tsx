import { useAppStore } from '../store/appStore';
import { useMatchStore } from '../store/matchStore';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Smartphone, Volume2, Sparkles, Activity, Tv } from 'lucide-react';
import './SettingsPage.css';

export default function SettingsPage() {
  const navigate = useNavigate();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const factoryResetApp = useAppStore((s) => s.factoryResetApp);
  const deferredInstallPrompt = useAppStore((s) => s.deferredInstallPrompt) as any;
  const setDeferredPrompt = useAppStore((s) => s.setDeferredPrompt);
  
  // Also need to clear match if factory reset
  const clearMatch = useMatchStore((s) => s.newMatch);
  
  function handleReset() {
    if (window.confirm('WARNING: This will wipe all app settings, current match data, and return everything to default. History will be kept. Proceed?')) {
      factoryResetApp();
      clearMatch();
      window.location.reload(); // Hard reload to clear all states just in case
    }
  }

  async function handleInstall() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }

  return (
    <div className="view-container settings-page">
      {deferredInstallPrompt && (
        <div className="glass-card" style={{ marginBottom: 24, padding: 16, border: '1px solid var(--gold)', background: 'rgba(255, 160, 0, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>Install Backyard Cricket</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Add to your home screen for offline use.</div>
            </div>
            <button className="btn-primary" onClick={handleInstall} style={{ padding: '8px 16px', fontSize: 14 }}>
              INSTALL
            </button>
          </div>
        </div>
      )}

      {/* NEW MENU HUB SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <button 
          className="glass-card slide-down" 
          onClick={() => navigate('/draft')}
          style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        >
          <div style={{ padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gold)' }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 13 }}>Player Draft</span>
        </button>

        <button 
          className="glass-card slide-down" 
          onClick={() => navigate('/stats')}
          style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animationDelay: '0.05s' }}
        >
          <div style={{ padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--blue)' }}><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 13 }}>Player Stats</span>
        </button>

        <button 
          className="glass-card slide-down" 
          onClick={() => navigate('/archives')}
          style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animationDelay: '0.1s', gridColumn: 'span 2' }}
        >
          <div style={{ padding: 12, background: 'rgba(255,215,0,0.1)', borderRadius: '50%', border: '1px solid rgba(255,215,0,0.2)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gold)' }}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 13 }}>Hall of Fame Archives</span>
        </button>
      </div>

      <div className="glass-card" style={{ marginBottom: 24, padding: 16, border: '1px solid var(--blue)', background: 'rgba(52, 152, 219, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--blue)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><Tv size={16}/> TV Broadcast Mode</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Launch a green-screen scorebug for OBS/Twitch.</div>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/broadcast')} style={{ padding: '8px 16px', fontSize: 14 }}>
            LAUNCH
          </button>
        </div>
      </div>

      <div className="glass-card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Moon size={16} /> DISPLAY & THEME
        </div>
        
        <div className="setting-row">
          <div>
            <div className="setting-label">Theme Mode</div>
            <div className="setting-desc">Switch between light and dark modes</div>
          </div>
          <div className="theme-toggle">
            <button 
              className={`theme-btn ${settings.theme === 'light' ? 'active' : ''}`}
              onClick={() => updateSettings({ theme: 'light' })}
            >
              <Sun size={14} /> Light
            </button>
            <button 
              className={`theme-btn ${settings.theme === 'dark' ? 'active' : ''}`}
              onClick={() => updateSettings({ theme: 'dark' })}
            >
              <Moon size={14} /> Dark
            </button>
            <button 
              className={`theme-btn ${settings.theme === 'system' ? 'active' : ''}`}
              onClick={() => updateSettings({ theme: 'system' })}
            >
              <Smartphone size={14} /> Auto
            </button>
          </div>
        </div>

        <div className="setting-row">
          <div>
            <div className="setting-label">Accent Color</div>
            <div className="setting-desc">Primary brand color for the app</div>
          </div>
          <select 
            value={settings.colorAccent}
            onChange={(e) => updateSettings({ colorAccent: e.target.value as any })}
            style={{ width: 120 }}
          >
            <option value="gold">Gold (Default)</option>
            <option value="green">Grass Green</option>
            <option value="blue">Ocean Blue</option>
            <option value="purple">Royal Purple</option>
            <option value="red">Cherry Red</option>
          </select>
        </div>
      </div>

      <div className="glass-card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} /> INTERACTION
        </div>
        
        <label className="setting-row cursor-pointer">
          <div>
            <div className="setting-label">Haptic Feedback</div>
            <div className="setting-desc">Vibrate device on scoring actions (supported devices only)</div>
          </div>
          <input 
            type="checkbox" 
            className="toggle-switch"
            checked={settings.hapticEnabled}
            onChange={(e) => updateSettings({ hapticEnabled: e.target.checked })}
          />
        </label>

        <label className="setting-row cursor-pointer">
          <div>
            <div className="setting-label">Sound Effects</div>
            <div className="setting-desc">Play sounds for boundaries and wickets</div>
          </div>
          <input 
            type="checkbox" 
            className="toggle-switch"
            checked={settings.soundEnabled}
            onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
          />
        </label>

        <label className="setting-row cursor-pointer">
          <div>
            <div className="setting-label">Auto-play Celebrations</div>
            <div className="setting-desc">Show confetti overlays for milestones (50s, 100s, 5-fers)</div>
          </div>
          <input 
            type="checkbox" 
            className="toggle-switch"
            checked={settings.autoPlayCelebrations}
            onChange={(e) => updateSettings({ autoPlayCelebrations: e.target.checked })}
          />
        </label>
      </div>

      <div className="glass-card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} /> WORKFLOW
        </div>

        <label className="setting-row cursor-pointer">
          <div>
            <div className="setting-label">Auto-show Over Summary</div>
            <div className="setting-desc">Automatically pop up the summary modal at the end of each over</div>
          </div>
          <input 
            type="checkbox" 
            className="toggle-switch"
            checked={settings.autoShowOverSummary}
            onChange={(e) => updateSettings({ autoShowOverSummary: e.target.checked })}
          />
        </label>
      </div>

      <div className="glass-card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} /> DATA BACKUP & SYNC
        </div>

        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius)', marginTop: 12, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Cloud Sync</div>
            {useAppStore.getState().firebaseUser ? (
              <div style={{ fontSize: 10, background: 'rgba(46, 204, 113, 0.15)', color: 'var(--green)', padding: '2px 6px', borderRadius: 10 }}>CONNECTED</div>
            ) : (
              <div style={{ fontSize: 10, background: 'rgba(231, 76, 60, 0.15)', color: 'var(--red)', padding: '2px 6px', borderRadius: 10 }}>NOT CONNECTED</div>
            )}
          </div>
          
          {useAppStore.getState().firebaseUser ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {useAppStore.getState().firebaseUser?.photoURL ? (
                  <img src={useAppStore.getState().firebaseUser?.photoURL!} alt="Profile" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>
                    {useAppStore.getState().firebaseUser?.displayName?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 'bold' }}>{useAppStore.getState().firebaseUser?.displayName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Synced to Cloud</div>
                </div>
              </div>
              <button 
                className="btn-secondary" 
                style={{ padding: '6px 12px', fontSize: 12 }}
                onClick={async () => {
                  if (window.confirm('Are you sure you want to sign out? Local data will remain on device.')) {
                    const { auth } = await import('../lib/firebase');
                    const { signOut } = await import('firebase/auth');
                    if (auth) {
                      await signOut(auth);
                      useAppStore.getState().setFirebaseUser(null);
                      navigate('/login');
                    }
                  }
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              To enable automatic cloud sync and Google Sign-in, log in via the Welcome screen.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button 
            className="btn-secondary" 
            style={{ flex: 1, padding: 12, fontSize: 13 }}
            onClick={() => {
              const data = localStorage.getItem('backyard-cricket-stats');
              if (!data) return alert('No stats found!');
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `backyard_cricket_backup_${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
          >
            Export Backup
          </button>
          
          <label className="btn-secondary" style={{ flex: 1, padding: 12, fontSize: 13, textAlign: 'center', cursor: 'pointer' }}>
            Import Backup
            <input 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                  const content = e.target?.result;
                  if (typeof content === 'string') {
                    localStorage.setItem('backyard-cricket-stats', content);
                    alert('Backup restored! Reloading app...');
                    window.location.reload();
                  }
                };
                reader.readAsText(file);
              }}
            />
          </label>
        </div>
      </div>

      <button 
        className="btn-secondary" 
        style={{ width: '100%', marginTop: 24, color: 'var(--leather-light)', borderColor: 'rgba(231,76,60,0.3)' }}
        onClick={handleReset}
      >
        FACTORY RESET APP SETTINGS
      </button>

      <div style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: 'var(--text-faint)' }}>
        Backyard Scorer v3.0<br/>
        Built with React & Zustand
      </div>
    </div>
  );
}
