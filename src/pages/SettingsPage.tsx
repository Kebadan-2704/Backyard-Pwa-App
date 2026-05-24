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
            <div style={{ fontSize: 10, background: 'rgba(231, 76, 60, 0.15)', color: 'var(--red)', padding: '2px 6px', borderRadius: 10 }}>NOT CONFIGURED</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            To enable automatic cloud sync and Google Sign-in, you must add your Firebase configuration keys to <code>src/lib/firebase.ts</code>.
          </div>
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
