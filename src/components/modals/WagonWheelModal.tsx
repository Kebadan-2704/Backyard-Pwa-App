import { useMatchStore } from '../../store/matchStore';
import type { ShotRegion } from '../../types/cricket';
import './Modals.css';

interface Props {
  onSelectRegion: (region: ShotRegion) => void;
  onSkip: () => void;
}

export default function WagonWheelModal({ onSelectRegion, onSkip }: Props) {
  const match = useMatchStore((s) => s.match);
  const inn = match?.innings[match.currentInnings];
  const striker = inn?.striker ? inn.batters[inn.striker] : null;
  const isLHB = striker?.battingStyle === 'LHB';

  const zones = [
    { idRHB: 'third-man', idLHB: 'fine-leg', labelRHB: 'Third Man', labelLHB: 'Fine Leg', path: 'M 150 150 L 256 44 A 150 150 0 0 0 150 0 Z', tx: 175, ty: 40 },
    { idRHB: 'point', idLHB: 'deep-square-leg', labelRHB: 'Point', labelLHB: 'Square Leg', path: 'M 150 150 L 300 150 A 150 150 0 0 0 256 44 Z', tx: 250, ty: 100 },
    { idRHB: 'cover', idLHB: 'deep-midwicket', labelRHB: 'Cover', labelLHB: 'Midwicket', path: 'M 150 150 L 256 256 A 150 150 0 0 0 300 150 Z', tx: 240, ty: 220 },
    { idRHB: 'long-off', idLHB: 'long-on', labelRHB: 'Long Off', labelLHB: 'Long On', path: 'M 150 150 L 150 300 A 150 150 0 0 0 256 256 Z', tx: 180, ty: 280 },
    { idRHB: 'long-on', idLHB: 'long-off', labelRHB: 'Long On', labelLHB: 'Long Off', path: 'M 150 150 L 44 256 A 150 150 0 0 0 150 300 Z', tx: 80, ty: 280 },
    { idRHB: 'deep-midwicket', idLHB: 'cover', labelRHB: 'Midwicket', labelLHB: 'Cover', path: 'M 150 150 L 0 150 A 150 150 0 0 0 44 256 Z', tx: 20, ty: 220 },
    { idRHB: 'deep-square-leg', idLHB: 'point', labelRHB: 'Square Leg', labelLHB: 'Point', path: 'M 150 150 L 44 44 A 150 150 0 0 0 0 150 Z', tx: 20, ty: 100 },
    { idRHB: 'fine-leg', idLHB: 'third-man', labelRHB: 'Fine Leg', labelLHB: 'Third Man', path: 'M 150 150 L 150 0 A 150 150 0 0 0 44 44 Z', tx: 80, ty: 40 },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>WHERE DID IT GO?</h2>
          {isLHB && <span style={{ fontSize: 10, background: 'var(--gold)', color: '#000', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>LHB</span>}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Tap the zone where the shot was played.</p>

        <div style={{ position: 'relative', width: 300, height: 300, margin: '0 auto', borderRadius: '50%', background: '#2c7a2c', border: '2px solid white', overflow: 'hidden' }}>
          {/* Pitch */}
          <div style={{ position: 'absolute', top: '35%', left: '46%', width: '8%', height: '30%', background: '#d4b483', zIndex: 10 }}></div>

          {/* Zones */}
          <svg width="300" height="300" viewBox="0 0 300 300" style={{ position: 'absolute', top: 0, left: 0, zIndex: 20 }}>
            <g style={{ cursor: 'pointer' }}>
              {zones.map((zone, i) => {
                const id = isLHB ? zone.idLHB : zone.idRHB;
                const label = isLHB ? zone.labelLHB : zone.labelRHB;
                const isAlternate = i % 2 === 0;
                
                return (
                  <g key={i} onClick={() => onSelectRegion(id as ShotRegion)}>
                    <path d={zone.path} fill={isAlternate ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.0)"} stroke="rgba(255,255,255,0.2)" />
                    <text x={zone.tx} y={zone.ty} fill="white" fontSize="10" pointerEvents="none">
                      {label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <button className="btn-secondary" style={{ marginTop: 24, width: '100%' }} onClick={onSkip}>
          SKIP
        </button>
      </div>
    </div>
  );
}
