import { useState } from 'react';
import { CloudRain, X, Calculator } from 'lucide-react';
import { useMatchStore } from '../../store/matchStore';
import './Modals.css';

interface Props {
  onClose: () => void;
}

export default function DLSModal({ onClose }: Props) {
  const match = useMatchStore((s) => s.match);
  const updateMatchSettings = useMatchStore((s) => s.updateMatchSettings);
  
  const originalOvers = match?.settings.overs || 10;
  const [newOvers, setNewOvers] = useState<number>(originalOvers);
  const [revisedTarget, setRevisedTarget] = useState<number | null>(null);

  if (!match) return null;

  const inn1 = match.innings[0];
  const inn2 = match.innings[1];
  const isSecondInnings = match.currentInnings === 1;

  // Extremely Simplified "Backyard DLS" (Proportional Run Rate + Wicket Penalty)
  function calculateDLS() {
    if (!inn1) return;

    const maxOvers = originalOvers;
    const lostOvers = maxOvers - newOvers;
    
    if (lostOvers <= 0) {
      setRevisedTarget(null);
      return;
    }

    if (!isSecondInnings) {
      // Rain during 1st innings: just reduce total match overs
      alert('If it rains during the 1st Innings, the match is simply shortened to the new over limit for both teams.');
      return;
    }

    // Rain during 2nd innings
    // Target = (Inn1 Runs) * (New Overs / Max Overs)
    // Plus a slight penalty for wickets lost by team 2 so far
    const baseTarget = Math.floor(inn1.runs * (newOvers / maxOvers));
    
    // Penalty: add 2 runs to target for every wicket Team 2 has lost (makes it harder for them if they were collapsing)
    const wicketPenalty = inn2.wickets * 2;
    
    const finalTarget = baseTarget + wicketPenalty + 1; // +1 to win

    setRevisedTarget(finalTarget);
  }

  function applyRevisedTarget() {
    if (revisedTarget !== null) {
      // We can hack a revised target by updating match settings
      // Actually, we don't have a direct "revisedTarget" field in Match yet.
      // But we can just alert the user or store it in match.margin temporarily, 
      // or just update match.settings.overs
      updateMatchSettings({ overs: newOvers });
      alert(`Match shortened to ${newOvers} overs. The Revised Target is ${revisedTarget}!`);
      onClose();
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--chalk)' }}>
            <CloudRain size={20} color="var(--blue)" /> Rain Delay (DLS)
          </h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          If it starts raining and you need to shorten the match, the Backyard DLS Calculator will generate a fair revised target.
        </p>

        <div className="glass-card" style={{ padding: 16, marginBottom: 20 }}>
          <div className="field">
            <label>Original Match Overs</label>
            <input type="number" value={originalOvers} disabled style={{ opacity: 0.5 }} />
          </div>
          
          <div className="field" style={{ marginTop: 12 }}>
            <label>New Reduced Overs (per side)</label>
            <input 
              type="number" 
              value={newOvers} 
              onChange={e => setNewOvers(Number(e.target.value))} 
              max={originalOvers}
              min={1}
            />
          </div>
        </div>

        <button className="btn-secondary" style={{ width: '100%', marginBottom: 16 }} onClick={calculateDLS}>
          <Calculator size={16} /> CALCULATE REVISED TARGET
        </button>

        {revisedTarget !== null && (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: 16, background: 'rgba(39, 174, 96, 0.1)', border: '1px solid var(--green)', borderRadius: 8, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--green)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>Revised Target</div>
            <div style={{ fontSize: 42, fontFamily: 'var(--font-display)', color: 'var(--chalk)', margin: '8px 0' }}>
              {revisedTarget}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Off {newOvers} overs
            </div>
          </div>
        )}

        {revisedTarget !== null && (
          <button className="btn-primary" style={{ width: '100%' }} onClick={applyRevisedTarget}>
            APPLY NEW TARGET & OVERS
          </button>
        )}
      </div>
    </div>
  );
}
