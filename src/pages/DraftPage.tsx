import { useState } from 'react';
import { Users, UserPlus, Play, Trophy, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStatsStore } from '../store/statsStore';

interface DraftTeam {
  name: string;
  players: string[];
}

export default function DraftPage() {
  const navigate = useNavigate();
  const createTournament = useStatsStore((s) => s.createTournament);

  const [phase, setPhase] = useState<'setup' | 'draft' | 'complete'>('setup');
  
  // Setup State
  const [tourneyName, setTourneyName] = useState('Backyard Draft League');
  const [teamNamesInput, setTeamNamesInput] = useState('INDIA, AUSTRALIA');
  const [playerPoolInput, setPlayerPoolInput] = useState('');

  // Draft State
  const [teams, setTeams] = useState<DraftTeam[]>([]);
  const [pool, setPool] = useState<string[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);

  const handleStartDraft = () => {
    const tNames = teamNamesInput.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
    const pNames = playerPoolInput.split(',').map(s => s.trim()).filter(s => s);

    if (tNames.length < 2) return alert('Need at least 2 teams.');
    if (pNames.length < tNames.length) return alert('Not enough players for the teams.');

    setTeams(tNames.map(name => ({ name, players: [] })));
    setPool(pNames);
    setPhase('draft');
  };

  const handlePickPlayer = (player: string) => {
    // Add to current team
    const newTeams = [...teams];
    newTeams[currentTurn].players.push(player);
    setTeams(newTeams);

    // Remove from pool
    const newPool = pool.filter(p => p !== player);
    setPool(newPool);

    if (newPool.length === 0) {
      setPhase('complete');
    } else {
      // Next turn (snake draft logic could be added, but simple round-robin for now)
      setCurrentTurn((currentTurn + 1) % teams.length);
    }
  };

  const handleCreateTournament = () => {
    // Create the tournament
    createTournament(tourneyName, teams.map(t => t.name));
    // The teams' players aren't strictly locked into statsStore tournaments yet, 
    // but the users now know their drafted squads!
    navigate('/stats');
  };

  return (
    <div className="view-container animate-fade-in">
      <div className="glass-card" style={{ marginBottom: 24, textAlign: 'center', padding: '24px 16px' }}>
        <h2 style={{ margin: 0, color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Users size={24} /> PLAYER DRAFT
        </h2>
        <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
          Build your squads before the tournament begins.
        </p>
      </div>

      {phase === 'setup' && (
        <div className="glass-card">
          <div className="field">
            <label>Tournament Name</label>
            <input type="text" value={tourneyName} onChange={e => setTourneyName(e.target.value)} />
          </div>
          <div className="field">
            <label>Team Names (comma separated)</label>
            <input type="text" value={teamNamesInput} onChange={e => setTeamNamesInput(e.target.value)} />
          </div>
          <div className="field">
            <label>Player Pool (comma separated)</label>
            <textarea 
              rows={4} 
              placeholder="e.g. Virat, Steve, Joe, Kane, Babar, Rohit" 
              value={playerPoolInput} 
              onChange={e => setPlayerPoolInput(e.target.value)} 
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Total players: {playerPoolInput.split(',').filter(p => p.trim()).length}
            </div>
          </div>
          
          <button className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={handleStartDraft}>
            <Play size={16} /> START DRAFT
          </button>
        </div>
      )}

      {phase === 'draft' && (
        <div className="animate-fade-in">
          <div className="glass-card" style={{ background: 'rgba(255,160,0,0.1)', borderColor: 'var(--gold)' }}>
            <h3 style={{ margin: 0, color: 'var(--gold)', textAlign: 'center' }}>
              🎯 {teams[currentTurn].name}'s Turn to Pick
            </h3>
          </div>

          <div style={{ marginTop: 24 }}>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>Available Players ({pool.length})</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {pool.map(p => (
                <button 
                  key={p} 
                  className="btn-secondary" 
                  style={{ padding: '8px 16px', borderRadius: 20 }}
                  onClick={() => handlePickPlayer(p)}
                >
                  <UserPlus size={14} /> {p}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {teams.map((t, i) => (
              <div key={t.name} className="glass-card" style={{ padding: 12, border: i === currentTurn ? '1px solid var(--gold)' : '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 12px 0', color: i === currentTurn ? 'var(--gold)' : 'var(--text-primary)' }}>
                  {t.name}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {t.players.map((p, idx) => (
                    <div key={idx} style={{ fontSize: 13, background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: 4 }}>
                      {idx + 1}. {p}
                    </div>
                  ))}
                  {t.players.length === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No picks yet</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === 'complete' && (
        <div className="animate-fade-in text-center">
          <div className="glass-card" style={{ textAlign: 'center', padding: 32 }}>
            <Trophy size={48} color="var(--gold)" style={{ marginBottom: 16 }} />
            <h2 style={{ margin: 0 }}>Draft Complete!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>The squads are locked in.</p>
          </div>

          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'left' }}>
            {teams.map(t => (
              <div key={t.name} className="glass-card" style={{ padding: 12 }}>
                <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>{t.name}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {t.players.map((p, idx) => (
                    <div key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{idx + 1}. {p}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: 32 }} onClick={handleCreateTournament}>
            CREATE TOURNAMENT & PROCEED <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
