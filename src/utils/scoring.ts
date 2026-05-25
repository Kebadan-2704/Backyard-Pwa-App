// ═══════════════════════════════════════════════════════
//  PURE SCORING UTILITY FUNCTIONS — v3.0
// ═══════════════════════════════════════════════════════

import type { Delivery, Innings, OverSummary, BowlerStats, Match } from '../types/cricket';

/** Count legal (non-wide, non-noball) deliveries */
export function getLegalBallCount(deliveries: Delivery[]): number {
  if (!deliveries) return 0;
  return deliveries.filter(d => !d.wide && !d.noball).length;
}

/** Format overs as "4.3" string */
export function getOversString(deliveries: Delivery[]): string {
  if (!deliveries) return '0.0';
  const legal = getLegalBallCount(deliveries);
  return `${Math.floor(legal / 6)}.${legal % 6}`;
}

/** Calculate current run rate */
export function getRunRate(runs: number, legalBalls: number): string {
  if (legalBalls === 0) return '0.00';
  return ((runs / legalBalls) * 6).toFixed(2);
}

/** Calculate required run rate */
export function getRequiredRunRate(target: number, runsScored: number, ballsLeft: number): string {
  const needed = target - runsScored;
  if (needed <= 0 || ballsLeft <= 0) return '0.00';
  return ((needed / ballsLeft) * 6).toFixed(2);
}

/** Calculate projected score at this run rate */
export function getProjectedScore(runs: number, legalBalls: number, totalOvers: number): number {
  if (legalBalls === 0) return 0;
  const rr = (runs / legalBalls) * 6;
  return Math.round(rr * totalOvers);
}

/** Get runs needed per over breakdown */
export function getRunsPerOverNeeded(needed: number, ballsLeft: number): string {
  if (ballsLeft <= 0 || needed <= 0) return '0';
  const oversLeft = ballsLeft / 6;
  return (needed / oversLeft).toFixed(1);
}

/** Check if we're in a powerplay over */
export function isPowerplayOver(overNumber: number, powerplayOvers: number): boolean {
  return powerplayOvers > 0 && overNumber < powerplayOvers;
}

/** Check if an over is a maiden (0 runs off the bat, no wides/noballs counting) */
export function isMaidenOver(overDeliveries: Delivery[]): boolean {
  const legalBalls = overDeliveries.filter(d => !d.wide && !d.noball);
  if (legalBalls.length < 6) return false;
  return legalBalls.every(d => d.runs === 0 && !d.isBye && !d.isLegBye);
}

/** Get deliveries belonging to a specific over */
export function getOverDeliveries(allDeliveries: Delivery[], overNumber: number): Delivery[] {
  let legalCount = 0;
  const result: Delivery[] = [];
  let currentOver = 0;

  for (const d of allDeliveries) {
    if (currentOver === overNumber) {
      result.push(d);
    }
    if (!d.wide && !d.noball) {
      legalCount++;
      if (legalCount % 6 === 0) {
        currentOver++;
        if (currentOver > overNumber) break;
      }
    }
  }
  return result;
}

/** Get deliveries in the current (last incomplete or just-completed) over */
export function getCurrentOverDeliveries(allDeliveries: Delivery[]): Delivery[] {
  const legalBalls = getLegalBallCount(allDeliveries);
  // If the over just completed (legal balls divisible by 6), get the LAST complete over
  const completedOvers = Math.floor(legalBalls / 6);
  const isJustCompleted = legalBalls > 0 && legalBalls % 6 === 0;
  const targetOver = isJustCompleted ? completedOvers - 1 : completedOvers;
  const overStartLegal = targetOver * 6;

  const result: Delivery[] = [];
  let legalCount = 0;

  for (const d of allDeliveries) {
    const isLegal = !d.wide && !d.noball;
    if (legalCount >= overStartLegal && (isJustCompleted ? legalCount < overStartLegal + 6 || !isLegal : true)) {
      result.push(d);
    }
    if (isLegal) {
      legalCount++;
      if (isJustCompleted && legalCount >= overStartLegal + 6) {
        // Include any extras after the 6th legal ball of this over
        // (they belong to this over)
        break;
      }
    }
  }
  return result;
}

