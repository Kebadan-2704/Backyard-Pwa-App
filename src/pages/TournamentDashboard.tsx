import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournamentStore, getRoundLabel } from '../store/tournamentStore';
import { useMatchStore } from '../store/matchStore';
import { createDefaultSettings } from '../types/cricket';
import type { TournamentFormat, Fixture } from '../types/cricket';
import { Trophy, Plus, Play, Users, Trash2, Crown, ChevronRight, UserPlus, Shield } from 'lucide-react';
import './TournamentDashboard.css';

export default function TournamentDashboard() {
  const navigate = useNavigate();
  const tournaments = useTournamentStore(s => s.tournaments);
  const activeTournamentId = useTournamentStore(s => s.activeTournamentId);
  const createTournament = useTournamentStore(s => s.createTournament);
  const setActiveTournament = useTournamentStore(s => s.setActiveTournament);
  const deleteTournament = useTournamentStore(s => s.deleteTournament);
  const startFixture = useTournamentStore(s => s.startFixture);
  const addScorer = useTournamentStore(s => s.addScorer);
  const startMatch = useMatchStore(s => s.startMatch);

  const [showCreate, setShowCreate] = useState(false);
  const [tName, setTName] = useState('');
  const [tFormat, setTFormat] = useState<TournamentFormat>('knockout');
  const [tTeams, setTTeams] = useState('');
  const [tOvers, setTOvers] = useState(6);
  const [scorerInput, setScorerInput] = useState<{ fId: string; name: string } | null>(null);

  const activeTournament = tournaments.find(t => t.id === activeTournamentId) || null;

  function handleCreate() {
    const teamNames = tTeams.split(',').map(s => s.trim()).filter(Boolean);
    if (!tName.trim() || teamNames.length < 2) {
      alert('Enter a tournament name and at least 2 teams');
      return;
    }
    const settings = createDefaultSettings();
    settings.overs = tOvers;
    settings.playersPerTeam = 11;
    settings.maxWickets = 10;

    createTournament({ name: tName, format: tFormat, teamNames, settings });
    setShowCreate(false);
    setTName('');
    setTTeams('');
  }

  function handleStartMatch(fixture: Fixture) {
    if (!activeTournament) return;
    if (fixture.team1 === 'TBD' || fixture.team2 === 'TBD') {
      alert('Both teams must be decided before starting this match.');
      return;
    }
    const s = activeTournament.settings;
    const p1 = Array.from({ length: s.playersPerTeam }, (_, i) => `Player ${i + 1}`);
    const p2 = Array.from({ length: s.playersPerTeam }, (_, i) => `Player ${i + 1}`);

    startMatch({
      team1: fixture.team1,
      team2: fixture.team2,
      players1: p1,
      players2: p2,
      settings: s,
      tossWinner: fixture.team1,
      tossChoice: 'bat',
      matchType: activeTournament.format === 'knockout' ? 'knockout' : 'league',
    });

    startFixture(activeTournament.id, fixture.id, Date.now());
    navigate('/scorer');
  }

  function handleAddScorer(fixtureId: string) {
    if (!scorerInput || !activeTournament) return;
    addScorer(activeTournament.id, fixtureId, scorerInput.name.trim());
    setScorerInput(null);
  }

  // Group fixtures by round
  const fixturesByRound: Record<number, Fixture[]> = {};
  if (activeTournament) {
    const totalRounds = Math.max(...activeTournament.fixtures.map(f => f.round));
    activeTournament.fixtures.forEach(f => {
      if (!fixturesByRound[f.round]) fixturesByRound[f.round] = [];
      fixturesByRound[f.round].push(f);
    });
  }

  return (
    <div className="view-container tournament-page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trophy size={22} color="var(--gold)" /> Tournaments
        </h1>
        <button className="btn-primary-small" onClick={() => setShowCreate(!showCreate)} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none', padding: '8px 16px' }}>
          <Plus size={16} /> NEW
        </button>
      </div>

      {/* CREATE FORM */}
      {showCreate && (
        <div className="glass-card slide-down" style={{ marginBottom: 20 }}>
          <div className="card-title">CREATE TOURNAMENT</div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Tournament Name</label>
            <input value={tName} onChange={e => setTName(e.target.value)} placeholder="e.g. Backyard Premier League" maxLength={30} />
          </div>
          <div className="format-grid">
            <div className="field">
              <label>Format</label>
              <select value={tFormat} onChange={e => setTFormat(e.target.value as TournamentFormat)}>
                <option value="knockout">Knockout</option>
                <option value="league">League (Round Robin)</option>
              </select>
            </div>
            <div className="field">
              <label>Overs per Match</label>
              <input type="number" value={tOvers} onChange={e => setTOvers(parseInt(e.target.value) || 6)} min={1} max={50} />
            </div>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Team Names (comma separated)</label>
            <textarea
              value={tTeams}
              onChange={e => setTTeams(e.target.value)}
              placeholder="CSK, RCB, MI, SRH, KKR, PBKS, DC, RR"
              rows={3}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>CANCEL</button>
            <button className="btn-primary" onClick={handleCreate}>CREATE</button>
          </div>
        </div>
      )}

      {/* TOURNAMENT LIST */}
      {!activeTournament && (
        <div>
          {tournaments.length === 0 && !showCreate && (
            <div className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
              <Trophy size={48} color="var(--gold)" style={{ opacity: 0.4, marginBottom: 16 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No tournaments yet. Create one to get started!</p>
            </div>
          )}
          {tournaments.map(t => (
            <div
              key={t.id}
              className="glass-card tournament-card"
              onClick={() => setActiveTournament(t.id)}
              style={{ cursor: 'pointer', marginBottom: 12 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--chalk)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {t.isComplete && <Crown size={16} color="var(--gold)" />}
                    {t.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {t.format.toUpperCase()} • {t.teams.length} Teams • {t.fixtures.filter(f => f.status === 'completed').length}/{t.fixtures.length} matches played
                  </div>
                  {t.champion && (
                    <div style={{ fontSize: 13, color: 'var(--gold)', marginTop: 6, fontWeight: 600 }}>
                      🏆 Champion: {t.champion}
                    </div>
                  )}
                </div>
                <ChevronRight size={20} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ACTIVE TOURNAMENT DETAIL */}
      {activeTournament && (
        <div className="slide-down">
          <div className="glass-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: 18, color: 'var(--gold)', marginBottom: 4 }}>{activeTournament.name}</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {activeTournament.format.toUpperCase()} • {activeTournament.teams.length} Teams • {activeTournament.settings.overs} overs
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" onClick={() => setActiveTournament(null)} style={{ padding: '6px 12px', fontSize: 12 }}>
                  ← BACK
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => { if (confirm('Delete this tournament?')) deleteTournament(activeTournament.id); }}
                  style={{ padding: '6px 12px', fontSize: 12, color: 'var(--leather)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {activeTournament.champion && (
              <div className="champion-banner">
                <Crown size={24} /> CHAMPION: {activeTournament.champion}
              </div>
            )}
          </div>

          {/* LEAGUE STANDINGS TABLE */}
          {activeTournament.format === 'league' && (
            <div className="glass-card" style={{ marginBottom: 16 }}>
              <div className="card-title"><Shield size={14} style={{ marginRight: 6 }} /> STANDINGS</div>
              <div className="sc-table-container">
                <table className="sc-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Team</th>
                      <th>P</th>
                      <th>W</th>
                      <th>L</th>
                      <th>Pts</th>
                      <th>NRR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...activeTournament.teams]
                      .sort((a, b) => b.points - a.points || b.nrr - a.nrr)
                      .map((team, i) => (
                        <tr key={team.name} className={i < 2 ? 'highlight-row' : ''}>
                          <td style={{ textAlign: 'left', fontWeight: 600 }}>
                            {i + 1}. {team.name}
                          </td>
                          <td>{team.played}</td>
                          <td style={{ color: 'var(--green)' }}>{team.won}</td>
                          <td style={{ color: 'var(--leather-light)' }}>{team.lost}</td>
                          <td style={{ fontWeight: 700, color: 'var(--gold)' }}>{team.points}</td>
                          <td style={{ fontSize: 11 }}>{team.nrr >= 0 ? '+' : ''}{team.nrr.toFixed(3)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FIXTURES BY ROUND */}
          {Object.entries(fixturesByRound)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([round, fixtures]) => {
              const totalRounds = Math.max(...activeTournament.fixtures.map(f => f.round));
              const label = getRoundLabel(Number(round), totalRounds, activeTournament.format);
              return (
                <div key={round} style={{ marginBottom: 20 }}>
                  <div className="round-header">
                    {label}
                  </div>
                  {fixtures.map(fixture => (
                    <div key={fixture.id} className={`fixture-card ${fixture.status}`}>
                      <div className="fixture-teams">
                        <span className={`fixture-team ${fixture.winner === fixture.team1 ? 'winner' : ''}`}>
                          {fixture.team1}
                          {fixture.score1 && <span className="fixture-score">{fixture.score1}</span>}
                        </span>
                        <span className="fixture-vs">vs</span>
                        <span className={`fixture-team ${fixture.winner === fixture.team2 ? 'winner' : ''}`}>
                          {fixture.team2}
                          {fixture.score2 && <span className="fixture-score">{fixture.score2}</span>}
                        </span>
                      </div>

                      <div className="fixture-actions">
                        {fixture.status === 'upcoming' && fixture.team1 !== 'TBD' && fixture.team2 !== 'TBD' && (
                          <button className="btn-primary-small" onClick={() => handleStartMatch(fixture)} style={{ fontSize: 11, padding: '6px 12px' }}>
                            <Play size={12} /> START
                          </button>
                        )}
                        {fixture.status === 'live' && (
                          <span className="live-badge">● LIVE</span>
                        )}
                        {fixture.status === 'completed' && fixture.winner && (
                          <span className="winner-badge">🏆 {fixture.winner}</span>
                        )}
                      </div>

                      {/* Multi-scorer management */}
                      <div className="fixture-scorers">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                          <Users size={10} /> Scorers: {fixture.scorers.length === 0 ? 'None' : fixture.scorers.join(', ')}
                        </div>
                        {fixture.status !== 'completed' && (
                          <>
                            {scorerInput?.fId === fixture.id ? (
                              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                                <input
                                  value={scorerInput.name}
                                  onChange={e => setScorerInput({ fId: fixture.id, name: e.target.value })}
                                  placeholder="Scorer name"
                                  style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input)', color: '#fff', flex: 1 }}
                                />
                                <button className="btn-primary-small" onClick={() => handleAddScorer(fixture.id)} style={{ fontSize: 10, padding: '4px 8px' }}>
                                  ADD
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setScorerInput({ fId: fixture.id, name: '' })}
                                style={{ background: 'none', border: 'none', color: 'var(--cyan)', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}
                              >
                                <UserPlus size={10} /> Add Scorer
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
