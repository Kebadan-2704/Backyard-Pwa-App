import { useState } from 'react';
import { useMatchStore } from '../../store/matchStore';
import { canBowlerBowl, calculateEconomy, getDotBallPercentage } from '../../utils/scoring';
import './Modals.css';

interface Props {
  onClose: () => void;
}

export default function BowlerSelectModal({ onClose }: Props) {
  const match = useMatchStore((s) => s.match);
  const setBowler = useMatchStore((s) => s.setBowler);
  
  const [selected, setSelected] = useState('');
  const [customName, setCustomName] = useState('');

  if (!match) return null;

  const ci = match.currentInnings;
  const bowlingTeamIdx = ci === 0 ? 1 : 0;
  const teamPlayers = match.players ? match.players[bowlingTeamIdx] : [];
  const inn = match.innings[ci];
  const lastBowler = inn.overSummaries.length > 0 
    ? inn.overSummaries[inn.overSummaries.length - 1].bowler 
    : '';

  // Combine roster players + any custom bowlers already bowled
  const allBowlers = Array.from(new Set([...teamPlayers, ...Object.keys(inn.bowlers)]));

  // Auto-rotation enforcement
  const enforceRotation = match?.settings?.houseRules?.autoBowlerRotation || false;

  function handleSelect() {
    const name = selected || customName.trim();
    if (!name) return;

    // Check if allowed
    const rule = canBowlerBowl(name, inn.bowlers, match!.settings.maxOversPerBowler, lastBowler);
    if (!rule.allowed) return;

    // Block consecutive if auto-rotation is enforced
    if (enforceRotation && name === lastBowler) return;

    setBowler(name);
    onClose();
  }

  function getEconomyColor(econ: number): string {
    if (econ <= 6) return 'var(--green)';
    if (econ <= 9) return 'var(--gold)';
    return 'var(--leather-light)';
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>SELECT BOWLER</h2>
        
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Choose next bowler</label>
          <div className="player-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
            {allBowlers.map(p => {
              const rule = canBowlerBowl(p, inn.bowlers, match!.settings.maxOversPerBowler, lastBowler);
              const isConsecutive = p === lastBowler;
              const blocked = !rule.allowed || (enforceRotation && isConsecutive);
              const stats = inn.bowlers[p];
              const econ = stats ? calculateEconomy(stats) : 0;
              const dotPct = stats ? getDotBallPercentage(stats) : 0;
              const statsStr = stats ? `${stats.overs}.${stats.ballsBowled}-${stats.runsConceded}-${stats.wickets}` : '';

              return (
                <button
                  key={p}
                  className={`selector-btn ${selected === p ? 'active' : ''}`}
                  onClick={() => { if (!blocked) { setSelected(p); setCustomName(''); } }}
                  disabled={blocked}
                  style={{ 
                    opacity: blocked ? 0.35 : 1, 
                    textAlign: 'left', 
                    padding: '10px',
                    cursor: blocked ? 'not-allowed' : 'pointer',
                  }}
                  aria-label={`${p} ${statsStr || 'new bowler'} ${blocked ? '(unavailable)' : ''}`}
                >
                  <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{p}</span>
                    {isConsecutive && <span style={{ fontSize: 10, color: 'var(--gold)' }}>LAST</span>}
                  </div>
                  {stats ? (
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                      <span>{statsStr}</span>
                      <span style={{ color: getEconomyColor(econ), marginLeft: 6 }}>
                        E:{econ.toFixed(1)}
                      </span>
                      {dotPct > 0 && (
                        <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                          •{dotPct.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, opacity: 0.5 }}>New</div>
                  )}
                  {stats && stats.spells.length > 0 && (
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                      Spells: {stats.spells.map((s, i) => `Ov ${s.overStart}-${s.overEnd}`).join(', ')}
                    </div>
                  )}
                  {!rule.allowed && <div style={{ fontSize: 9, color: 'var(--leather-light)' }}>Max overs reached</div>}
                  {rule.warning && !enforceRotation && <div style={{ fontSize: 9, color: 'var(--gold)' }}>Bowled last over</div>}
                  {enforceRotation && isConsecutive && <div style={{ fontSize: 9, color: 'var(--leather-light)' }}>Rotation enforced</div>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="field" style={{ marginBottom: 20 }}>
          <label>Or enter new name</label>
          <input 
            type="text" 
            value={customName}
            onChange={(e) => { setCustomName(e.target.value); setSelected(''); }}
            placeholder="e.g. Varun"
            maxLength={20}
            aria-label="Enter new bowler name"
          />
        </div>

        <div className="modal-actions">
          {inn.deliveries.length > 0 && <button className="btn-secondary" onClick={onClose}>CANCEL</button>}
          <button 
            className="btn-primary-small" 
            onClick={handleSelect}
            disabled={!selected && !customName.trim()}
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
}
