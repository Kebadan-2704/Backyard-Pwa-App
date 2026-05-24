import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchStore } from '../../store/matchStore';
import { useHistoryStore } from '../../store/historyStore';
import { shareViaWebShare, shareViaWhatsApp, captureScreenshot } from '../../utils/sharing';
import { Trophy, Share2, MessageCircle, Copy, BarChart2 } from 'lucide-react';
import './Modals.css';

interface Props {
  onClose: () => void;
  onViewScorecard: () => void;
}

export default function ResultModal({ onClose, onViewScorecard }: Props) {
  const navigate = useNavigate();
  const match = useMatchStore((s) => s.match);
  const newMatch = useMatchStore((s) => s.newMatch);
  const saveMatch = useHistoryStore((s) => s.saveMatch);
  const startSuperOver = useMatchStore((s) => s.startSuperOver);
  const setManOfTheMatch = useMatchStore((s) => s.setManOfTheMatch);
  const [isEditingMoM, setIsEditingMoM] = useState(false);

  if (!match || !match.complete) return null;

  const allMatchPlayers = [...match.players[0], ...match.players[1]];

  function handleSaveAndExit() {
    if (match) saveMatch(match);
    newMatch();
    navigate('/');
  }

  function handleSuperOver() {
    if (match) saveMatch(match); // Save the tied match
    startSuperOver(); // Start super over
    onClose(); // Close result modal
  }

  function handleShare(type: 'web' | 'whatsapp' | 'image') {
    if (!match) return;
    if (type === 'web') shareViaWebShare(match);
    else if (type === 'whatsapp') shareViaWhatsApp(match);
    else if (type === 'image') captureScreenshot('result-modal-content', match);
  }

  const isTie = match.winner === 'Match tied';
  const isAbandoned = match.winner === 'Abandoned';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div id="result-modal-content" className="modal-content result-modal" style={{ textAlign: 'center', background: 'var(--bg-card)' }}>
        <Trophy size={56} color="var(--gold)" style={{ margin: '0 auto 16px', filter: 'drop-shadow(0 0 10px rgba(240,165,0,0.5))' }} />
        
        <h2 style={{ fontSize: 32, marginBottom: 8, letterSpacing: 2 }}>MATCH OVER</h2>
        
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--chalk)', margin: '16px 0', lineHeight: 1.2 }}>
          {isTie || isAbandoned 
            ? match.winner 
            : `${match.winner} won`}
        </div>
        
        {match.margin && (
          <div style={{ fontSize: 18, color: 'var(--gold)', marginBottom: 24, fontWeight: 600 }}>
            {match.margin}
          </div>
        )}

        {/* Man of the Match display */}
        {match.manOfTheMatch && (
          <div className="motm-badge" style={{ marginBottom: 24, background: 'rgba(255, 255, 255, 0.03)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Player of the Match</span>
              <button 
                onClick={() => setIsEditingMoM(!isEditingMoM)}
                style={{ fontSize: 11, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {isEditingMoM ? 'Done' : 'Change'}
              </button>
            </div>
            
            {isEditingMoM ? (
              <select 
                value={match.manOfTheMatch} 
                onChange={(e) => {
                  setManOfTheMatch(e.target.value);
                  setIsEditingMoM(false);
                }}
                style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 6, background: 'var(--bg-input)', color: 'var(--chalk)', border: '1px solid var(--border)' }}
              >
                {allMatchPlayers.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize: 18, color: 'var(--chalk)', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                ⭐ {match.manOfTheMatch}
              </div>
            )}
          </div>
        )}

        <div className="share-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
          <button 
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}
            onClick={() => handleShare('web')}
          >
            <Share2 size={16} /> Share Text
          </button>
          <button 
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.3)' }}
            onClick={() => handleShare('whatsapp')}
          >
            <MessageCircle size={16} /> WhatsApp
          </button>
          <button 
            className="btn-secondary" 
            style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}
            onClick={() => handleShare('image')}
          >
            <Copy size={16} /> Share Image
          </button>
        </div>

        <div className="modal-actions" style={{ flexDirection: 'column', gap: 10 }}>
          <button 
            className="btn-secondary" 
            onClick={onViewScorecard}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <BarChart2 size={18} /> FULL SCORECARD
          </button>
          
          {isTie && (
            <button 
              className="btn-primary" 
              onClick={handleSuperOver} 
              style={{ padding: '16px', fontSize: '18px', backgroundColor: 'var(--red)' }}
            >
              🔥 PLAY SUPER OVER
            </button>
          )}

          <button className="btn-primary-small" onClick={handleSaveAndExit} style={{ padding: '16px', fontSize: '18px' }}>
            SAVE & EXIT TO HOME
          </button>
        </div>
      </div>
    </div>
  );
}
