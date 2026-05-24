import { useState, useMemo } from 'react';
import { Search, Trophy, Medal, Users, User, Play } from 'lucide-react';
import { useStatsStore } from '../store/statsStore';
import { useNavigate } from 'react-router-dom';
import PlayerProfileModal from '../components/modals/PlayerProfileModal';
import type { PlayerProfile } from '../types/stats';

export default function StatsPage() {
  const navigate = useNavigate();
  const { players } = useStatsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null);

  const allPlayers = Object.values(players);
  
  // Memoize search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allPlayers.filter(p => p.name.toLowerCase().includes(query));
  }, [searchQuery, allPlayers]);

  const topBatters = [...allPlayers].sort((a, b) => b.batting.runs - a.batting.runs).slice(0, 5);
  const topBowlers = [...allPlayers].sort((a, b) => b.bowling.wickets - a.bowling.wickets).slice(0, 5);

  return (
    <div className="view-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Trophy size={28} color="var(--gold)" />
        <h1 style={{ margin: 0, fontSize: 24, color: 'var(--chalk)' }}>Player Stats</h1>
      </div>

      <div className="glass-card" style={{ padding: 12, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Search size={20} color="var(--text-secondary)" />
        <input 
          type="search"
          placeholder="Search player name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--chalk)', fontSize: 16, outline: 'none' }}
        />
      </div>

      {searchQuery.trim() ? (
        <div className="animate-fade-in">
          <h3 style={{ margin: '0 0 16px 0', fontSize: 14, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Search Results ({searchResults.length})
          </h3>
          {searchResults.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <User size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
              <p>No players found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchResults.map(p => (
                <button 
                  key={p.name}
                  className="glass-card"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, cursor: 'pointer', textAlign: 'left', transition: 'transform 0.2s' }}
                  onClick={() => setSelectedPlayer(p)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--panel-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--gold)' }}>
                      {p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--chalk)' }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.batting.matches} Matches Played</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>RUNS</div>
                      <div style={{ fontWeight: 700, color: 'var(--gold)' }}>{p.batting.runs}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>WKTS</div>
                      <div style={{ fontWeight: 700, color: 'var(--magenta)' }}>{p.bowling.wickets}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {allPlayers.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <Users size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
              <p>No players recorded yet.</p>
              <p style={{ fontSize: 12 }}>Finish a match to generate player profiles.</p>
              <button className="btn-primary" style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 8, width: '100%' }} onClick={() => navigate('/')}>
                <Play size={18} /> PLAY MATCH
              </button>
            </div>
          ) : (
            <>
              {/* TOP BATTERS */}
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(90deg, rgba(255, 160, 0, 0.1), transparent)' }}>
                  <h3 style={{ margin: 0, fontSize: 16, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    🟠 Orange Cap (Runs)
                  </h3>
                </div>
                {topBatters.map((p, idx) => (
                  <button key={p.name} onClick={() => setSelectedPlayer(p)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--border)', alignItems: 'center', background: 'transparent', border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--border)', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 24, fontWeight: 700, color: 'var(--text-secondary)' }}>{idx + 1}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--chalk)' }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {p.batting.matches} M | Avg: {p.batting.innings > 0 ? (p.batting.runs / (p.batting.innings - p.batting.notOuts || 1)).toFixed(1) : 0} | SR: {p.batting.ballsFaced > 0 ? ((p.batting.runs / p.batting.ballsFaced) * 100).toFixed(0) : 0}
                        </div>
                        {(p.batting.hundreds > 0 || p.batting.fifties > 0) && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 4, fontSize: 11 }}>
                            {p.batting.hundreds > 0 && <span style={{ background: 'rgba(255,160,0,0.15)', color: 'var(--gold)', padding: '2px 6px', borderRadius: 4 }}>💯 x{p.batting.hundreds}</span>}
                            {p.batting.fifties > 0 && <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--chalk)', padding: '2px 6px', borderRadius: 4 }}>🎖️ x{p.batting.fifties}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
                      {p.batting.runs}
                    </div>
                  </button>
                ))}
              </div>

              {/* TOP BOWLERS */}
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(90deg, rgba(147, 51, 234, 0.1), transparent)' }}>
                  <h3 style={{ margin: 0, fontSize: 16, color: 'var(--magenta)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    🟣 Purple Cap (Wickets)
                  </h3>
                </div>
                {topBowlers.map((p, idx) => (
                  <button key={p.name} onClick={() => setSelectedPlayer(p)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--border)', alignItems: 'center', background: 'transparent', border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--border)', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 24, fontWeight: 700, color: 'var(--text-secondary)' }}>{idx + 1}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--chalk)' }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {p.bowling.matches} M | Econ: {p.bowling.ballsBowled > 0 ? ((p.bowling.runsConceded / p.bowling.ballsBowled) * 6).toFixed(1) : 0} | Best: {p.bowling.bestBowling.wickets}/{p.bowling.bestBowling.runs}
                        </div>
                        {p.bowling.fiveWicketHauls > 0 && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 4, fontSize: 11 }}>
                            <span style={{ background: 'rgba(147, 51, 234, 0.15)', color: 'var(--magenta)', padding: '2px 6px', borderRadius: 4 }}>🎯 5-Fer x{p.bowling.fiveWicketHauls}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--magenta)' }}>
                      {p.bowling.wickets}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {selectedPlayer && (
        <PlayerProfileModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </div>
  );
}

