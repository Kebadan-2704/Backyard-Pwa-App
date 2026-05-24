import { useState } from 'react';
import { useMatchStore } from '../../store/matchStore';
import type { DismissalType } from '../../types/cricket';
import './Modals.css';

const ALL_WICKET_TYPES: DismissalType[] = [
  'Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped',
  'Hit Wicket', 'Mankading', 'Hit Ball Twice',
  'Obstructing Field', 'Timed Out',
  'Retired Hurt', 'Retired Out', 'Other'
];

interface Props {
  onClose: () => void;
}

export default function WicketModal({ onClose }: Props) {
  const submitWicket = useMatchStore((s) => s.submitWicket);
  const isFreeHit = useMatchStore((s) => s.isFreeHit);
  const match = useMatchStore((s) => s.match);
  
  const [type, setType] = useState<DismissalType>(isFreeHit ? 'Run Out' : 'Bowled');
  const [dismissedBatter, setDismissedBatter] = useState<'striker' | 'nonStriker'>('striker');
  const [runs, setRuns] = useState(0);
  const [fielder, setFielder] = useState('');

  if (!match) return null;

  const ci = match.currentInnings;
  const inn = match.innings[ci];
  const strikerName = inn.striker || 'Striker';
  const nonStrikerName = inn.nonStriker || 'Non-striker';

  // Filter allowed wickets on free hit
  const allowedTypes = isFreeHit ? ['Run Out'] as DismissalType[] : ALL_WICKET_TYPES;

  // Types that need a fielder
  const needsFielder = ['Caught', 'Run Out', 'Stumped'].includes(type);
  // Types that allow choosing which batter
  const canChooseBatter = ['Run Out', 'Obstructing Field', 'Retired Hurt', 'Retired Out'].includes(type);

  // Get fielding team players
  const fieldingTeamIdx = ci === 0 ? 1 : 0;
  const fieldingPlayers = match.players[fieldingTeamIdx];

  function handleSubmit() {
    submitWicket({ type, dismissedBatter, runsBeforeWicket: runs, fielder: fielder || undefined });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <h2>WICKET</h2>
        
        {isFreeHit && (
          <div className="free-hit-warning" role="alert">
            ⚠️ Free Hit! Only Run Out is allowed.
          </div>
        )}

        <div className="field" style={{ marginBottom: 12 }}>
          <label>How out?</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value as DismissalType)}
            aria-label="Dismissal type"
          >
            {allowedTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {canChooseBatter && (
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Who was dismissed?</label>
            <div className="toss-row">
              <button 
                className={`toss-btn ${dismissedBatter === 'striker' ? 'active' : ''}`}
                onClick={() => setDismissedBatter('striker')}
              >
                {strikerName} (Striker)
              </button>
              <button 
                className={`toss-btn ${dismissedBatter === 'nonStriker' ? 'active' : ''}`}
                onClick={() => setDismissedBatter('nonStriker')}
              >
                {nonStrikerName} (Non-striker)
              </button>
            </div>
          </div>
        )}

        {(type === 'Run Out' || type === 'Obstructing Field') && (
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Runs completed before dismissal</label>
            <div className="toss-row">
              {[0, 1, 2, 3].map(r => (
                <button
                  key={r}
                  className={`selector-btn ${runs === r ? 'active' : ''}`}
                  onClick={() => setRuns(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {needsFielder && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Fielder (optional)</label>
            {fieldingPlayers.length > 0 ? (
              <>
                <div className="player-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '6px' }}>
                  {fieldingPlayers.map(p => (
                    <button
                      key={p}
                      className={`selector-btn compact ${fielder === p ? 'active' : ''}`}
                      onClick={() => setFielder(fielder === p ? '' : p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <input 
                  type="text" 
                  value={fielder}
                  onChange={(e) => setFielder(e.target.value)}
                  placeholder="Or type name..."
                  maxLength={20}
                  style={{ marginTop: 8 }}
                />
              </>
            ) : (
              <input 
                type="text" 
                value={fielder}
                onChange={(e) => setFielder(e.target.value)}
                placeholder="e.g. Raju"
                maxLength={20}
              />
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>CANCEL</button>
          <button className="btn-primary-small" onClick={handleSubmit}>SUBMIT WICKET</button>
        </div>
      </div>
    </div>
  );
}
