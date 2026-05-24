import type { ShotRegion } from '../../types/cricket';
import './Modals.css';

interface Props {
  onSelectRegion: (region: ShotRegion) => void;
  onSkip: () => void;
}

export default function WagonWheelModal({ onSelectRegion, onSkip }: Props) {
  // We'll create an SVG that maps to the 8 zones
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 400, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 8 }}>WHERE DID IT GO?</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Tap the zone where the boundary was hit.</p>

        <div style={{ position: 'relative', width: 300, height: 300, margin: '0 auto', borderRadius: '50%', background: '#2c7a2c', border: '2px solid white', overflow: 'hidden' }}>
          {/* Pitch */}
          <div style={{ position: 'absolute', top: '35%', left: '46%', width: '8%', height: '30%', background: '#d4b483', zIndex: 10 }}></div>

          {/* Zones using SVG clip-paths or simple absolutely positioned wedges */}
          <svg width="300" height="300" viewBox="0 0 300 300" style={{ position: 'absolute', top: 0, left: 0, zIndex: 20 }}>
            {/* We divide the circle into 8 wedges of 45 degrees.
                Center is 150, 150.
                Let's make clickable wedges. */}
            <g style={{ cursor: 'pointer' }}>
              {/* Third Man (Top Right, Behind wicket) */}
              <path d="M 150 150 L 256 44 A 150 150 0 0 0 150 0 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" onClick={() => onSelectRegion('third-man')} />
              <text x="180" y="50" fill="white" fontSize="10" pointerEvents="none" transform="rotate(22.5 150 150)">Third Man</text>

              {/* Point (Right) */}
              <path d="M 150 150 L 300 150 A 150 150 0 0 0 256 44 Z" fill="rgba(255,255,255,0.0)" stroke="rgba(255,255,255,0.2)" onClick={() => onSelectRegion('point')} />
              <text x="260" y="100" fill="white" fontSize="10" pointerEvents="none">Point</text>

              {/* Cover (Bottom Right) */}
              <path d="M 150 150 L 256 256 A 150 150 0 0 0 300 150 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" onClick={() => onSelectRegion('cover')} />
              <text x="240" y="220" fill="white" fontSize="10" pointerEvents="none">Cover</text>

              {/* Long Off (Bottom, right of center) */}
              <path d="M 150 150 L 150 300 A 150 150 0 0 0 256 256 Z" fill="rgba(255,255,255,0.0)" stroke="rgba(255,255,255,0.2)" onClick={() => onSelectRegion('long-off')} />
              <text x="180" y="280" fill="white" fontSize="10" pointerEvents="none">Long Off</text>

              {/* Long On (Bottom, left of center) */}
              <path d="M 150 150 L 44 256 A 150 150 0 0 0 150 300 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" onClick={() => onSelectRegion('long-on')} />
              <text x="80" y="280" fill="white" fontSize="10" pointerEvents="none">Long On</text>

              {/* Deep Midwicket (Bottom Left) */}
              <path d="M 150 150 L 0 150 A 150 150 0 0 0 44 256 Z" fill="rgba(255,255,255,0.0)" stroke="rgba(255,255,255,0.2)" onClick={() => onSelectRegion('deep-midwicket')} />
              <text x="20" y="220" fill="white" fontSize="10" pointerEvents="none">Midwicket</text>

              {/* Deep Square Leg (Top Left) */}
              <path d="M 150 150 L 44 44 A 150 150 0 0 0 0 150 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" onClick={() => onSelectRegion('deep-square-leg')} />
              <text x="20" y="100" fill="white" fontSize="10" pointerEvents="none">Square Leg</text>

              {/* Fine Leg (Top, left of center) */}
              <path d="M 150 150 L 150 0 A 150 150 0 0 0 44 44 Z" fill="rgba(255,255,255,0.0)" stroke="rgba(255,255,255,0.2)" onClick={() => onSelectRegion('fine-leg')} />
              <text x="80" y="40" fill="white" fontSize="10" pointerEvents="none">Fine Leg</text>
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