/** Check if the next ball is a free hit (last delivery was a noball) */
export function isNextFreeHit(deliveries: Delivery[], freeHitEnabled: boolean): boolean {
  if (!freeHitEnabled || deliveries.length === 0) return false;
  const last = deliveries[deliveries.length - 1];
  return last.noball;
}

/** Build over summary from deliveries */
export function buildOverSummary(
  overDeliveries: Delivery[],
  overNumber: number,
  bowler: string
): OverSummary {
  let runs = 0;
  let wickets = 0;
  let extras = 0;
  const labels: string[] = [];

  for (const d of overDeliveries) {
    runs += d.runs + d.boundaryOverthrow;
    if (d.wicket) wickets++;
    if (d.wide || d.noball) extras += d.runs;

    if (d.wicket) labels.push('W');
    else if (d.wide) labels.push(`${d.runs}wd`);
    else if (d.noball) labels.push(`${d.runs}nb`);
    else if (d.isBye) labels.push(`${d.runs}b`);
    else if (d.isLegBye) labels.push(`${d.runs}lb`);
    else if (d.runs === 0) labels.push('•');
    else labels.push(String(d.runs));
  }

  const maiden = isMaidenOver(overDeliveries);

  return {
    overNumber,
    bowler,
    runs,
    wickets,
    deliveries: labels,
    isMaiden: maiden,
    extras,
  };
}

/** Calculate bowler economy rate */
export function calculateEconomy(bowler: BowlerStats): number {
  const totalBalls = bowler.overs * 6 + bowler.ballsBowled;
  if (totalBalls === 0) return 0;
  return (bowler.runsConceded / totalBalls) * 6;
}

/** Get bowler dot ball percentage */
export function getDotBallPercentage(bowler: BowlerStats): number {
  const totalBalls = bowler.overs * 6 + bowler.ballsBowled;
  if (totalBalls === 0) return 0;
  return (bowler.dotBalls / totalBalls) * 100;
}

/** Check if bowler can bowl (not exceeded max overs, not consecutive) */
export function canBowlerBowl(
  bowlerName: string,
  bowlers: Record<string, BowlerStats>,
  maxOversPerBowler: number,
  lastOverBowler: string
): { allowed: boolean; warning?: string; reason?: string } {
  const bowler = bowlers[bowlerName];
  // maxOversPerBowler === 0 means unlimited
  if (bowler && maxOversPerBowler > 0) {
    const totalOvers = bowler.overs;
    if (totalOvers >= maxOversPerBowler) {
      return { allowed: false, reason: `${bowlerName} has completed max overs (${maxOversPerBowler})` };
    }
  }
  if (bowlerName === lastOverBowler) {
    return { allowed: true, warning: `${bowlerName} bowled the previous over` };
  }
  return { allowed: true };
}

/** Get total extras from an innings */
export function getTotalExtras(innings: Innings): number {
  const e = innings.extras;
  return e.wide + e.noball + e.byes + e.legByes + e.penalty;
}

/** Get extras breakdown string */
export function getExtrasBreakdown(innings: Innings): string {
  const e = innings.extras;
  const parts: string[] = [];
  if (e.wide) parts.push(`Wd:${e.wide}`);
  if (e.noball) parts.push(`Nb:${e.noball}`);
  if (e.byes) parts.push(`B:${e.byes}`);
  if (e.legByes) parts.push(`Lb:${e.legByes}`);
  if (e.penalty) parts.push(`Pen:${e.penalty}`);
  return parts.join(' ');
}

