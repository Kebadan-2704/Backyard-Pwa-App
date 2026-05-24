import { useEffect } from 'react';
import { useMatchStore } from '../store/matchStore';
import { getLegalBallCount, getOversString, getRunRate, getRequiredRunRate } from '../utils/scoring';
import './BroadcastPage.css';

export default function BroadcastPage() {
  const match = useMatchStore((s) => s.match);

  // Auto-hide mouse cursor after 3 seconds for clean broadcasting
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleMouseMove = () => {
      document.body.style.cursor = 'default';
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        document.body.style.cursor = 'none';
      }, 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.style.cursor = 'default';
      clearTimeout(timeout);
    };
  }, []);

  if (!match) {
    return (
      <div className="broadcast-screen">
        <div className="tv-bug offline">NO ACTIVE MATCH</div>
      </div>
    );
  }

  const ci = match.currentInnings;
  const inn = match.innings[ci];
  const team = match.teams[ci];
  const legalBalls = getLegalBallCount(inn.deliveries);
  const oversStr = getOversString(inn.deliveries);
  const rr = getRunRate(inn.runs, legalBalls);

  let targetStr = '';
  if (ci === 1) {
    const target = match.innings[0].runs + 1;
    const ballsLeft = match.settings.overs * 6 - legalBalls;
    const needed = target - inn.runs;
    const rrr = getRequiredRunRate(target, inn.runs, ballsLeft);
    targetStr = `TARGET: ${target} | NEED ${needed} off ${ballsLeft} | RRR: ${rrr}`;
  } else {
    targetStr = `TOSS: ${match.tossWinner} chose to ${match.tossChoice}`;
  }

  return (
    <div className="broadcast-screen">
      {/* Lower Third TV Scorebug */}
      <div className="tv-bug">
        <div className="tv-bug-top">
          <div className="tv-team" style={{ backgroundColor: match.teamColors[ci] }}>
            {team.substring(0, 3).toUpperCase()}
          </div>
          <div className="tv-score">
            {inn.runs} <span className="tv-wickets">-{inn.wickets}</span>
          </div>
          <div className="tv-overs">
            {oversStr}
          </div>
          <div className="tv-rr">
            CRR: {rr}
          </div>
        </div>

        <div className="tv-bug-bottom">
          <div className="tv-batter">
            <span className="tv-label">BAT</span> 
            {inn.striker || 'Batter'}* 
            <span className="tv-batter-score"> {inn.batters[inn.striker]?.runs || 0}({inn.batters[inn.striker]?.balls || 0})</span>
          </div>
          
          <div className="tv-bowler">
            <span className="tv-label">BOWL</span> 
            {inn.currentBowler || 'Bowler'} 
            <span className="tv-bowler-score"> {inn.bowlers[inn.currentBowler]?.wickets || 0}-{inn.bowlers[inn.currentBowler]?.runsConceded || 0}</span>
          </div>
        </div>

        <div className="tv-bug-footer">
          {targetStr}
        </div>
      </div>
    </div>
  );
}
