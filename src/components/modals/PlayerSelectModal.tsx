import { useState } from 'react';
import { useStatsStore } from '../../store/statsStore';
import { Search, X, Check } from 'lucide-react';
import './Modals.css';

interface PlayerSelectModalProps {
  onClose: () => void;
  onSelect: (selectedPlayers: string[]) => void;
  alreadySelected: string[];
  teamName: string;
}

export default function PlayerSelectModal({ onClose, onSelect, alreadySelected, teamName }: PlayerSelectModalProps) {
  const playersMap = useStatsStore(s => s.players);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local state for checkboxes
  const [selected, setSelected] = useState<string[]>([]);

  // All players
  const allPlayers = Object.keys(playersMap).sort((a, b) => a.localeCompare(b));
  
  // Filter out players who are already in the team (if we want to hide them, but we probably want to let them toggle them)
  // Actually, wait, `alreadySelected` means they are in the team currently.
  // We should initialize `selected` with `alreadySelected`.
  // Oh wait, `useState` only runs once. Let's do that.
  useState(() => {
    setSelected(alreadySelected);
  });

  const filteredPlayers = allPlayers.filter(p => p.toLowerCase().includes(searchQuery.toLowerCase()));

  function togglePlayer(name: string) {
    if (selected.includes(name)) {
      setSelected(selected.filter(p => p !== name));
    } else {
      setSelected([...selected, name]);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content slide-up" style={{ maxWidth: 400, width: '100%' }}>
        <div className="modal-header">
          <h2>Select {teamName} Players</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search library..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 12px 12px 36px', color: 'var(--chalk)' }}
            />
          </div>

          <div style={{ maxHeight: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredPlayers.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No players found.</div>
            ) : (
              filteredPlayers.map(p => {
                const isSelected = selected.includes(p);
                return (
                  <div 
                    key={p} 
                    onClick={() => togglePlayer(p)}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', background: isSelected ? 'rgba(0, 242, 254, 0.1)' : 'var(--panel)',
                      border: `1px solid ${isSelected ? 'var(--cyan)' : 'var(--border)'}`,
                      borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ color: isSelected ? 'var(--cyan)' : 'var(--chalk)', fontWeight: isSelected ? 600 : 400 }}>{p}</span>
                    {isSelected && <Check size={18} color="var(--cyan)" />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: 24 }}>
          <button className="btn-secondary" onClick={onClose}>CANCEL</button>
          <button className="btn-primary-small" onClick={() => onSelect(selected)}>DONE ({selected.length})</button>
        </div>
      </div>
    </div>
  );
}
