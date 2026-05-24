import { useMatchStore } from '../../store/matchStore';
import BallDot from '../BallDot';
import './Modals.css';

interface Props {
  onClose: () => void;
}

export default function OverSummaryModal({ onClose }: Props) {
  const summary = useMatchStore((s) => s.lastOverSummary);
  const match = useMatchStore((s) => s.match);
  
  if (!summary || !match) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, marginBottom: 8, color: 'var(--text-secondary)' }}>
          END OF OVER {summary.overNumber}
        </h2>
        
        <div style={{ fontSize: 32, fontFamily: 'var(--font-display)', color: 'var(--chalk)', margin: '16px 0', lineHeight: 1.2 }}>
          <div style={{ color: 'var(--gold)' }}>
            {summary.runs} runs in {summary.deliveries.length} balls
          </div>
          {summary.wickets > 0 && (
            <div style={{ fontSize: 20, color: 'var(--leather-light)', marginTop: 8 }}>
              {summary.wickets} wicket{summary.wickets !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 24, padding: '10px', background: 'var(--panel)', borderRadius: 8 }}>
          Bowler: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{summary.bowler}</span>
          {summary.extras > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Included {summary.extras} extra{summary.extras !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div style={{ 
          display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap',
          background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 12
        }}>
          {summary.deliveries.map((d, i) => {
            // Reconstruct a fake delivery just for the BallDot display
            const isWicket = d === 'W';
            const isWide = d.includes('wd');
            const isNoball = d.includes('nb');
            const isBye = d.includes('b') && !isNoball;
            const isLegBye = d.includes('lb');
            const runsStr = d.replace(/[^\d]/g, '');
            const runs = runsStr ? parseInt(runsStr) : 0;
            
            const fakeDelivery: any = {
              runs: runs,
              wicket: isWicket,
              wide: isWide,
              noball: isNoball,
              isBye,
              isLegBye
            };

            return (
              <div key={i} style={{ animationDelay: `${i * 0.1}s` }} className="animate-pop">
                <BallDot delivery={fakeDelivery} showShape={false} />
              </div>
            );
          })}
        </div>

        {summary.isMaiden && (
          <div style={{ 
            color: 'var(--green)', fontWeight: 700, marginBottom: 20, letterSpacing: 2,
            background: 'rgba(39, 174, 96, 0.15)', padding: '8px', borderRadius: 8,
            border: '1px dashed var(--green)'
          }}>
            ✨ MAIDEN OVER ✨
          </div>
        )}

        {match && (
          <div style={{ marginBottom: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
            Current Run Rate: <span style={{ color: 'var(--chalk)', fontWeight: 600 }}>
              {(() => {
                const inn = match.innings[match.currentInnings];
                const legalBalls = inn.deliveries.filter((d: any) => !d.wide && !d.noball).length;
                if (legalBalls === 0) return '0.00';
                return ((inn.runs / legalBalls) * 6).toFixed(2);
              })()}
            </span>
          </div>
        )}

        <button className="btn-primary" onClick={onClose} style={{ padding: 14, fontSize: 18, width: '100%' }}>
          TAP TO CONTINUE
        </button>
      </div>
    </div>
  );
}
