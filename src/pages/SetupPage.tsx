import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchStore } from '../store/matchStore';
import { createDefaultSettings } from '../types/cricket';
import type { MatchSettings, MatchType, PitchCondition } from '../types/cricket';
import { ChevronRight, Settings2, ShieldAlert, X, Plus, ChevronDown, Upload } from 'lucide-react';
import PlayerSelectModal from '../components/modals/PlayerSelectModal';
import './SetupPage.css';

export default function SetupPage() {
  const navigate = useNavigate();
  const startMatch = useMatchStore((s) => s.startMatch);
  const activeMatch = useMatchStore((s) => s.match);

  const [t1, setT1] = useState('INDIA');
  const [t2, setT2] = useState('AUSTRALIA');
  const [overs, setOvers] = useState(6);
  const [tossW, setTossW] = useState('');
  const [tossC, setTossC] = useState<'bat' | 'bowl'>('bat');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<'heads' | 'tails' | null>(null);
  const [coinRotation, setCoinRotation] = useState(0);
  const [settings, setSettings] = useState<MatchSettings>(createDefaultSettings());
  
  // Wizard state
  const [step, setStep] = useState(1);
  
  // V3 specific fields
  const [matchType, setMatchType] = useState<MatchType>('friendly');
  const [pitchCondition, setPitchCondition] = useState<PitchCondition>('');
  const [venue, setVenue] = useState('');
  const [umpires, setUmpires] = useState('');
  
  // Players
  const [t1Players, setT1Players] = useState<string[]>([]);
  const [t2Players, setT2Players] = useState<string[]>([]);
  const [t1Input, setT1Input] = useState('');
  const [t2Input, setT2Input] = useState('');
  
  // Common / Joker Players
  const [commonPlayers, setCommonPlayers] = useState<string[]>([]);
  const [commonInput, setCommonInput] = useState('');

  // Bulk Selection Modal State
  const [selectModalTarget, setSelectModalTarget] = useState<1 | 2 | 3 | null>(null);

  function handleAddPlayer(team: 1 | 2 | 3) {
    if (team === 1 && t1Input.trim()) {
      const name = t1Input.trim();
      if (!t1Players.includes(name)) setT1Players([...t1Players, name]);
      setT1Input('');
    }
    if (team === 2 && t2Input.trim()) {
      const name = t2Input.trim();
      if (!t2Players.includes(name)) setT2Players([...t2Players, name]);
      setT2Input('');
    }
    if (team === 3 && commonInput.trim()) {
      const name = commonInput.trim();
      if (!commonPlayers.includes(name)) setCommonPlayers([...commonPlayers, name]);
      setCommonInput('');
    }
  }

  function handleRemovePlayer(team: 1 | 2 | 3, index: number) {
    if (team === 1) setT1Players(t1Players.filter((_, i) => i !== index));
    if (team === 2) setT2Players(t2Players.filter((_, i) => i !== index));
    if (team === 3) setCommonPlayers(commonPlayers.filter((_, i) => i !== index));
  }

  function handleStart() {
    if (!t1.trim() || !t2.trim()) {
      alert("Please enter both team names");
      return;
    }
    if (!tossW) {
      alert("Please complete the toss before starting the match");
      return;
    }
    
    // Parse players
    const p1 = t1Players;
    const p2 = t2Players;

    // Add Common Players (Jokers) to BOTH rosters
    const actualP1 = [...p1, ...commonPlayers];
    const actualP2 = [...p2, ...commonPlayers];
    const maxPlayers = Math.max(actualP1.length, actualP2.length, settings.playersPerTeam);

    startMatch({
      team1: t1,
      team2: t2,
      players1: actualP1,
      players2: actualP2,
      settings: { ...settings, overs, playersPerTeam: maxPlayers },
      tossWinner: tossW,
      tossChoice: tossC,
      matchType,
      pitchCondition,
      venue,
      umpires,
    });
    navigate('/scorer');
  }

  function handleCallAndFlip(call: 'heads' | 'tails') {
    if (!t1.trim() || !t2.trim()) {
      alert("Please enter Team 1 and Team 2 names first.");
      return;
    }
    
    const landedOn = Math.random() > 0.5 ? 'heads' : 'tails';
    
    // Calculate new rotation to ensure realistic spin
    const currentRotNum = Math.floor(coinRotation / 360) * 360;
    const baseNewRot = currentRotNum + 1800; // 5 full spins
    const finalRot = landedOn === 'tails' ? baseNewRot + 180 : baseNewRot;

    setCoinRotation(finalRot);
    setIsFlipping(true);
    setCoinResult(null);
    setTossW('');

    // Wait for the CSS transition to finish
    setTimeout(() => {
      setCoinResult(landedOn);
      const winner = landedOn === call ? t1 : t2;
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
        <div className="glass-card" style={{ border: '2px solid var(--gold)', background: 'rgba(245, 166, 35, 0.05)' }}>
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

      {step === 2 && (
        <div className="slide-down">
          <div className="glass-card">
            <div className="card-title">QUICK GAME SETUP</div>
            <div className="field">
              <label>Host Team</label>
              <input value={t1} onChange={(e) => setT1(e.target.value.toUpperCase())} maxLength={15} />
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>Visitor Team</label>
              <input value={t2} onChange={(e) => setT2(e.target.value.toUpperCase())} maxLength={15} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className="btn-secondary" onClick={() => setStep(1)}>BACK</button>
            <button className="btn-primary" onClick={() => {
              if (!t1.trim() || !t2.trim()) alert("Please enter both team names");
              else setStep(3);
            }}>
              NEXT: TOSS & RULES
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="slide-down">
          <div className="glass-card">
            <div className="card-title">MATCH FORMAT</div>
            
            <div className="format-grid">
              <div className="field">
                <label>Match Type</label>
                <select value={matchType} onChange={(e) => setMatchType(e.target.value as MatchType)}>
                  <option value="friendly">Friendly Match</option>
                  <option value="league">League tournament</option>
                  <option value="knockout">Knockout tournament</option>
                </select>
              </div>
            </div>

            {['knockout', 'league'].includes(matchType) && (
              <div className="format-grid" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="field">
                  <label>Number of Teams in Tournament</label>
                  <input type="number" defaultValue={4} min={3} max={16} />
                </div>
                <div className="field">
                  <label>Schedule Type</label>
                  <select>
                    <option value="auto">Automatic Bracket</option>
                    <option value="custom">Custom Schedule</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          <button className="btn-primary" onClick={() => setStep(2)}>
            NEXT: TEAMS
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="slide-down">
          <div className="glass-card">
            <div className="card-title">TOSS & SETTINGS</div>
            
            <div className="format-grid" style={{ marginBottom: 20 }}>
              <div className="field">
                <label>Overs per Innings</label>
                <input 
                  inputMode="numeric" 
                  pattern="[0-9]*"
                  value={overs === 0 ? '' : overs} 
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setOvers(val === '' ? 0 : Math.min(parseInt(val), 50));
                  }}
                  onBlur={() => { if (overs < 1) setOvers(1); }}
                />
              </div>
            </div>

            <div className="toss-container">
              <div className="coin-wrapper">
                <div className="coin" style={{ transform: `rotateX(${coinRotation}deg)` }}>
                  <div className="coin-face coin-heads">HEADS</div>
                  <div className="coin-face coin-tails">TAILS</div>
                </div>
              </div>
              
              {!tossW && !isFlipping ? (
                <div style={{ textAlign: 'center', width: '100%' }} className="slide-down">
                  <p style={{ color: 'var(--text-muted)', marginBottom: 12, fontSize: 13 }}>{t1 || 'Team 1'}, call it:</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button className="toss-action-btn" onClick={() => handleCallAndFlip('heads')}>HEADS</button>
                    <button className="toss-action-btn" onClick={() => handleCallAndFlip('tails')}>TAILS</button>
                  </div>
                </div>
              ) : isFlipping ? (
                <button className="toss-action-btn" disabled>FLIPPING...</button>
              ) : (
                <div style={{ textAlign: 'center', width: '100%' }} className="slide-down">
                   <p style={{ color: 'var(--chalk)', marginBottom: 4, fontSize: 13 }}>It's <span style={{ color: 'var(--gold)', fontWeight: 800 }}>{coinResult?.toUpperCase()}</span>!</p>
                   <button 
                     className="btn-secondary" 
                     onClick={() => { setTossW(''); setCoinResult(null); }} 
                     style={{ fontSize: 12, padding: '6px 12px', marginTop: 8 }}
                   >
                     RE-FLIP COIN
                   </button>
                </div>
              )}
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
          
          <div className="advanced-settings slide-down" style={{ marginTop: 24 }}>
              <div className="glass-card">
                <div className="card-title">TEAM ROSTERS</div>
                <div className="field" style={{ marginBottom: 16 }}>
                  <label>{t1} Players ({t1Players.length})</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input 
                      list="historical-players"
                      value={t1Input} 
                      onChange={(e) => setT1Input(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer(1)}
                      placeholder="Enter new player..."
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="btn-secondary" style={{ padding: '0 12px', flex: 'none', width: 'auto' }} onClick={() => handleAddPlayer(1)}>
                      <Plus size={16} />
                    </button>
                    <button type="button" className="btn-primary-small" style={{ fontSize: 11, padding: '0 12px', flex: 'none' }} onClick={() => setSelectModalTarget(1)}>
                      LIBRARY
                    </button>
                  </div>
                  <div className="roster-pills">
                    {t1Players.map((p, i) => (
                      <div key={i} className="roster-pill">
                        {p}
                        <X size={14} onClick={() => handleRemovePlayer(1, i)} />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="field" style={{ marginBottom: 16 }}>
                  <label>{t2} Players ({t2Players.length})</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input 
                      list="historical-players"
                      value={t2Input} 
                      onChange={(e) => setT2Input(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer(2)}
                      placeholder="Enter new player..."
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="btn-secondary" style={{ padding: '0 12px', flex: 'none', width: 'auto' }} onClick={() => handleAddPlayer(2)}>
                      <Plus size={16} />
                    </button>
                    <button type="button" className="btn-primary-small" style={{ fontSize: 11, padding: '0 12px', flex: 'none' }} onClick={() => setSelectModalTarget(2)}>
                      LIBRARY
                    </button>
                  </div>
                  <div className="roster-pills">
                    {t2Players.map((p, i) => (
                      <div key={i} className="roster-pill">
                        {p}
                        <X size={14} onClick={() => handleRemovePlayer(2, i)} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label>Common Players / Jokers ({commonPlayers.length})</label>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Plays for both teams. Automatically added to both rosters.</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input 
                      list="historical-players"
                      value={commonInput} 
                      onChange={(e) => setCommonInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer(3)}
                      placeholder="Enter joker..."
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="btn-secondary" style={{ padding: '0 12px', flex: 'none', width: 'auto' }} onClick={() => handleAddPlayer(3)}>
                      <Plus size={16} />
                    </button>
                    <button type="button" className="btn-primary-small" style={{ fontSize: 11, padding: '0 12px', flex: 'none' }} onClick={() => setSelectModalTarget(3)}>
                      LIBRARY
                    </button>
                  </div>
                  <div className="roster-pills">
                    {commonPlayers.map((p, i) => (
                      <div key={i} className="roster-pill" style={{ background: 'var(--blue)', color: 'white' }}>
                        {p}
                        <X size={14} onClick={() => handleRemovePlayer(3, i)} />
                      </div>
                    ))}
                  </div>
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
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={settings.playersPerTeam === 0 ? '' : settings.playersPerTeam}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        const num = val === '' ? 0 : parseInt(val);
                        const updates: Partial<MatchSettings> = { playersPerTeam: num };
                        // If Last Man Standing is on, auto-sync wickets
                        if (settings.lastManStanding && num > 0) {
                          updates.maxWickets = num;
                        }
                        setSettings({...settings, ...updates});
                      }}
                      onBlur={() => { if (settings.playersPerTeam < 1) setSettings({...settings, playersPerTeam: 1}); }}
                    />
                  </div>
                  <div className="field">
                    <label>Wickets to all-out</label>
                    <input 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={settings.maxWickets === 0 ? '' : settings.maxWickets}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setSettings({...settings, maxWickets: val === '' ? 0 : parseInt(val)});
                      }}
                      onBlur={() => { if (settings.maxWickets < 1) setSettings({...settings, maxWickets: 1}); }}
                    />
                  </div>
                  <div className="field">
                    <label>Max overs / bowler (Leave empty for unlimited)</label>
                    <input 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={settings.maxOversPerBowler === 0 ? '' : settings.maxOversPerBowler}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setSettings({...settings, maxOversPerBowler: val === '' ? 0 : parseInt(val)});
                      }}
                    />
                  </div>
                  <div className="field">
                    <label>Powerplay overs</label>
                    <input 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={settings.powerplayOvers === 0 ? '' : settings.powerplayOvers}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setSettings({...settings, powerplayOvers: val === '' ? 0 : parseInt(val)});
                      }}
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
                      onChange={(e) => {
                        const lms = e.target.checked;
                        const updates: Partial<MatchSettings> = { lastManStanding: lms };
                        if (lms) {
                          // When LMS is on, all-out = number of players (last man bats solo)
                          updates.maxWickets = settings.playersPerTeam;
                        } else {
                          // When LMS is off, default to players - 1
                          updates.maxWickets = Math.max(1, settings.playersPerTeam - 1);
                        }
                        setSettings({...settings, ...updates});
                      }}
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
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className="btn-secondary" onClick={() => setStep(2)}>BACK</button>
            <button 
              className="btn-primary" 
              onClick={handleStart}
              style={{ fontSize: 18, padding: '16px', background: 'var(--gold)', color: '#000' }}
            >
              START MATCH
            </button>
          </div>
        </div>
      )}

      {selectModalTarget && (
        <PlayerSelectModal
          teamName={selectModalTarget === 1 ? t1 : selectModalTarget === 2 ? t2 : 'Common'}
          alreadySelected={selectModalTarget === 1 ? t1Players : selectModalTarget === 2 ? t2Players : commonPlayers}
          onClose={() => setSelectModalTarget(null)}
          onSelect={(selectedPlayers) => {
            if (selectModalTarget === 1) setT1Players(selectedPlayers);
            if (selectModalTarget === 2) setT2Players(selectedPlayers);
            if (selectModalTarget === 3) setCommonPlayers(selectedPlayers);
            setSelectModalTarget(null);
          }}
        />
      )}
    </div>
  );
}
