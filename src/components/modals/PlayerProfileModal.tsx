import { X, Trophy, Target, TrendingUp } from 'lucide-react';
import type { PlayerProfile } from '../../types/cricket';
import './Modals.css';

interface Props {
  player: PlayerProfile;
  onClose: () => void;
}

export default function PlayerProfileModal({ player, onClose }: Props) {
  const { batting, bowling } = player;

  const batAvg = batting.innings > 0 ? (batting.runs / (batting.innings - batting.notOuts || 1)).toFixed(1) : '0.0';
  const batSR = batting.ballsFaced > 0 ? ((batting.runs / batting.ballsFaced) * 100).toFixed(1) : '0.0';

  const bowlAvg = bowling.wickets > 0 ? (bowling.runsConceded / bowling.wickets).toFixed(1) : '0.0';
  const bowlEcon = bowling.ballsBowled > 0 ? ((bowling.runsConceded / bowling.ballsBowled) * 6).toFixed(1) : '0.0';
  const bowlSR = bowling.wickets > 0 ? (bowling.ballsBowled / bowling.wickets).toFixed(1) : '0.0';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--bg-card), var(--panel-solid))', padding: '24px 20px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
          <button className="icon-btn" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16 }}>
            <X size={20} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: 'var(--panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--gold)', border: '2px solid var(--gold)' }}>
              {player.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, color: 'var(--chalk)' }}>{player.name}</h2>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>🏏 Matches: {batting.matches}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: 20, maxHeight: '60vh', overflowY: 'auto' }}>
          {/* BATTING STATS */}
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} /> Batting
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <div className="glass-card" style={{ padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Innings</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--chalk)' }}>{batting.innings}</div>
            </div>
            <div className="glass-card" style={{ padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Runs</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>{batting.runs}</div>
            </div>
            <div className="glass-card" style={{ padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--chalk)' }}>{batAvg}</div>
            </div>
            <div className="glass-card" style={{ padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Strike Rate</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--chalk)' }}>{batSR}</div>
            </div>
            <div className="glass-card" style={{ padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Highest</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--chalk)' }}>{batting.highestScore}</div>
            </div>
            <div className="glass-card" style={{ padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Not Outs</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--chalk)' }}>{batting.notOuts}</div>
            </div>
          </div>

          {(batting.fifties > 0 || batting.hundreds > 0) && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'center' }}>
              {batting.hundreds > 0 && (
                <div style={{ background: 'rgba(255, 160, 0, 0.1)', border: '1px solid var(--gold)', borderRadius: 20, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gold)', fontWeight: 600 }}>
                  <Trophy size={16} /> {batting.hundreds} Centuries
                </div>
              )}
              {batting.fifties > 0 && (
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--text-secondary)', borderRadius: 20, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--chalk)', fontWeight: 600 }}>
                  🎖️ {batting.fifties} Fifties
                </div>
              )}
            </div>
          )}

          {/* BOWLING STATS */}
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: 'var(--magenta)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={18} /> Bowling
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <div className="glass-card" style={{ padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Innings</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--chalk)' }}>{bowling.innings}</div>
            </div>
            <div className="glass-card" style={{ padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Wickets</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--magenta)' }}>{bowling.wickets}</div>
            </div>
            <div className="glass-card" style={{ padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Economy</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--chalk)' }}>{bowlEcon}</div>
            </div>
            <div className="glass-card" style={{ padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--chalk)' }}>{bowlAvg}</div>
            </div>
            <div className="glass-card" style={{ padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Strike Rate</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--chalk)' }}>{bowlSR}</div>
            </div>
            <div className="glass-card" style={{ padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Best Bowling</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--chalk)' }}>
                {bowling.bestBowling.wickets}/{bowling.bestBowling.runs}
              </div>
            </div>
          </div>
          
          {bowling.fiveWicketHauls > 0 && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <div style={{ background: 'rgba(147, 51, 234, 0.1)', border: '1px solid var(--magenta)', borderRadius: 20, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--magenta)', fontWeight: 600 }}>
                🎯 {bowling.fiveWicketHauls} Five-Fers
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
