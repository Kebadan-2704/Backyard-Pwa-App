import { useState } from 'react';
import { useMatchStore } from '../../store/matchStore';
import { isPlayerAlreadyBatting } from '../../utils/validation';
import './Modals.css';

interface Props {
  onClose: () => void;
}

export default function BatterSelectModal({ onClose }: Props) {
  const match = useMatchStore((s) => s.match);
  const setStriker = useMatchStore((s) => s.setStriker);
  const setNonStriker = useMatchStore((s) => s.setNonStriker);
  
  const [selected, setSelected] = useState('');
  const [customName, setCustomName] = useState('');

  if (!match) return null;

  const ci = match.currentInnings;
  const battingTeamIdx = ci;
  const teamPlayers = match.players ? match.players[battingTeamIdx] : [];
  const inn = match.innings[ci];

  const needsStriker = !inn.striker;
  const needsNonStriker = !!inn.striker && !inn.nonStriker;
  
  // Players who are out (not retired hurt — they can come back)
  const outPlayers = Object.keys(inn.batters).filter(p => {
    const b = inn.batters[p];
    return b.howOut && b.howOut !== 'Retired Hurt'; // Retired hurt can return
  });

  // Retired hurt players who can return
  const retiredHurt = Object.keys(inn.batters).filter(p => {
    const b = inn.batters[p];
    return b.isRetired && b.retireType === 'hurt';
  });
  
  // Available from roster (not batting, not out permanently)
  const availableRoster = teamPlayers.filter(p => 
    !isPlayerAlreadyBatting(p, inn.striker, inn.nonStriker) && 
    !outPlayers.includes(p) &&
    !retiredHurt.includes(p)
  );

  // Add any batted players who aren't in the roster but were entered as custom
  const customBatted = Object.keys(inn.batters).filter(p => 
    !teamPlayers.includes(p) && 
    !outPlayers.includes(p) &&
    !isPlayerAlreadyBatting(p, inn.striker, inn.nonStriker) &&
    !retiredHurt.includes(p)
  );

  function handleSelect() {
    const name = (selected || customName.trim());
    if (!name) return;
    
    // Prevent selecting same as current batter
    if (needsStriker && name === inn.nonStriker) return;
    if (needsNonStriker && name === inn.striker) return;
    
    if (needsStriker) {
      setStriker(name);
    } else if (needsNonStriker) {
      setNonStriker(name);
    }
    
    // Check if we still need another batter (e.g. at start of innings)
    if (needsStriker && !inn.nonStriker) {
      setSelected('');
      setCustomName('');
    } else {
      onClose();
    }
  }

  const title = needsStriker ? 'STRIKER' : 'NON-STRIKER';

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>SELECT {title}</h2>
        
        {availableRoster.length > 0 && (
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Choose from team</label>
            <div className="player-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
              {availableRoster.map(p => {
                const stats = inn.batters[p];
                return (
                  <button
                    key={p}
                    className={`selector-btn ${selected === p ? 'active' : ''}`}
                    onClick={() => { setSelected(p); setCustomName(''); }}
                    style={{ textAlign: 'left', padding: '10px' }}
                  >
                    <div style={{ fontWeight: 600 }}>{p}</div>
                    {stats && (
                      <div style={{ fontSize: 10, opacity: 0.7, fontFamily: 'var(--font-mono)' }}>
                        {stats.runs}({stats.balls}) {stats.fours > 0 ? `${stats.fours}×4 ` : ''}{stats.sixes > 0 ? `${stats.sixes}×6` : ''}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Retired hurt players who can come back */}
        {retiredHurt.length > 0 && (
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Retired hurt (can return)</label>
            <div className="player-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
              {retiredHurt.map(p => {
                const stats = inn.batters[p];
                return (
                  <button
                    key={p}
                    className={`selector-btn return ${selected === p ? 'active' : ''}`}
                    onClick={() => { setSelected(p); setCustomName(''); }}
                    style={{ textAlign: 'left', padding: '10px', borderColor: 'var(--gold)', borderStyle: 'dashed' }}
                  >
                    <div style={{ fontWeight: 600 }}>🔄 {p}</div>
                    {stats && (
                      <div style={{ fontSize: 10, opacity: 0.7, fontFamily: 'var(--font-mono)' }}>
                        {stats.runs}({stats.balls})
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="field" style={{ marginBottom: 20 }}>
          <label>Or enter new name</label>
          <input 
            type="text" 
            value={customName}
            onChange={(e) => { setCustomName(e.target.value); setSelected(''); }}
            placeholder="e.g. Rahul"
            maxLength={20}
            aria-label="Enter new batter name"
          />
        </div>

        {/* Validation warning */}
        {(selected || customName.trim()) && 
          ((needsStriker && (selected || customName.trim()) === inn.nonStriker) ||
           (needsNonStriker && (selected || customName.trim()) === inn.striker)) && (
          <div className="free-hit-warning" style={{ marginBottom: 12 }}>
            ⚠️ Can't select the same player as both striker and non-striker
          </div>
        )}

        <div className="modal-actions">
          {inn.deliveries.length > 0 && <button className="btn-secondary" onClick={onClose}>CANCEL</button>}
          <button 
            className="btn-primary-small" 
            onClick={handleSelect}
            disabled={
              (!selected && !customName.trim()) ||
              (needsStriker && (selected || customName.trim()) === inn.nonStriker) ||
              (needsNonStriker && (selected || customName.trim()) === inn.striker)
            }
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
}