/** Get the delivery label for display in ball dots */
export function getDeliveryLabel(d: Delivery): string {
  if (d.wicket) return 'W';
  if (d.wide) return d.runs > 1 ? `${d.runs}wd` : 'wd';
  if (d.noball) return d.runs > 1 ? `${d.runs}nb` : 'nb';
  if (d.isBye) return d.runs > 0 ? `${d.runs}b` : '0b';
  if (d.isLegBye) return d.runs > 0 ? `${d.runs}lb` : '0lb';
  if (d.runs === 0) return '•';
  return String(d.runs);
}

/** Get the CSS class for a delivery dot */
export function getDeliveryClass(d: Delivery): string {
  if (d.wicket) return 'wicket';
  if (d.wide) return 'wide';
  if (d.noball) return 'noball';
  if (d.runs === 4 && !d.isBye && !d.isLegBye) return 'run4';
  if (d.runs === 6 && !d.isBye && !d.isLegBye) return 'run6';
  if (d.isBye || d.isLegBye) return 'bye';
  if (d.runs === 0) return 'run0';
  return 'run1';
}

/** Get shape identifier for colorblind-accessible ball dots */
export function getDeliveryShape(d: Delivery): string {
  if (d.wicket) return '✕';
  if (d.wide) return '◇';
  if (d.noball) return '△';
  if (d.runs === 4) return '□';
  if (d.runs === 6) return '☆';
  if (d.isBye || d.isLegBye) return '○';
  if (d.runs === 0) return '•';
  return '';
}

/** Generate a simplified par score for rain delay (not official DLS) */
export function getSimplifiedParScore(
  firstInningsTotal: number,
  totalOvers: number,
  oversCompleted: number
): number {
  if (oversCompleted >= totalOvers) return firstInningsTotal;
  const resourceUsed = oversCompleted / totalOvers;
  const adjustedResource = 1 - Math.pow(1 - resourceUsed, 1.5);
  return Math.ceil(firstInningsTotal * adjustedResource);
}

/** Get the best batter from an innings */
export function getBestBatter(inn: Innings): { name: string; runs: number; balls: number } | null {
  let best: { name: string; runs: number; balls: number } | null = null;
  for (const [name, stats] of Object.entries(inn.batters)) {
    if (!best || stats.runs > best.runs || (stats.runs === best.runs && stats.balls < best.balls)) {
      best = { name, runs: stats.runs, balls: stats.balls };
    }
  }
  return best;
}

/** Get the best bowler from an innings */
export function getBestBowler(inn: Innings): { name: string; wickets: number; runs: number } | null {
  let best: { name: string; wickets: number; runs: number } | null = null;
  for (const [name, stats] of Object.entries(inn.bowlers)) {
    if (!best || stats.wickets > best.wickets || (stats.wickets === best.wickets && stats.runsConceded < best.runs)) {
      best = { name, wickets: stats.wickets, runs: stats.runsConceded };
    }
  }
  return best;
}

/** Suggest Man of the Match based on stats */
export function suggestManOfTheMatch(match: Match): string {
  const candidates: { name: string; score: number }[] = [];

  for (let i = 0; i < 2; i++) {
    const inn = match.innings[i];
    for (const [name, b] of Object.entries(inn.batters)) {
      const sr = b.balls > 0 ? (b.runs / b.balls) * 100 : 0;
      const batting = b.runs * 2 + b.fours * 1 + b.sixes * 2 + (sr > 150 ? 10 : 0);
      const existing = candidates.find(c => c.name === name);
      if (existing) existing.score += batting;
      else candidates.push({ name, score: batting });
    }
    for (const [name, bw] of Object.entries(inn.bowlers)) {
      const bowling = bw.wickets * 25 + bw.maidens * 10 + bw.dotBalls * 1;
      const existing = candidates.find(c => c.name === name);
      if (existing) existing.score += bowling;
      else candidates.push({ name, score: bowling });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.length > 0 ? candidates[0].name : '';
}
