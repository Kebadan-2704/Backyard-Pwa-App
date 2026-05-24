import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchStore } from '../store/matchStore';
import { createDefaultSettings } from '../types/cricket';
import type { MatchSettings, MatchType, PitchCondition } from '../types/cricket';
import { ChevronRight, Settings2, ShieldAlert } from 'lucide-react';
import './SetupPage.css';

export default function SetupPage() {
  const navigate = useNavigate();
  const startMatch = useMatchStore((s) => s.startMatch);
  const activeMatch = useMatchStore((s) => s.match);

  const [t1, setT1] = useState('INDIA');
  const [t2, setT2] = useState('AUSTRALIA');
  const [overs, setOvers] = useState(6);
  const [tossW, setTossW] = useState('INDIA');
  const [tossC, setTossC] = useState<'bat' | 'bowl'>('bat');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<'heads' | 'tails' | null>(null);
  const [settings, setSettings] = useState<MatchSettings>(createDefaultSettings());
  
  // V3 specific fields
  const [matchType, setMatchType] = useState<MatchType>('friendly');
  const [pitchCondition, setPitchCondition] = useState<PitchCondition>('');
  const [venue, setVenue] = useState('');
  const [umpires, setUmpires] = useState('');
  
  // Players
  const [t1PlayersText, setT1PlayersText] = useState('');
  const [t2PlayersText, setT2PlayersText] = useState('');

  function handleStart() {
    if (!t1.trim() || !t2.trim()) return;
    if (!tossW) return;
    
    // Parse players
    const p1 = t1PlayersText.split(',').map(s => s.trim()).filter(Boolean);
    const p2 = t2PlayersText.split(',').map(s => s.trim()).filter(Boolean);

    const actualP1 = p1.length > 0 ? p1 : Array.from({length: settings.playersPerTeam}, (_,i)=>`Player ${i+1}`);
    const actualP2 = p2.length > 0 ? p2 : Array.from({length: settings.playersPerTeam}, (_,i)=>`Player ${i+1}`);
    const maxPlayers = Math.max(actualP1.length, actualP2.length, settings.playersPerTeam);
    const finalMaxWickets = Math.min(settings.maxWickets, maxPlayers - 1);

    startMatch({
      team1: t1,
      team2: t2,
      players1: actualP1,
      players2: actualP2,
      settings: { ...settings, overs, playersPerTeam: maxPlayers, maxWickets: finalMaxWickets },
      tossWinner: tossW,
      tossChoice: tossC,
      matchType,
      pitchCondition,
      venue,
      umpires,
    });
    navigate('/scorer');
  }

  function handleFlipCoin() {
    if (!t1.trim() || !t2.trim()) {
      alert("Please enter Team 1 and Team 2 names first.");
      return;
    }
    
    setIsFlipping(true);
    setCoinResult(null);
    setTossW('');

    // Play a CSS animation by toggling state, wait 3 seconds
    setTimeout(() => {
      const winner = Math.random() > 0.5 ? t1 : t2;
      setCoinResult(winner === t1 ? 'heads' : 'tails');
      setTossW(winner);
      setIsFlipping(false);
    }, 3000);
  }

  function handleResume() {
    navigate('/scorer');
  }

  // Update toss winner options dynamically when team names change
  const currentTossWinner = tossW === t1 ? t1 : tossW === t2 ? t2 : t1;

  return (
    <div className="view-container setup-page">
      {activeMatch && !activeMatch.complete && (
        <div className="glass-card" style={{ border: '2px solid var(--gold)', background: 'rgba(240, 165, 0, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <ShieldAlert color="var(--gold)" />
            <h3 style={{ color: 'var(--gold)' }}>Match in Progress</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            You have an active match ({activeMatch.teams[0]} vs {activeMatch.teams[1]}). Starting a new match will discard the current one unless saved.
          </p>
          <button className="btn-primary" onClick={handleResume} style={{ padding: 12, fontSize: 16 }}>
            RESUME MATCH
          </button>
        </div>
      )}

      <div className="glass-card">
        <div className="card-title">TEAMS</div>
        <div className="field">
          <label>Host Team</label>
          <input value={t1} onChange={(e) => setT1(e.target.value.toUpperCase())} maxLength={15} />
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Visitor Team</label>
          <input value={t2} onChange={(e) => setT2(e.target.value.toUpperCase())} maxLength={15} />
        </div>
      </div>

      <div className="glass-card">
        <div className="card-title">MATCH FORMAT</div>
        
        <div className="format-grid">
          <div className="field">
            <label>Overs per Innings</label>
            <input 
              type="number" 
              value={overs || ''} 
              onChange={(e) => setOvers(parseInt(e.target.value) || 0)}
              min={1} 
              max={50}
            />
          </div>
          
          <div className="field">
            <label>Match Type</label>
            <select value={matchType} onChange={(e) => setMatchType(e.target.value as MatchType)}>
              <option value="friendly">Friendly</option>
              <option value="practice">Practice</option>
              <option value="league">League Match</option>
              <option value="knockout">Knockout</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="card-title">TOSS</div>
        
        <div className="toss-container">
          <div className="coin-wrapper">
            <div className={`coin ${isFlipping ? 'flipping' : ''} ${coinResult === 'tails' ? 'tails-up' : ''}`} style={!isFlipping && coinResult === 'tails' ? { transform: 'rotateX(180deg)' } : {}}>
              <div className="coin-face coin-heads">{t1 || 'T1'}</div>
              <div className="coin-face coin-tails">{t2 || 'T2'}</div>
            </div>
          </div>
          
          <button 
            className="toss-action-btn" 
            onClick={handleFlipCoin} 
            disabled={isFlipping}
            type="button"
          >
            {isFlipping ? 'FLIPPING...' : tossW ? 'FLIP AGAIN' : 'FLIP COIN'}
          </button>
        </div>

        {tossW && !isFlipping && (
          <div className="field slide-down">
            <label style={{ textAlign: 'center', color: 'var(--gold)', fontSize: 16 }}>
              🎉 {tossW} WON THE TOSS! 🎉
            </label>
            <label style={{ marginTop: 12 }}>What is their decision?</label>
            <div className="toss-row">
              <button 
                className={`toss-btn ${tossC === 'bat' ? 'active' : ''}`}
                onClick={() => setTossC('bat')}
                type="button"
              >
                🏏 BAT FIRST
              </button>
              <button 
                className={`toss-btn ${tossC === 'bowl' ? 'active' : ''}`}
                onClick={() => setTossC('bowl')}
                type="button"
              >
                🥎 BOWL FIRST
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings2 size={16} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>ADVANCED SETTINGS & ROSTERS</span>
        </div>
        <ChevronRight size={16} style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {showAdvanced && (
        <div className="advanced-settings slide-down">
          <div className="glass-card">
            <div className="card-title">TEAM ROSTERS (Comma separated)</div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>{t1} Players</label>
              <textarea 
                value={t1PlayersText} 
                onChange={(e) => setT1PlayersText(e.target.value)}
                placeholder="Rahul, Virat, Surya..."
                rows={3}
              />
            </div>
            <div className="field">
              <label>{t2} Players</label>
              <textarea 
                value={t2PlayersText} 
                onChange={(e) => setT2PlayersText(e.target.value)}
                placeholder="Warner, Smith, Maxwell..."
                rows={3}
              />
            </div>
          </div>

          <div className="glass-card">
            <div className="card-title">CONDITIONS</div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Venue</label>
              <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Backyard Stadium" />
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Pitch Condition</label>
              <select value={pitchCondition} onChange={(e) => setPitchCondition(e.target.value as PitchCondition)}>
                <option value="">Unknown / Standard</option>
                <option value="dry">Dry & Hard</option>
                <option value="wet">Wet / Damp</option>
                <option value="flat">Flat Track</option>
                <option value="turning">Turning Track</option>
                <option value="green">Green Top</option>
              </select>
            </div>
            <div className="field">
              <label>Umpires</label>
              <input value={umpires} onChange={(e) => setUmpires(e.target.value)} placeholder="e.g. Uncle John" />
            </div>
          </div>

          <div className="glass-card">
            <div className="card-title">RULES</div>
            <div className="format-grid">
              <div className="field">
                <label>Players per team</label>
                <input 
                  type="number" 
                  value={settings.playersPerTeam}
                  onChange={(e) => setSettings({...settings, playersPerTeam: parseInt(e.target.value) || 11, maxWickets: (parseInt(e.target.value) || 11) - 1})}
                />
              </div>
              <div className="field">
                <label>Wickets to all-out</label>
                <input 
                  type="number" 
                  value={settings.maxWickets}
                  onChange={(e) => setSettings({...settings, maxWickets: parseInt(e.target.value) || 10})}
                />
              </div>
              <div className="field">
                <label>Max overs / bowler</label>
                <input 
                  type="number" 
                  value={settings.maxOversPerBowler}
                  onChange={(e) => setSettings({...settings, maxOversPerBowler: parseInt(e.target.value) || 2})}
                />
              </div>
              <div className="field">
                <label>Powerplay overs</label>
                <input 
                  type="number" 
                  value={settings.powerplayOvers}
                  onChange={(e) => setSettings({...settings, powerplayOvers: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="house-rules" style={{ marginTop: 20 }}>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.freeHitOnNoball}
                  onChange={(e) => setSettings({...settings, freeHitOnNoball: e.target.checked})}
                />
                Free Hit on No-ball
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.lastManStanding}
                  onChange={(e) => setSettings({...settings, lastManStanding: e.target.checked})}
                />
                Last Man Standing (solo batting)
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.houseRules.oneTipOneHand}
                  onChange={(e) => setSettings({...settings, houseRules: {...settings.houseRules, oneTipOneHand: e.target.checked}})}
                />
                One Tip One Hand (Catch)
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={settings.houseRules.autoBowlerRotation}
                  onChange={(e) => setSettings({...settings, houseRules: {...settings.houseRules, autoBowlerRotation: e.target.checked}})}
                />
                Enforce Bowler Rotation
              </label>
            </div>
          </div>
        </div>
      )}

      <button 
        className="btn-primary" 
        onClick={handleStart}
        disabled={!t1.trim() || !t2.trim() || overs < 1}
      >
        START MATCH
      </button>
    </div>
  );
}
