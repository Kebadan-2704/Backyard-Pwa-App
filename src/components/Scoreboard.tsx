import { useMatchStore } from '../store/matchStore';
import { getLegalBallCount, getOversString, getRunRate, getRequiredRunRate, getProjectedScore, getRunsPerOverNeeded, isPowerplayOver } from '../utils/scoring';
import { generateSituation } from '../utils/commentary';
import BallDot from './BallDot';
import './Scoreboard.css';

export default function Scoreboard() {
  const match = useMatchStore((s) => s.match);
  const isFreeHit = useMatchStore((s) => s.isFreeHit);
  const swapBatters = useMatchStore((s) => s.swapBatters);
  const lastCommentary = useMatchStore((s) => s.lastCommentary);
  const situationText = useMatchStore((s) => s.situationText);

  if (!match) return null;

  const ci = match.currentInnings;
  const inn = match.innings[ci];
  const team = match.teams[ci];
  const legalBalls = getLegalBallCount(inn.deliveries);
  const oversStr = getOversString(inn.deliveries);
  const rr = getRunRate(inn.runs, legalBalls);
  const currentOverNum = Math.floor(legalBalls / 6);
  const inPowerplay = isPowerplayOver(currentOverNum, match.settings.powerplayOvers);

  // 2nd innings targets
  let targetRuns = 0;
  let needed = 0;
  let ballsLeft = 0;
  let rrr = '0.00';
  let projectedScore = 0;
  let runsPerOver = '0';

  if (ci === 1) {
    targetRuns = match.innings[0].runs + 1;
    needed = targetRuns - inn.runs;
    ballsLeft = match.settings.overs * 6 - legalBalls;
    rrr = getRequiredRunRate(targetRuns, inn.runs, ballsLeft);
  } else {
    projectedScore = getProjectedScore(inn.runs, legalBalls, match.settings.overs);
  }

  // Get current over deliveries for timeline
  const lastBalls = inn.deliveries.slice(-12);
  const currentOverBalls = lastBalls.filter((_, i) => i >= Math.max(0, lastBalls.length - 8));

  // RRR danger zone
  const rrrNum = parseFloat(rrr);
  const rrrDanger = rrrNum > 12 ? 'danger' : rrrNum > 9 ? 'warning' : '';

  return (
    <div className={`scoreboard ${inPowerplay ? 'powerplay' : ''}`} style={{ '--team-color': match.teamColors[ci] } as any}>
      <div className="sb-header">
        <div className="sb-team">
          {team}
          {inPowerplay && <span className="sb-powerplay-badge">⚡ PP</span>}
          {match.isSuperOver && <span className="sb-superover-badge">SUPER OVER</span>}
        </div>
        <div className="sb-rr">CRR: {rr}</div>
      </div>

      <div className="sb-main">
        <div className="sb-score">
          {inn.runs}<span>/{inn.wickets}</span>
        </div>
        <div className="sb-overs">
          {oversStr} <span>/ {match.settings.overs}.0</span>
        </div>
      </div>

      {ci === 0 && legalBalls > 0 && (
        <div className="sb-projected">
          Projected: ~{projectedScore}
        </div>
      )}

      {isFreeHit && (
        <div className="sb-free-hit" role="alert">
          <span className="free-hit-pulse">🚨</span> FREE HIT <span className="free-hit-pulse">🚨</span>
        </div>
      )}

      {ci === 1 && !match.complete && (
        <div className={`sb-target ${rrrDanger}`}>
          <div className="sb-target-main">
            Need <strong>{Math.max(0, needed)}</strong> from <strong>{ballsLeft}</strong> ball{ballsLeft !== 1 ? 's' : ''}
          </div>
          <div className="sb-target-meta">
            <span className={`sb-rrr ${rrrDanger}`}>REQ: {rrr}</span>
            {ballsLeft > 6 && (
              <span className="sb-rpo">~{getRunsPerOverNeeded(needed, ballsLeft)}/ov</span>
            )}
          </div>
        </div>
      )}

      {match.complete && (
        <div className="sb-target result" role="alert">
          🏆 {match.winner === 'Match tied' ? 'MATCH TIED' : `${match.winner} won ${match.margin}`}
        </div>
      )}

      {/* Ball timeline */}
      <div className="sb-timeline" role="list" aria-label="Recent deliveries">
        {currentOverBalls.length === 0 ? (
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Over timeline...</span>
        ) : (
          currentOverBalls.map(d => <BallDot key={d.id} delivery={d} animate />)
        )}
      </div>

      {/* Extras breakdown */}
      {(inn.extras.wide > 0 || inn.extras.noball > 0 || inn.extras.byes > 0 || inn.extras.legByes > 0) && (
        <div className="sb-extras">
          <span>Extras: </span>
          {inn.extras.wide > 0 && <span className="extra-tag wd">Wd:{inn.extras.wide}</span>}
          {inn.extras.noball > 0 && <span className="extra-tag nb">Nb:{inn.extras.noball}</span>}
          {inn.extras.byes > 0 && <span className="extra-tag">B:{inn.extras.byes}</span>}
          {inn.extras.legByes > 0 && <span className="extra-tag">Lb:{inn.extras.legByes}</span>}
        </div>
      )}

      {/* Batters */}
      <div className="sb-batters" style={{ position: 'relative' }}>
        <button 
          className="sb-swap-btn" 
          onClick={swapBatters} 
          title="Swap Strike"
          aria-label="Swap Strike"
        >
          ⇄
        </button>
        <div className={`sb-player ${inn.striker ? 'active' : ''}`}>
          <div className="sb-player-name">{inn.striker || 'Select Striker'} {inn.striker && '🏏'}</div>
          {inn.striker && inn.batters[inn.striker] && (
            <div className="sb-player-stats">
              <span className="sb-runs">{inn.batters[inn.striker].runs}</span>
              <span className="sb-balls">({inn.batters[inn.striker].balls})</span>
              {inn.batters[inn.striker].fours > 0 && <span className="sb-detail">{inn.batters[inn.striker].fours}×4</span>}
              {inn.batters[inn.striker].sixes > 0 && <span className="sb-detail six">{inn.batters[inn.striker].sixes}×6</span>}
            </div>
          )}
        </div>
        <div className={`sb-player ${inn.nonStriker ? 'active' : ''}`}>
          <div className="sb-player-name">{inn.nonStriker || 'Select Non-Striker'}</div>
          {inn.nonStriker && inn.batters[inn.nonStriker] && (
            <div className="sb-player-stats">
              <span className="sb-runs">{inn.batters[inn.nonStriker].runs}</span>
              <span className="sb-balls">({inn.batters[inn.nonStriker].balls})</span>
              {inn.batters[inn.nonStriker].fours > 0 && <span className="sb-detail">{inn.batters[inn.nonStriker].fours}×4</span>}
              {inn.batters[inn.nonStriker].sixes > 0 && <span className="sb-detail six">{inn.batters[inn.nonStriker].sixes}×6</span>}
            </div>
          )}
        </div>
      </div>

      {/* Bowler */}
      <div className="sb-bowler">
        <div className="sb-player-name">🥎 {inn.currentBowler || 'Select Bowler'}</div>
        {inn.currentBowler && inn.bowlers[inn.currentBowler] && (() => {
          const bw = inn.bowlers[inn.currentBowler];
          const econ = (bw.overs > 0 || bw.ballsBowled > 0) ? ((bw.runsConceded / ((bw.overs * 6 + bw.ballsBowled) || 1)) * 6).toFixed(1) : '0.0';
          return (
            <div className="sb-player-stats">
              <span className="sb-wickets">{bw.wickets}-{bw.runsConceded}</span>
              <span className="sb-balls">({bw.overs}.{bw.ballsBowled})</span>
              <span className="sb-detail">Econ: {econ}</span>
            </div>
          );
        })()}
      </div>

      {/* Situation text */}
      {situationText && !match.complete && (
        <div className="sb-situation" role="status">
          {situationText}
        </div>
      )}

      {/* Last commentary */}
      {lastCommentary && (
        <div className="sb-commentary" role="log">
          💬 {lastCommentary}
        </div>
      )}

      {/* Partnership */}
      {inn.partnerships.length > 0 && (() => {
        const p = inn.partnerships[inn.partnerships.length - 1];
        if (p.endedBy) return null;
        return (
          <div className="sb-partnership">
            Partnership: <strong>{p.runs}</strong>({p.balls})
            <span className="sb-detail">{p.batter1} & {p.batter2}</span>
          </div>
        );
      })()}
    </div>
  );
}
