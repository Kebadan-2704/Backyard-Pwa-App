import { useState } from 'react';
import { useMatchStore } from '../../store/matchStore';
import './Modals.css';

interface Props {
  onClose: () => void;
  initialType?: 'wide' | 'noball' | 'bye' | 'legbye' | 'penalty';
}

export default function ExtrasModal({ onClose, initialType = 'wide' }: Props) {
  const addExtra = useMatchStore((s) => s.addExtra);
  const match = useMatchStore((s) => s.match);
  
  const [type, setType] = useState<'wide' | 'noball' | 'bye' | 'legbye' | 'penalty'>(initialType === 'penalty' ? 'wide' : initialType);
  const [runs, setRuns] = useState(1);
  const [batterRuns, setBatterRuns] = useState(0);

  if (!match) return null;

  function handleSubmit() {
    // If it's a wide, all runs are wide runs (e.g., 1 wide + 2 run = 3 wides)
    if (type === 'wide') {
      addExtra('wide', runs);
    } 
    // If it's a no ball, we separate the noball extra (1) from the batter runs
    else if (type === 'noball') {
      addExtra('noball', runs, batterRuns);
    }
    else {
      addExtra(type, runs);
    }
    onClose();
  }

  return (
    <div className="modal-overlay drawer-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content drawer-content">
        <h2>EXTRAS ENTRY</h2>
        
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Extra Type</label>
          <div className="toss-row">
            <button className={`toss-btn ${type === 'wide' ? 'active' : ''}`} onClick={() => { setType('wide'); setRuns(1); setBatterRuns(0); }}>Wide</button>
            <button className={`toss-btn ${type === 'noball' ? 'active' : ''}`} onClick={() => { setType('noball'); setRuns(1); }}>No Ball</button>
            <button className={`toss-btn ${type === 'bye' ? 'active' : ''}`} onClick={() => { setType('bye'); setRuns(1); setBatterRuns(0); }}>Bye</button>
            <button className={`toss-btn ${type === 'legbye' ? 'active' : ''}`} onClick={() => { setType('legbye'); setRuns(1); setBatterRuns(0); }}>Leg Bye</button>
          </div>
        </div>

        {type === 'wide' && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Total Wides (including runs taken)</label>
            <div className="toss-row" style={{ flexWrap: 'wrap', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r} className={`selector-btn ${runs === r ? 'active' : ''}`} onClick={() => setRuns(r)}>
                  {r}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>A standard wide is 1 run. If they run 2 on a wide, select 3.</p>
          </div>
        )}

        {type === 'noball' && (
          <>
            <div className="field" style={{ marginBottom: 16 }}>
              <label>No Ball Extras</label>
              <div className="toss-row" style={{ flexWrap: 'wrap', gap: 8 }}>
                {[1, 2, 3, 4].map(r => (
                  <button key={r} className={`selector-btn ${runs === r ? 'active' : ''}`} onClick={() => setRuns(r)}>
                    {r}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Standard No Ball is 1 extra.</p>
            </div>
            <div className="field" style={{ marginBottom: 16 }}>
              <label>Runs off the Bat</label>
              <div className="toss-row" style={{ flexWrap: 'wrap', gap: 8 }}>
                {[0, 1, 2, 3, 4, 5, 6].map(r => (
                  <button key={r} className={`selector-btn ${batterRuns === r ? 'active' : ''}`} onClick={() => setBatterRuns(r)}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {(type === 'bye' || type === 'legbye') && (
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Total Byes</label>
            <div className="toss-row" style={{ flexWrap: 'wrap', gap: 8 }}>
              {[1, 2, 3, 4, 5, 6].map(r => (
                <button key={r} className={`selector-btn ${runs === r ? 'active' : ''}`} onClick={() => setRuns(r)}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>CANCEL</button>
          <button className="btn-primary-small" onClick={handleSubmit}>SUBMIT EXTRA</button>
        </div>
      </div>
    </div>
  );
}
