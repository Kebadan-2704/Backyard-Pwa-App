import type { Match, Innings } from '../types/cricket';
import './MatchSummaryCard.css';

interface Props {
  match: Match;
  id?: string;
}

export default function MatchSummaryCard({ match, id }: Props) {
  if (!match) return null;

  function renderInnings(inn: Innings, teamName: string, innIndex: number) {
    if (!inn || inn.deliveries.length === 0 && inn.runs === 0) return null;

    // Top 4 batters
    const topBatters = Object.entries(inn.batters)
      .map(([name, b]) => ({ name, ...b }))
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 4);

    // Top 4 bowlers from the OTHER innings (the team bowling against this innings)
    // Wait, the UI shows the bowling stats for the team that bowled in THIS innings.
    const topBowlers = Object.entries(inn.bowlers)
      .map(([name, b]) => ({ name, ...b }))
      .sort((a, b) => {
        if (a.wickets !== b.wickets) return b.wickets - a.wickets;
        return a.runsConceded - b.runsConceded;
      })
      .slice(0, 4);

    // Pad with empty rows to always have 4 rows for consistent UI height if needed
    const paddedBatters = [...topBatters];
    while (paddedBatters.length < 4) paddedBatters.push({ name: '', runs: 0, balls: 0 } as any);
    
    const paddedBowlers = [...topBowlers];
    while (paddedBowlers.length < 4) paddedBowlers.push({ name: '', wickets: 0, runsConceded: 0 } as any);

    return (
      <div className="match-summary-innings" key={innIndex}>
        <div className="ms-inn-header">
          <div className="ms-inn-team">{teamName}</div>
          <div className="ms-inn-label">{innIndex === 0 ? '1st INNINGS' : '2nd INNINGS'}</div>
          <div className="ms-inn-score">{inn.runs}</div>
        </div>
        
        <div className="ms-inn-stats">
          <div className="ms-col">
            {paddedBatters.map((b, i) => (
              <div className="ms-stat-row" key={`bat-${i}`}>
                <div className="ms-stat-name">{b.name || '\u00A0'}</div>
                <div className="ms-stat-val">{b.name ? `${b.runs}${!b.howOut && b.balls > 0 ? '*' : ''}` : ''}</div>
              </div>
            ))}
          </div>
          <div className="ms-col">
            {paddedBowlers.map((b, i) => (
              <div className="ms-stat-row" key={`bowl-${i}`}>
                <div className="ms-stat-name">{b.name || '\u00A0'}</div>
                <div className="ms-stat-val">{b.name ? `${b.wickets}-${b.runsConceded}` : ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isTie = match.winner === 'Match tied';
  const isAbandoned = match.winner === 'Abandoned';

  return (
    <div className="match-summary-wrapper" id={id}>
      <div className="match-summary-header">
        <h2 className="match-summary-title">MATCH SUMMARY</h2>
        <div className="match-summary-subtitle">{match.seriesName || match.matchType.toUpperCase() || 'BACKYARD CRICKET'}</div>
      </div>
      
      {match.innings[0] && renderInnings(match.innings[0], match.teams[0], 0)}
      {match.innings[1] && renderInnings(match.innings[1], match.teams[1], 1)}

      <div className="match-summary-footer">
        {isTie || isAbandoned ? match.winner : (match.margin ? `${match.winner} WON ${match.margin.toUpperCase()}` : `${match.winner} WON`)}
      </div>
    </div>
  );
}
