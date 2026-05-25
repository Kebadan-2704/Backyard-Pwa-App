import { useState } from 'react';
import { useStatsStore } from '../store/statsStore';
import { Users, Plus, Edit2, Trash2, Search, X, Check } from 'lucide-react';
import './PlayersPage.css';

export default function PlayersPage() {
  const playersMap = useStatsStore(s => s.players);
  const renamePlayer = useStatsStore(s => s.renamePlayer);
  const deletePlayer = useStatsStore(s => s.deletePlayer);
  const createPlayer = useStatsStore(s => s.createPlayer);

  const [searchQuery, setSearchQuery] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const players = Object.values(playersMap).sort((a, b) => a.name.localeCompare(b.name));
  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  function handleSaveEdit() {
    if (editingPlayer && editName.trim() && editName.trim() !== editingPlayer) {
      if (playersMap[editName.trim()]) {
        alert("A player with this name already exists.");
        return;
      }
      renamePlayer(editingPlayer, editName.trim());
    }
    setEditingPlayer(null);
  }

  function handleAdd() {
    if (newName.trim()) {
      const name = newName.trim();
      if (playersMap[name]) {
        alert("Player already exists.");
        return;
      }
      createPlayer(name);
      setNewName('');
      setShowAdd(false);
    }
  }

  return (
    <div className="view-container players-page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={22} color="var(--blue)" /> Player Library
        </h1>
        <button className="btn-primary-small" onClick={() => setShowAdd(!showAdd)} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none', padding: '8px 16px' }}>
          <Plus size={16} /> ADD
        </button>
      </div>

      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search players..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 12px 12px 36px', color: 'var(--chalk)' }}
          />
        </div>
      </div>

      {showAdd && (
        <div className="glass-card slide-down" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input 
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Enter new player name..."
            autoFocus
            style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--chalk)' }}
          />
          <button className="btn-primary" onClick={handleAdd} style={{ flex: 'none', padding: '10px 16px', margin: 0 }}>
            SAVE
          </button>
        </div>
      )}

      <div className="player-list">
        {filteredPlayers.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
            No players found.
          </div>
        ) : (
          filteredPlayers.map(p => (
            <div key={p.name} className="player-row">
              {editingPlayer === p.name ? (
                <div style={{ display: 'flex', gap: 8, flex: 1, marginRight: 16 }}>
                  <input 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                    style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--chalk)' }}
                  />
                  <button className="action-btn edit" onClick={handleSaveEdit}>
                    <Check size={18} />
                  </button>
                  <button className="action-btn" onClick={() => setEditingPlayer(null)}>
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="player-info">
                    <div className="player-name">{p.name}</div>
                    <div className="player-stats">
                      Matches: {p.batting.matches} • Runs: {p.batting.runs} • Wickets: {p.bowling.wickets}
                    </div>
                  </div>
                  <div className="player-actions">
                    <button className="action-btn edit" onClick={() => { setEditingPlayer(p.name); setEditName(p.name); }}>
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn delete" onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${p.name}? This will not remove them from past match scorecards, but clears their stats.`)) {
                        deletePlayer(p.name);
                      }
                    }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
