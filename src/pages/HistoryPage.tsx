import { useState, useMemo } from 'react';
import { useHistoryStore } from '../store/historyStore';
import { useMatchStore } from '../store/matchStore';
import { useNavigate } from 'react-router-dom';
import type { Match } from '../types/cricket';
import { Download, Upload, Trash2, Search, Trophy, Calendar, Activity, CheckCircle, AlertCircle, Play } from 'lucide-react';
import ScorecardModal from '../components/modals/ScorecardModal';
import MatchEditorModal from '../components/modals/MatchEditorModal';
import { exportAsJSON, exportAsCSV } from '../utils/sharing';
import { Edit3 } from 'lucide-react';
import './HistoryPage.css';

export default function HistoryPage() {
  const matches = useHistoryStore((s) => s.matches);
  const deleteMatch = useHistoryStore((s) => s.deleteMatch);
  const clearHistory = useHistoryStore((s) => s.clearHistory);
  const importMatches = useHistoryStore((s) => s.importMatches);
  const searchHistory = useHistoryStore((s) => s.searchHistory);
  const resumeMatch = useMatchStore((s) => s.resumeMatch);
  
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const displayedMatches = useMemo(() => {
    if (search.trim() === '') return matches;
    return searchHistory(search);
  }, [matches, search, searchHistory]);

  function handleExportJSON() {
    exportAsJSON(matches);
  }

  function handleExportCSV() {
    exportAsCSV(matches);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          importMatches(data);
          alert(`Successfully imported ${data.length} matches!`);
        }
      } catch (err) {
        alert('Invalid file format. Please upload a valid JSON backup.');
      }
    };
    reader.readAsText(file);
  }

  function handleDelete(id: number) {
    if (window.confirm('Are you sure you want to delete this match?')) {
      deleteMatch(id);
    }
  }

  function handleResume(e: React.MouseEvent, m: Match) {
    e.stopPropagation();
    resumeMatch(m);
    navigate('/scorer');
  }

  return (
    <div className="view-container history-page">
      <div className="history-header">
        <div className="search-bar">
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search teams, venue, date..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="history-actions">
          <button className="icon-btn-pill" onClick={handleExportJSON} title="Export JSON backup">
            <Download size={16} /> JSON
          </button>
          <button className="icon-btn-pill" onClick={handleExportCSV} title="Export CSV for Excel">
            <Download size={16} /> CSV
          </button>
          <label className="icon-btn-pill" style={{ cursor: 'pointer' }} title="Import JSON backup">
            <Upload size={16} /> Import
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </label>
        </div>
      </div>

      {displayedMatches.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 60 }}>
          <Trophy size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
          <p>No matches found.</p>
        </div>
      ) : (
        <div className="match-list">
          {displayedMatches.map((m) => (
            <div key={m.id} className="glass-card match-card" onClick={() => setSelectedMatch(m)}>
              <div className="mc-header">
                <div className="mc-date"><Calendar size={12} /> {m.date}</div>
                {!m.complete ? (
                  <span className="mc-badge incomplete"><Activity size={10} /> IN PROGRESS</span>
                ) : m.isAbandoned ? (
                  <span className="mc-badge abandoned"><AlertCircle size={10} /> ABANDONED</span>
                ) : (
                  <span className="mc-badge complete"><CheckCircle size={10} /> FINAL</span>
                )}
              </div>

              <div className="mc-teams">
                <div className="mc-team">
                  <span className="mc-team-name" style={{ color: m.teamColors[0] }}>{m.teams[0]}</span>
                  <span className="mc-team-score">
                    {m.innings[0].runs}/{m.innings[0].wickets} 
                    <span className="mc-team-overs">({Math.floor(m.innings[0].deliveries.length/6)}.{m.innings[0].deliveries.length%6})</span>
                  </span>
                </div>
                <div className="mc-vs">vs</div>
                <div className="mc-team right">
                  <span className="mc-team-name" style={{ color: m.teamColors[1] }}>{m.teams[1]}</span>
                  <span className="mc-team-score">
                    {m.innings[1].runs}/{m.innings[1].wickets}
                    <span className="mc-team-overs">({Math.floor(m.innings[1].deliveries.length/6)}.{m.innings[1].deliveries.length%6})</span>
                  </span>
                </div>
              </div>

              <div className="mc-footer">
                <div className="mc-result">
                  {m.complete 
                    ? `🏆 ${m.winner === 'Match tied' || m.winner === 'Abandoned' ? m.winner : `${m.winner} won ${m.margin}`}`
                    : 'Match in progress...'
                  }
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!m.complete && (
                    <button 
                    className="icon-btn-pill" 
                    style={{ backgroundColor: 'var(--gold)', color: 'var(--bg-card)' }}
                    onClick={(e) => handleResume(e, m)}
                    aria-label="Resume match"
                  >
                    <Play size={14} fill="currentColor" /> Resume
                  </button>
                )}
                {m.complete && (
                  <button 
                    className="icon-btn-pill" 
                    onClick={(e) => { e.stopPropagation(); setEditingMatch(m); }}
                    aria-label="Edit match"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                )}
                <button 
                  className="icon-btn-danger" 
                  onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                  aria-label="Delete match"
                >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {matches.length > 0 && search === '' && (
        <button 
          className="btn-secondary" 
          style={{ width: '100%', marginTop: 24, color: 'var(--leather-light)', borderColor: 'rgba(231,76,60,0.3)' }}
          onClick={() => window.confirm('Delete ALL history? This cannot be undone.') && clearHistory()}
        >
          CLEAR ALL HISTORY
        </button>
      )}

      {selectedMatch && (
        <ScorecardModal 
          onClose={() => setSelectedMatch(null)} 
          matchData={selectedMatch} 
          initialInnings={0}
        />
      )}

      {editingMatch && (
        <MatchEditorModal
          match={editingMatch}
          onClose={() => setEditingMatch(null)}
        />
      )}
    </div>
  );
}
