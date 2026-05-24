import { useMatchStore } from '../store/matchStore';
import { useHaptic } from '../hooks/useHaptic';
import { useSound } from '../hooks/useSound';
import { RotateCcw, ArrowLeftRight, UserX, AlertCircle, Goal, Shield, Flag } from 'lucide-react';
import './ActionPad.css';

interface Props {
  onWicket: () => void;
  onEndInnings?: () => void;
  onExtra: (type: 'wide' | 'noball' | 'bye' | 'legbye' | 'penalty') => void;
  onBoundary: () => void;
  disabled?: boolean;
}

export default function ActionPad({ onWicket, onEndInnings, onExtra, onBoundary, disabled = false }: Props) {
  const addRun = useMatchStore((s) => s.addRun);
  const addExtra = useMatchStore((s) => s.addExtra);
  const undoLastBall = useMatchStore((s) => s.undoLastBall);
  const swapBatters = useMatchStore((s) => s.swapBatters);
  const retireBatter = useMatchStore((s) => s.retireBatter);
  const isFreeHit = useMatchStore((s) => s.isFreeHit);
  
  const haptic = useHaptic();
  const sound = useSound();

  function handleRun(r: number) {
    if (disabled) return;
    addRun(r);
    if (r === 4 || r === 6) {
      haptic.boundary();
      sound.playBoundary();
      sound.speakCommentary(r === 4 ? 'Four runs! Beautiful shot!' : 'Six! Out of the park!');
      onBoundary();
    } else {
      haptic.tap();
      sound.playTap();
      if (r === 0) sound.speakCommentary('Dot ball.');
      else if (r === 1) sound.speakCommentary('Just a single.');
      else sound.speakCommentary(`${r} runs.`);
    }
  }

  function handleExtra(type: 'wide' | 'noball' | 'bye' | 'legbye' | 'penalty') {
    if (disabled) return;
    haptic.tap();
    sound.playTap();
    onExtra(type);
  }

  function handleWicket() {
    if (disabled) return;
    haptic.wicket();
    sound.playWicket();
    // We let ResultModal handle specific wicket TTS if we wanted, but let's just do a generic one
    sound.speakCommentary('Oh he is out! Wicket!');
    onWicket();
  }

  function handleUndo() {
    if (undoLastBall()) {
      haptic.tap();
      sound.playTap();
    }
  }

  const runLabels: Record<number, string> = {
    0: 'Dot ball',
    1: 'Single',
    2: 'Double',
    3: 'Three runs',
    4: 'FOUR!',
    5: 'Five runs',
    6: 'SIX!',
  };

  return (
    <div className={`action-pad ${disabled ? 'disabled' : ''} ${isFreeHit ? 'free-hit-active' : ''}`}>
      {/* Top Controls */}
      <div className="ap-controls">
        <button className="ap-ctrl-btn" onClick={handleUndo} aria-label="Undo last ball" title="Undo last ball (U)">
          <RotateCcw size={16} /> Undo
        </button>
        <button className="ap-ctrl-btn" onClick={swapBatters} aria-label="Swap batters" title="Swap striker/non-striker (S)">
          <ArrowLeftRight size={16} /> Swap
        </button>
        <button className="ap-ctrl-btn" onClick={() => retireBatter('hurt')} aria-label="Retire batter hurt" title="Retire current striker">
          <UserX size={16} /> Retire
        </button>
        {onEndInnings && (
          <button className="ap-ctrl-btn end-inn" onClick={onEndInnings} aria-label="End innings" title="Declare / End innings">
            <Flag size={16} /> End Inn.
          </button>
        )}
      </div>

      {/* Main Run Buttons */}
      <div className="ap-runs">
        {[0, 1, 2, 3, 4, 5, 6].map((r) => (
          <button
            key={r}
            className={`ap-run-btn ${r === 4 ? 'four' : r === 6 ? 'six' : ''}`}
            onClick={() => handleRun(r)}
            aria-label={`${runLabels[r]} — ${r} runs`}
            title={`${runLabels[r]} (${r})`}
          >
            <span className="ap-run-num">{r}</span>
            {r === 4 && <span className="ap-run-label">FOUR</span>}
            {r === 6 && <span className="ap-run-label">SIX</span>}
          </button>
        ))}
      </div>

      {/* Extras & Wicket */}
      <div className="ap-extras">
        <button className="ap-extra-btn wide-btn" onClick={() => handleExtra('wide')} aria-label="Wide ball" title="Wide (W key)">
          <AlertCircle size={13} /> WIDE
        </button>
        <button className="ap-extra-btn noball-btn" onClick={() => handleExtra('noball')} aria-label="No ball" title="No ball (N key)">
          <Goal size={13} /> NO BALL
        </button>
        <button className="ap-extra-btn" onClick={() => handleExtra('bye')} aria-label="Bye" title="Bye">
          BYE
        </button>
        <button className="ap-extra-btn" onClick={() => handleExtra('legbye')} aria-label="Leg bye" title="Leg bye">
          LEG BYE
        </button>
        <button className="ap-extra-btn penalty-btn" onClick={() => handleExtra('penalty')} aria-label="Penalty runs — 5 runs" title="Penalty (5 runs for fielding infraction)">
          <Shield size={13} /> +5 PEN
        </button>
        <button className="ap-wicket-btn" onClick={handleWicket} aria-label="Wicket" title="Wicket">
          WICKET
        </button>
      </div>
    </div>
  );
}
