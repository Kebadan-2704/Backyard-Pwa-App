import { useState } from 'react';
import { useMatchStore } from '../../store/matchStore';
import { calculateEconomy, getOversString, getTotalExtras, getExtrasBreakdown, getDotBallPercentage, getBestBatter, getBestBowler } from '../../utils/scoring';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';
import { X, Trophy, Activity, TrendingUp, Target } from 'lucide-react';
import './ScorecardModal.css';
import './Modals.css';

interface Props {
  onClose: () => void;
  initialInnings?: number;
  matchData?: any; // For viewing from history
}

export default function ScorecardModal({ onClose, initialInnings, matchData }: Props) {
  const storeMatch = useMatchStore((s) => s.match);
  const match = matchData || storeMatch;
  const [activeInnings, setActiveInnings] = useState(initialInnings ?? (match?.currentInnings ?? 0));
  const [activeTab, setActiveTab] = useState<'batting' | 'bowling' | 'fow' | 'charts' | 'highlights'>('batting');

  if (!match) return null;

  const inn = match.innings[activeInnings];
  const team = match.teams[activeInnings];
  const bowlingTeam = match.teams[activeInnings === 0 ? 1 : 0];
  const hasSecondInnings = match.currentInnings === 1 || match.innings[1].deliveries.length > 0;

  // Manhattan chart data
  const overData = inn.overSummaries.map((s: any) => ({
    name: `${s.overNumber}`,
    runs: s.runs,
    wickets: s.wickets,
  }));

  // Worm chart data (cumulative runs per over for both innings)
  const wormData: any[] = [];
  if (hasSecondInnings) {
    const maxOvers = Math.max(match.innings[0].overSummaries.length, match.innings[1].overSummaries.length);
    let cum0 = 0, cum1 = 0;
    for (let i = 0; i < maxOvers; i++) {
      const s0 = match.innings[0].overSummaries[i];
      const s1 = match.innings[1].overSummaries[i];
      if (s0) cum0 += s0.runs;
      if (s1) cum1 += s1.runs;
      wormData.push({
        over: i + 1,
        [match.teams[0]]: s0 ? cum0 : null,
        [match.teams[1]]: s1 ? cum1 : null,
      });
    }
  }

  // Best performers
  const bestBat = getBestBatter(inn);
  const bestBowl = getBestBowler(match.innings[activeInnings === 0 ? 1 : 0]);

  return (
    <div className="modal-overlay" style={{ padding: 10 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content scorecard-modal">
        <div className="sc-header">
          <h2>{team} INNINGS</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close scorecard">
            <X size={18} />
          </button>
        </div>

        {/* Innings tabs */}
        {hasSecondInnings && (
          <div className="sc-innings-tabs">
            {[0, 1].map(idx => (
              <button
                key={idx}
                className={`sc-inn-tab ${activeInnings === idx ? 'active' : ''}`}
                onClick={() => setActiveInnings(idx)}
              >
                {match.teams[idx]}
              </button>
            ))}
          </div>
        )}

        <div className="sc-total">
          {inn.runs}<span>/{inn.wickets}</span>
          <div className="sc-overs">({getOversString(inn.deliveries)} ov)</div>
        </div>

        {/* Section tabs */}
        <div className="sc-tabs">
          <button className={`sc-tab ${activeTab === 'batting' ? 'active' : ''}`} onClick={() => setActiveTab('batting')}>
            Batting
          </button>
          <button className={`sc-tab ${activeTab === 'bowling' ? 'active' : ''}`} onClick={() => setActiveTab('bowling')}>
            Bowling
          </button>
          <button className={`sc-tab ${activeTab === 'fow' ? 'active' : ''}`} onClick={() => setActiveTab('fow')}>
            FoW
          </button>
          <button className={`sc-tab ${activeTab === 'charts' ? 'active' : ''}`} onClick={() => setActiveTab('charts')}>
            Charts
          </button>
          <button className={`sc-tab ${activeTab === 'highlights' ? 'active' : ''}`} onClick={() => setActiveTab('highlights')}>
            Highlights
          </button>
        </div>

        {/* ═══ BATTING TAB ═══ */}
        {activeTab === 'batting' && (
          <>
            <div className="sc-table-container">
              <table className="sc-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Batter</th>
                    <th>R</th>
                    <th>B</th>
                    <th>4s</th>
                    <th>6s</th>
                    <th>SR</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(inn.batters)
                    .sort(([, a]: any, [, b]: any) => a.battingPosition - b.battingPosition)
                    .map(([name, b]: any) => {
                      const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
                      const isBatting = name === inn.striker || name === inn.nonStriker;
                      const isHighest = bestBat && name === bestBat.name;
                      return (
                        <tr key={name} className={`${isBatting ? 'active-row' : ''} ${isHighest ? 'highlight-row' : ''}`}>
                          <td style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 600, color: 'var(--chalk)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              {name} {isBatting && '🏏'}
                              {isHighest && <span style={{ fontSize: 9, color: 'var(--gold)' }}>⭐</span>}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {b.howOut ? (
                                <>
                                  {b.howOut}
                                  {b.bowlerName && ` b. ${b.bowlerName}`}
                                  {b.fielderName && ` c. ${b.fielderName}`}
                                </>
                              ) : (
                                b.isRetired ? `${b.retireType === 'hurt' ? 'retired hurt' : 'retired out'}` : 'not out'
                              )}
                            </div>
                          </td>
                          <td style={{ fontWeight: 700 }}>{b.runs}</td>
                          <td>{b.balls}</td>
                          <td>{b.fours}</td>
                          <td>{b.sixes}</td>
                          <td style={{ color: parseFloat(sr) >= 150 ? 'var(--green)' : parseFloat(sr) < 80 ? 'var(--leather-light)' : 'var(--text-secondary)' }}>
                            {sr}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="sc-extras">
              Extras: <strong>{getTotalExtras(inn)}</strong>{' '}
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({getExtrasBreakdown(inn)})</span>
            </div>
          </>
        )}

        {/* ═══ BOWLING TAB ═══ */}
        {activeTab === 'bowling' && (
          <div className="sc-table-container">
            <table className="sc-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Bowler</th>
                  <th>O</th>
                  <th>M</th>
                  <th>R</th>
                  <th>W</th>
                  <th>ECON</th>
                  <th>•%</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(inn.bowlers).map(([name, bw]: any) => {
                  const isBowling = name === inn.currentBowler;
                  const econ = calculateEconomy(bw);
                  const dotPct = getDotBallPercentage(bw);
                  return (
                    <tr key={name} className={isBowling ? 'active-row' : ''}>
                      <td style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, color: 'var(--chalk)' }}>
                          {name} {isBowling && '🥎'}
                        </div>
                        {bw.spells.length > 0 && (
                          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                            {bw.spells.map((s: any, i: number) => `Ov ${s.overStart}-${s.overEnd}`).join(', ')}
                          </div>
                        )}
                      </td>
                      <td>{bw.overs}.{bw.ballsBowled}</td>
                      <td>{bw.maidens}</td>
                      <td>{bw.runsConceded}</td>
                      <td style={{ fontWeight: 700, color: bw.wickets >= 5 ? 'var(--gold)' : bw.wickets >= 3 ? 'var(--green)' : 'var(--leather-light)' }}>
                        {bw.wickets}
                      </td>
                      <td style={{ color: econ <= 6 ? 'var(--green)' : econ <= 9 ? 'var(--gold)' : 'var(--leather-light)' }}>
                        {econ.toFixed(1)}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        {dotPct.toFixed(0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ═══ FALL OF WICKETS TAB ═══ */}
        {activeTab === 'fow' && (
          <>
            {/* Fall of Wickets */}
            {inn.fallOfWickets.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="sc-section-title"><Target size={14} style={{ marginRight: 6, display: 'inline' }} /> Fall of Wickets</div>
                <div className="sc-fow-list">
                  {inn.fallOfWickets.map((f: any, i: number) => (
                    <div key={i} className="sc-fow-item">
                      <span className="sc-fow-num">{f.wicketNumber}</span>
                      <div className="sc-fow-detail">
                        <span className="sc-fow-score">{f.score}/{f.wicketNumber}</span>
                        <span className="sc-fow-over">({f.over} ov)</span>
                      </div>
                      <div className="sc-fow-player">
                        {f.batterName} — {f.dismissalType}
                        {f.bowlerName && <span> b. {f.bowlerName}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Partnerships */}
            {inn.partnerships.length > 0 && (
              <div>
                <div className="sc-section-title">🤝 Partnerships</div>
                <div className="sc-partnerships">
                  {inn.partnerships.map((p: any, i: number) => {
                    const maxRuns = Math.max(...inn.partnerships.map((pp: any) => pp.runs));
                    const barWidth = maxRuns > 0 ? (p.runs / maxRuns) * 100 : 0;
                    return (
                      <div key={i} className="sc-partnership-item">
                        <div className="sc-part-header">
                          <span className="sc-part-wicket">Wkt {i + 1}</span>
                          <span className="sc-part-runs">{p.runs}({p.balls})</span>
                        </div>
                        <div className="sc-part-bar-bg">
                          <div className="sc-part-bar" style={{ width: `${barWidth}%` }} />
                        </div>
                        <div className="sc-part-names">
                          {p.batter1} & {p.batter2}
                          <span className="sc-part-overs">{p.overStart}-{p.overEnd || 'now'}</span>
                        </div>
                        {p.endedBy && (
                          <div className="sc-part-ended">Ended: {p.endedBy}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {inn.fallOfWickets.length === 0 && inn.partnerships.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 30 }}>
                No wickets have fallen yet
              </div>
            )}
          </>
        )}

        {/* ═══ CHARTS TAB ═══ */}
        {activeTab === 'charts' && (
          <>
            {/* Manhattan */}
            <div className="sc-section-title" style={{ marginTop: 8 }}>
              <Activity size={14} style={{ marginRight: 6, display: 'inline' }} /> Manhattan (Runs per Over)
            </div>
            <div className="sc-chart-container">
              {overData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={overData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-modal)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: 12 }}
                      itemStyle={{ color: 'var(--gold)' }}
                    />
                    <Bar dataKey="runs" radius={[4, 4, 0, 0]}>
                      {overData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.wickets > 0 ? 'var(--leather)' : 'var(--gold)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>
                  No completed overs yet
                </div>
              )}
            </div>

            {/* Worm Chart */}
            {wormData.length > 0 && (
              <>
                <div className="sc-section-title" style={{ marginTop: 20 }}>
                  <TrendingUp size={14} style={{ marginRight: 6, display: 'inline' }} /> Worm (Cumulative Runs)
                </div>
                <div className="sc-chart-container">
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={wormData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="over" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--bg-modal)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey={match.teams[0]} stroke={match.teamColors[0]} strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey={match.teams[1]} stroke={match.teamColors[1]} strokeWidth={2} dot={false} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* Over by over analysis */}
            {inn.overSummaries.length > 0 && (
              <>
                <div className="sc-section-title" style={{ marginTop: 20 }}>📋 Over-by-Over</div>
                <div className="sc-over-list">
                  {inn.overSummaries.map((s: any, i: number) => (
                    <div key={i} className="sc-over-item">
                      <span className="sc-over-num">Ov {s.overNumber}</span>
                      <span className="sc-over-bowler">{s.bowler}</span>
                      <span className="sc-over-runs">{s.runs}r {s.wickets > 0 && `${s.wickets}w`}</span>
                      <span className="sc-over-balls">
                        {s.deliveries.join(' ')}
                      </span>
                      {s.isMaiden && <span className="sc-maiden-badge">M</span>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ═══ HIGHLIGHTS TAB ═══ */}
        {activeTab === 'highlights' && (
          <div className="sc-highlights" style={{ padding: '16px 0' }}>
            {match.highlights.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {match.highlights.map((h: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 12, minWidth: 40 }}>
                      {h.over}
                    </div>
                    <div>
                      <div style={{ 
                        fontWeight: 600, 
                        fontSize: 14, 
                        color: h.type === 'wicket' ? 'var(--leather)' : h.type === 'six' ? 'var(--gold)' : h.type === 'four' ? 'var(--green)' : 'var(--magenta)' 
                      }}>
                        {h.description}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 30 }}>
                No key moments recorded yet
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
