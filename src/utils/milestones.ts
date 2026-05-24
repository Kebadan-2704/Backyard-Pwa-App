// ═══════════════════════════════════════════════════════
//  MILESTONE DETECTION
// ═══════════════════════════════════════════════════════

import type { BatterStats, BowlerStats, Partnership, Innings } from '../types/cricket';

export type MilestoneType = 'batter50' | 'batter100' | 'partnership50' | 'partnership100' |
  'team100' | 'team200' | 'fiveWickets' | 'hatTrick' | 'maiden';

export interface Milestone {
  type: MilestoneType;
  message: string;
  emoji: string;
}

export function checkBatterMilestones(
  batter: BatterStats,
  prevRuns: number,
  name: string
): Milestone | null {
  if (prevRuns < 100 && batter.runs >= 100) {
    return { type: 'batter100', message: `CENTURY for ${name}! 💯`, emoji: '💯' };
  }
  if (prevRuns < 50 && batter.runs >= 50) {
    return { type: 'batter50', message: `FIFTY for ${name}! 🎉`, emoji: '🎉' };
  }
  return null;
}

export function checkPartnershipMilestones(
  partnership: Partnership,
  prevRuns: number
): Milestone | null {
  if (prevRuns < 100 && partnership.runs >= 100) {
    return {
      type: 'partnership100',
      message: `100 partnership! ${partnership.batter1} & ${partnership.batter2} 🤝`,
      emoji: '🤝',
    };
  }
  if (prevRuns < 50 && partnership.runs >= 50) {
    return {
      type: 'partnership50',
      message: `50 partnership! ${partnership.batter1} & ${partnership.batter2}`,
      emoji: '🤝',
    };
  }
  return null;
}

export function checkTeamMilestones(
  innings: Innings,
  prevRuns: number
): Milestone | null {
  if (prevRuns < 200 && innings.runs >= 200) {
    return { type: 'team200', message: '200 up! 🎊', emoji: '🎊' };
  }
  if (prevRuns < 100 && innings.runs >= 100) {
    return { type: 'team100', message: '100 up! 🎉', emoji: '🎉' };
  }
  return null;
}

export function checkBowlerMilestones(
  bowler: BowlerStats,
  prevWickets: number,
  name: string
): Milestone | null {
  if (prevWickets < 5 && bowler.wickets >= 5) {
    return { type: 'fiveWickets', message: `5-WICKET HAUL for ${name}! 🔥`, emoji: '🔥' };
  }
  return null;
}

/** Check for hat-trick (3 wickets in 3 consecutive legal deliveries by same bowler) */
export function checkHatTrick(
  deliveries: { wicket: boolean; bowler: string }[]
): string | null {
  if (deliveries.length < 3) return null;
  const last3 = deliveries.slice(-3);
  if (last3.every(d => d.wicket) && last3.every(d => d.bowler === last3[0].bowler)) {
    return last3[0].bowler;
  }
  return null;
}
