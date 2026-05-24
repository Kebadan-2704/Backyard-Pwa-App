import { useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import type { Match } from '../../types/cricket';
import { useHistoryStore } from '../../store/historyStore';
import { useStatsStore } from '../../store/statsStore';
import './Modals.css';

interface Props {
  match: Match;
  onClose: () => void;
}

export default function MatchEditorModal({ match, onClose }: Props) {
  const saveMatch = useHistoryStore(s => s.saveMatch);
  const recomputeAllStats = useStatsStore(s => s.recomputeAllStats);
  const historyMatches = useHistoryStore(s => s.matches);

  const [inn1Runs, setInn1Runs] = useState(match.innings[0]?.runs || 0);
  const [inn1Wickets, setInn1Wickets] = useState(match.innings[0]?.wickets || 0);
  const inn1Delivs = match.innings[0]?.deliveries || [];
  const inn2Delivs = match.innings[1]?.deliveries || [];

  const [inn1Overs, setInn1Overs] = useState(match.innings[0] ? (Math.floor(inn1Delivs.length / 6) + (inn1Delivs.length % 6) / 10).toFixed(1) : '0.0');

  const [inn2Runs, setInn2Runs] = useState(match.innings[1]?.runs || 0);
  const [inn2Wickets, setInn2Wickets] = useState(match.innings[1]?.wickets || 0);
  const [inn2Overs, setInn2Overs] = useState(match.innings[1] ? (Math.floor(inn2Delivs.length / 6) + (inn2Delivs.length % 6) / 10).toFixed(1) : '0.0');

  const handleSave = () => {
    const editedMatch = structuredClone(match);
    
    // Update Innings 1
    if (editedMatch.innings[0]) {
      editedMatch.innings[0].runs = Number(inn1Runs);
      editedMatch.innings[0].wickets = Number(inn1Wickets);
      const totalBalls = Math.floor(Number(inn1Overs)) * 6 + ((Number(inn1Overs) % 1) * 10);
      editedMatch.innings[0].deliveries = Array(totalBalls).fill('0');
    }
    
    // Update Innings 2
    if (editedMatch.innings[1]) {
      editedMatch.innings[1].runs = Number(inn2Runs);
      editedMatch.innings[1].wickets = Number(inn2Wickets);
      const totalBalls = Math.floor(Number(inn2Overs)) * 6 + ((Number(inn2Overs) % 1) * 10);
      editedMatch.innings[1].deliveries = Array(totalBalls).fill('0');
    }

    // Recompute Winner
    const i1Runs = editedMatch.innings[0]?.runs || 0;
    const i2Runs = editedMatch.innings[1]?.runs || 0;
    
    if (i2Runs > i1Runs) {
      const wktsLeft = editedMatch.settings.maxWickets - (editedMatch.innings[1]?.wickets || 0);
      editedMatch.winner = editedMatch.teams[1];
      editedMatch.margin = `by ${wktsLeft} wicket${wktsLeft !== 1 ? 's' : ''}`;
    } else if (i1Runs > i2Runs) {
      const diff = i1Runs - i2Runs;
      editedMatch.winner = editedMatch.teams[0];
      editedMatch.margin = `by ${diff} run${diff !== 1 ? 's' : ''}`;
    } else {
      editedMatch.winner = 'Match tied';
      editedMatch.margin = '';
    }

    // Save to History
    saveMatch(editedMatch);

    // Recompute ALL Stats
    // Note: useHistoryStore might not have updated instantly in our local closure, 
    // so we manually map the updated match into the array before passing to recompute
    const updatedHistory = historyMatches.map(m => m.id === editedMatch.id ? editedMatch : m);
    recomputeAllStats(updatedHistory);

    alert('Match updated & global stats recomputed!');
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ padding: 10 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Match Scorecard</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ background: 'rgba(231, 76, 60, 0.1)', padding: 12, borderRadius: 8, border: '1px solid rgba(231, 76, 60, 0.3)', marginBottom: 16, fontSize: 12, display: 'flex', gap: 8 }}>
          <AlertTriangle size={16} color="var(--red)" style={{ flexShrink: 0 }} />
          <div>
            <strong>Warning:</strong> Modifying these team totals will update Tournament Net Run Rates and Points, but it will <strong>not</strong> change individual player stats.
          </div>
        </div>

        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px 0', color: 'var(--gold)' }}>1st Innings: {match.teams[0]}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div className="field">
              <label>Runs</label>
              <input type="number" value={inn1Runs} onChange={e => setInn1Runs(e.target.value as any)} />
            </div>
            <div className="field">
              <label>Wickets</label>
              <input type="number" value={inn1Wickets} onChange={e => setInn1Wickets(e.target.value as any)} />
            </div>
            <div className="field">
              <label>Overs</label>
              <input type="number" step="0.1" value={inn1Overs} onChange={e => setInn1Overs(e.target.value as any)} />
            </div>
          </div>
        </div>

        {inn2Delivs.length > 0 && (
          <div className="glass-card" style={{ padding: 16, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--magenta)' }}>2nd Innings: {match.teams[1]}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div className="field">
                <label>Runs</label>
                <input type="number" value={inn2Runs} onChange={e => setInn2Runs(e.target.value as any)} />
              </div>
              <div className="field">
                <label>Wickets</label>
                <input type="number" value={inn2Wickets} onChange={e => setInn2Wickets(e.target.value as any)} />
              </div>
              <div className="field">
                <label>Overs</label>
                <input type="number" step="0.1" value={inn2Overs} onChange={e => setInn2Overs(e.target.value as any)} />
              </div>
            </div>
          </div>
        )}

        <button className="btn-primary" style={{ width: '100%' }} onClick={handleSave}>
          <Save size={16} /> SAVE & RECOMPUTE STATS
        </button>
      </div>
    </div>
  );
}
