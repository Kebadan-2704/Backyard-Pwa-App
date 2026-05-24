// ═══════════════════════════════════════════════════════
//  AUTO COMMENTARY GENERATOR
// ═══════════════════════════════════════════════════════

import type { Delivery, Match } from '../types/cricket';

const dotComments = [
  'Dot ball. Good line.',
  'No run. Tight bowling.',
  'Defended solidly.',
  'Left alone outside off.',
  'Played and missed!',
  'Good length, no run.',
];

const singleComments = [
  'Quick single taken.',
  'Pushed into the gap for one.',
  'Nudged off the pads for a single.',
  'Tapped and they run.',
];

const twoComments = [
  'Good running between the wickets, two taken.',
  'Driven into the gap, they come back for two.',
  'Placed nicely, two runs.',
];

const threeComments = [
  'Excellent running! Three taken.',
  'Misfield at the boundary, they run three.',
  'Good placement, three runs.',
];

const fourComments = [
  'FOUR! Cracked through the covers!',
  'FOUR! Pulled away to the boundary!',
  'FOUR! Beautiful drive!',
  'FOUR! Races to the fence!',
  'FOUR! Edged but safe, runs to the boundary!',
];

const sixComments = [
  'SIX! Absolutely smashed!',
  'SIX! Into the neighborhood!',
  'MAXIMUM! What a shot!',
  'SIX! Over the bowler\'s head!',
  'SIX! That\'s gone a mile!',
  'SIX! Clean hitting!',
];

const wicketComments: Record<string, string[]> = {
  Bowled: ['BOWLED HIM! Timber!', 'Clean bowled! The stumps are shattered!', 'Bowled! Middle stump out of the ground!'],
  Caught: ['CAUGHT! Taken cleanly!', 'Caught! What a grab!', 'In the air... and taken!'],
  LBW: ['LBW! Dead plumb!', 'Trapped in front! LBW!', 'That\'s out! Stone dead LBW!'],
  'Run Out': ['RUN OUT! Direct hit!', 'Run out! Caught short of the crease!', 'Gone! Run out by a mile!'],
  Stumped: ['STUMPED! Quick hands behind the wicket!', 'Stumped! Too slow to get back!'],
  'Hit Wicket': ['Hit wicket! Oh no, stepped on the stumps!', 'Hit wicket! Lost balance!'],
  Mankading: ['Mankaded! Backing up too far!'],
  Other: ['WICKET! That\'s out!'],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateCommentary(delivery: Delivery, match: Match): string {
  const batter = delivery.batter || 'Batter';
  const bowler = delivery.bowler || 'Bowler';

  if (delivery.wicket) {
    const type = delivery.wktType || 'Other';
    const base = pick(wicketComments[type] || wicketComments.Other);
    const dismissed = delivery.dismissedBatter || batter;
    return `${base} ${dismissed} departs. ${bowler} strikes!`;
  }

  if (delivery.wide) return `Wide ball! Extra run conceded by ${bowler}.`;
  if (delivery.noball) return `No ball! Free hit coming up. ${bowler} oversteps.`;
  if (delivery.isBye) return `Bye! ${delivery.runs} run${delivery.runs > 1 ? 's' : ''} added.`;
  if (delivery.isLegBye) return `Leg bye! Off the pads for ${delivery.runs}.`;

  switch (delivery.runs) {
    case 0: return `${pick(dotComments)} ${bowler} to ${batter}.`;
    case 1: return `${pick(singleComments)} ${batter} on strike.`;
    case 2: return `${pick(twoComments)} ${batter} looking good.`;
    case 3: return `${pick(threeComments)}`;
    case 4: return `${pick(fourComments)} ${batter} is on fire!`;
    case 5: return `Five runs! Overthrows add to the total.`;
    case 6: return `${pick(sixComments)} ${batter} launches it!`;
    default: return `${delivery.runs} runs scored.`;
  }
}

/** Generate situation text */
export function generateSituation(match: Match): string {
  const ci = match.currentInnings;
  const inn = match.innings[ci];
  const team = match.teams[ci];

  if (ci === 0) {
    if (inn.runs === 0 && (!inn.deliveries || inn.deliveries.length === 0)) {
      return `${team} are about to begin their innings.`;
    }
    const rr = (inn.deliveries && inn.deliveries.length > 0)
      ? ((inn.runs / Math.max(1, inn.deliveries.filter(d => !d.wide && !d.noball).length)) * 6).toFixed(1)
      : '0.0';
    return `${team} are ${inn.runs}/${inn.wickets}, scoring at ${rr} per over.`;
  }

  const target = match.innings[0].runs + 1;
  const needed = target - inn.runs;
  const legalBalls = (inn.deliveries || []).filter(d => !d.wide && !d.noball).length;
  const ballsLeft = match.settings.overs * 6 - legalBalls;

  if (needed <= 0) return `${team} have won!`;
  if (ballsLeft <= 0) return `${match.teams[0]} have won!`;

  const oversLeft = Math.ceil(ballsLeft / 6);
  const rrr = ((needed / ballsLeft) * 6).toFixed(1);

  if (needed <= 6 && ballsLeft <= 6) {
    return `Last over thriller! ${team} need ${needed} off ${ballsLeft} ball${ballsLeft > 1 ? 's' : ''}!`;
  }
  if (parseFloat(rrr) > 12) {
    return `${team} need ${needed} off ${ballsLeft} balls. Required rate ${rrr} — tough ask!`;
  }
  if (parseFloat(rrr) < 6) {
    return `${team} need ${needed} off ${ballsLeft} balls (${rrr} per over). Comfortable position.`;
  }
  return `${team} need ${needed} runs off ${ballsLeft} balls (${rrr} per over, ~${Math.ceil(needed / oversLeft)}/ov).`;
}
