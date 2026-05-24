import { useState } from 'react';
import { Trophy, Users, BarChart3, Medal, Play } from 'lucide-react';
import { useStatsStore } from '../store/statsStore';
import { useNavigate } from 'react-router-dom';

export default function StatsPage() {
  const navigate = useNavigate();
  const { players, tournaments, activeTournamentId, createTournament, setActiveTournament } = useStatsStore();
  const [activeTab, setActiveTab] = useState<'tournament' | 'career'>('tournament');
  const [newTourneyName, setNewTourneyName] = useState('');
  const [newTourneyTeams, setNewTourneyTeams] = useState('INDIA, AUSTRALIA, ENGLAND');

  const activeTournament = activeTournamentId ? tournaments[activeTournamentId] : null;

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTourneyName.trim() || !newTourneyTeams.trim()) return;
    const teamsList = newTourneyTeams.split(',').map(t => t.trim().toUpperCase()).filter(t => t);
    if (teamsList.length < 2) return alert('Need at least 2 teams');
    createTournament(newTourneyName, teamsList);
    setNewTourneyName('');
  };

  // 1. Points Table Sorting
  const sortedTeams = activeTournament 
    ? Object.values(activeTournament.teams).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.netRunRate - a.netRunRate;
      })
    : [];

  // 2. Career Leaderboards
  const allPlayers = Object.values(players);
  const topBatters = [...allPlayers].sort((a, b) => b.batting.runs - a.batting.runs).slice(0, 5);
  const topBowlers = [...allPlayers].sort((a, b) => b.bowling.wickets - a.bowling.wickets).slice(0, 5);

  return (
    <div className="view-container">
      {/* Sub Tabs */}
      <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 'var(--radius)', padding: 4, marginBottom: 24 }}>
        <button 
          style={{ flex: 1, padding: '10px', background: activeTab === 'tournament' ? 'var(--panel-solid)' : 'transparent', color: activeTab === 'tournament' ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={() => setActiveTab('tournament')}
        >
          <Trophy size={16} /> Tournament
        </button>
        <button 
          style={{ flex: 1, padding: '10px', background: activeTab === 'career' ? 'var(--panel-solid)' : 'transparent', color: activeTab === 'career' ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={() => setActiveTab('career')}
        >
          <BarChart3 size={16} /> Career Stats
        </button>
      </div>

      {activeTab === 'tournament' && (
        <div className="animate-fade-in">
          {!activeTournament ? (
            <div className="glass-card">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gold)', marginBottom: 16 }}>
                <Medal size={20} /> Create Tournament
              </h2>
              <form onSubmit={handleCreateTournament} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="field">
                  <label>Tournament Name</label>
                  <input type="text" placeholder="e.g. Backyard Premier League" value={newTourneyName} onChange={(e) => setNewTourneyName(e.target.value)} />
                </div>
                <div className="field">
                  <label>Teams (comma separated)</label>
                  <textarea placeholder="INDIA, AUSTRALIA, ENGLAND" value={newTourneyTeams} onChange={(e) => setNewTourneyTeams(e.target.value)} rows={3} />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}>CREATE TOURNAMENT</button>
              </form>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, color: 'var(--gold)' }}>{activeTournament.name}</h2>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {activeTournament.matchIds.length} Matches Played
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTournament(null)}
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12 }}
                >
                  Change
                </button>
              </div>

              <div className="glass-card" style={{ padding: '0', overflow: 'hidden', marginBottom: 24 }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}>
                  <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Trophy size={16} /> Points Table</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Team</th>
                        <th style={{ padding: '12px', fontWeight: 600 }}>P</th>
                        <th style={{ padding: '12px', fontWeight: 600 }}>W</th>
                        <th style={{ padding: '12px', fontWeight: 600 }}>L</th>
                        <th style={{ padding: '12px', fontWeight: 600, color: 'var(--gold)' }}>Pts</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>NRR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTeams.map((team, idx) => (
                        <tr key={team.teamName} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: idx === 0 ? 'var(--gold)' : 'var(--text-primary)' }}>
                            {team.teamName}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{team.played}</td>
                          <td style={{ padding: '12px', color: 'var(--green)' }}>{team.won}</td>
                          <td style={{ padding: '12px', color: 'var(--red)' }}>{team.lost}</td>
                          <td style={{ padding: '12px', fontWeight: 700, color: 'var(--gold)' }}>{team.points}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-display)' }}>
                            {team.netRunRate > 0 ? '+' : ''}{team.netRunRate.toFixed(3)}
                          </td>
                        </tr>
                      ))}
                      {sortedTeams.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No teams</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <button className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8 }} onClick={() => navigate('/setup')}>
                <Play size={18} /> PLAY TOURNAMENT MATCH
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === 'career' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {allPlayers.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <Users size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
              <p>No players recorded yet.</p>
              <p style={{ fontSize: 12 }}>Finish a match to generate player profiles.</p>
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
                  <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 24, fontWeight: 700, color: 'var(--text-secondary)' }}>{idx + 1}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 16 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {p.batting.matches} M | Avg: {p.batting.innings > 0 ? (p.batting.runs / (p.batting.innings - p.batting.notOuts || 1)).toFixed(1) : 0} | SR: {p.batting.ballsFaced > 0 ? ((p.batting.runs / p.batting.ballsFaced) * 100).toFixed(0) : 0}
                        </div>
                        {(p.batting.hundreds > 0 || p.batting.fifties > 0) && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 4, fontSize: 11 }}>
                            {p.batting.hundreds > 0 && <span style={{ background: 'rgba(255,160,0,0.15)', color: 'var(--gold)', padding: '2px 6px', borderRadius: 4 }}>💯 x{p.batting.hundreds}</span>}
                            {p.batting.fifties > 0 && <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', padding: '2px 6px', borderRadius: 4 }}>🎖️ x{p.batting.fifties}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
                      {p.batting.runs}
                    </div>
                  </div>
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
                  <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 24, fontWeight: 700, color: 'var(--text-secondary)' }}>{idx + 1}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 16 }}>{p.name}</div>
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
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
