import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { subscribeToMatch } from '../lib/firebase';
import type { Match } from '../types/cricket';
import { getOversString, getRunRate, getRequiredRunRate, getLegalBallCount } from '../utils/scoring';
import BallDot from '../components/BallDot';
import { Loader2, WifiOff, Home } from 'lucide-react';
import '../components/Scoreboard.css';

export default function SpectatorPage() {
  const { matchId } = useParams();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    const unsubscribe = subscribeToMatch(matchId, (data) => {
      setLoading(false);
      if (data) {
        setMatch(data);
      } else {
        setError(true);
      }
    });

    return unsubscribe;
  }, [matchId]);

  if (loading) {
    return (
      <div className="view-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--gold)" />
        <h2 style={{ marginTop: 16 }}>Loading Live Score...</h2>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="view-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
        <WifiOff size={48} color="var(--text-secondary)" style={{ marginBottom: 16 }} />
        <h2>Match Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 24 }}>
          The match may have ended or live sync is disabled.
        </p>
        <Link to="/" className="btn-primary">Return Home</Link>
      </div>
    );
  }

  const ci = match.currentInnings;
  const inn = match.innings[ci];
  const team = match.teams[ci];
  const deliveries = inn.deliveries || [];
  const oversStr = getOversString(deliveries);
  const rr = getRunRate(inn.runs, getLegalBallCount(deliveries));

  let targetRuns = 0;
  let needed = 0;
  let ballsLeft = 0;
  let rrr = '0.00';

  if (ci === 1) {
    targetRuns = match.innings[0].runs + 1;
    needed = targetRuns - inn.runs;
    ballsLeft = match.settings.overs * 6 - getLegalBallCount(deliveries);
    rrr = getRequiredRunRate(targetRuns, inn.runs, ballsLeft);
  }

  const lastBalls = deliveries.slice(-6);

  return (
    <div className="view-container" style={{ paddingTop: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ color: 'var(--gold)', margin: 0, fontSize: 20 }}>🔴 LIVE</h1>
        <Link to="/" className="icon-btn"><Home size={20} /></Link>
      </div>

      <div className="scoreboard" style={{ '--team-color': match.teamColors[ci] } as any}>
        <div className="sb-header">
          <div className="sb-team">{team}</div>
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

        {ci === 1 && !match.complete && (
          <div className="sb-target">
            Need <strong>{needed}</strong> runs from <strong>{ballsLeft}</strong> balls
            <span className="sb-rrr">REQ: {rrr}</span>
          </div>
        )}

        {match.complete && (
          <div className="sb-target" style={{ color: 'var(--gold)', borderColor: 'var(--gold)' }}>
            {match.winner === 'Match tied' ? 'MATCH TIED' : `${match.winner} won ${match.margin}`}
          </div>
        )}

        <div className="sb-timeline">
          {lastBalls.length === 0 ? (
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Over timeline...</span>
          ) : (
            lastBalls.map(d => <BallDot key={d.id} delivery={d} />)
          )}
        </div>

        <div className="sb-batters">
          <div className={`sb-player ${inn.striker ? 'active' : ''}`}>
            <div className="sb-player-name">{inn.striker || 'Select Striker'} {inn.striker && '🏏'}</div>
            {inn.striker && inn.batters[inn.striker] && (
              <div className="sb-player-stats">
                {inn.batters[inn.striker].runs} ({inn.batters[inn.striker].balls})
              </div>
            )}
          </div>
          <div className={`sb-player ${inn.nonStriker ? 'active' : ''}`}>
            <div className="sb-player-name">{inn.nonStriker || 'Select Non-Striker'}</div>
            {inn.nonStriker && inn.batters[inn.nonStriker] && (
              <div className="sb-player-stats">
                {inn.batters[inn.nonStriker].runs} ({inn.batters[inn.nonStriker].balls})
              </div>
            )}
          </div>
        </div>

        <div className="sb-bowler">
          <div className="sb-player-name">🥎 {inn.currentBowler || 'Select Bowler'}</div>
          {inn.currentBowler && inn.bowlers[inn.currentBowler] && (
            <div className="sb-player-stats">
              {inn.bowlers[inn.currentBowler].wickets}-{inn.bowlers[inn.currentBowler].runsConceded} 
              ({inn.bowlers[inn.currentBowler].overs}.{inn.bowlers[inn.currentBowler].ballsBowled})
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
