import { useNavigate } from 'react-router-dom';
import { useTournamentStore } from '../store/tournamentStore';
import { Trophy, ChevronLeft, Calendar, User, Star } from 'lucide-react';

export default function ArchivesPage() {
  const navigate = useNavigate();
  const tournaments = useTournamentStore((s) => s.tournaments);
  const archived = tournaments.filter(t => t.isComplete).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="view-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ margin: 0, fontSize: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trophy color="var(--gold)" /> HALL OF FAME
        </h1>
      </div>

      {archived.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <Star size={48} style={{ opacity: 0.2, marginBottom: 16, display: 'inline-block' }} />
          <h3>No Archives Yet</h3>
          <p>Complete a tournament to cement your legacy in the Hall of Fame.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {archived.map(t => (
            <div key={t.id} className="glass-card slide-down" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.05, transform: 'rotate(15deg)' }}>
                <Trophy size={120} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 20, color: 'var(--gold)', margin: '0 0 4px 0' }}>{t.name}</h2>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} />
                    {new Date(t.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                    <span style={{ margin: '0 4px' }}>•</span>
                    {t.format.toUpperCase()}
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: 1, marginBottom: 4 }}>
                  Champion
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🏆 {t.champion || 'Unknown'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={12} /> Teams
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t.teams.length} Teams
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={12} /> Matches
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t.fixtures.length} Played
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
