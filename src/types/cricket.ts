// ═══════════════════════════════════════════════════════
//  CRICKET DOMAIN TYPES — v3.0
// ═══════════════════════════════════════════════════════

export type DismissalType =
  | 'Bowled'
  | 'Caught'
  | 'LBW'
  | 'Run Out'
  | 'Stumped'
  | 'Hit Wicket'
  | 'Mankading'
  | 'Hit Ball Twice'
  | 'Obstructing Field'
  | 'Timed Out'
  | 'Retired Hurt'
  | 'Retired Out'
  | 'Other';

export type ExtraType = 'wide' | 'noball' | 'bye' | 'legbye' | 'penalty';

export type MatchType = 'friendly' | 'league' | 'knockout' | 'superover' | 'hand_cricket' | 'book_cricket';

export type PitchCondition = '' | 'dry' | 'wet' | 'flat' | 'turning' | 'green' | 'dusty';

export type ScoringZone = 'offDrive' | 'cover' | 'point' | 'thirdMan' | 'fineLeg' | 'legSide' | 'straight' | '';

export type ShotRegion = 
  | 'third-man'
  | 'point'
  | 'cover'
  | 'long-off'
  | 'long-on'
  | 'deep-midwicket'
  | 'deep-square-leg'
  | 'fine-leg';

export interface Delivery {
  id: number;
  runs: number;
  wide: boolean;
  noball: boolean;
  wicket: boolean;
  isTeamWicket?: boolean;
  wktType?: DismissalType;
  dismissedBatter?: string;
  batter: string;
  bowler: string;
  isFreeHit: boolean;
  isBye: boolean;
  isLegBye: boolean;
  isPenalty: boolean;
  boundaryOverthrow: number;
  overNumber: number;
  ballInOver: number;
  timestamp: number;
  swappedBatters: boolean;
  wasEndOfOver: boolean;
  fielder?: string;
  scoringZone?: ScoringZone;
  shotRegion?: ShotRegion;
}

export interface BatterStats {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dotBalls: number;
  howOut: string;
  bowlerName: string;
  fielderName: string;
  battingPosition: number;
  isRetired: boolean;
  retireType?: 'hurt' | 'out';
  minutesBatted: number;
  entryTime: number;
}

export interface BowlerSpell {
  overStart: number;
  overEnd: number;
  runs: number;
  wickets: number;
  maidens: number;
}

export interface BowlerStats {
  overs: number;
  ballsBowled: number;
  runsConceded: number;
  wickets: number;
  wides: number;
  noballs: number;
  maidens: number;
  dotBalls: number;
  economy: number;
  foursConceded: number;
  sixesConceded: number;
  spells: BowlerSpell[];
}

export interface Partnership {
  batter1: string;
  batter2: string;
  runs: number;
  balls: number;
  endedBy?: DismissalType;
  overStart: string;
  overEnd: string;
}

export interface FallOfWicket {
  wicketNumber: number;
  score: number;
  over: string;
  batterName: string;
  dismissalType: DismissalType;
  bowlerName: string;
}

export interface OverSummary {
  overNumber: number;
  bowler: string;
  runs: number;
  wickets: number;
  deliveries: string[];
  isMaiden: boolean;
  extras: number;
}

export interface Innings {
  runs: number;
  wickets: number;
  deliveries: Delivery[];
  batters: Record<string, BatterStats>;
  bowlers: Record<string, BowlerStats>;
  extras: {
    wide: number;
    noball: number;
    byes: number;
    legByes: number;
    penalty: number;
  };
  striker: string;
  nonStriker: string;
  currentBowler: string;
  partnerships: Partnership[];
  fallOfWickets: FallOfWicket[];
  overSummaries: OverSummary[];
  battingOrder: string[];
}

export interface HouseRules {
  oneTipOneHand: boolean;
  noLBW: boolean;
  tippedAndRun: boolean;
  autoBowlerRotation: boolean;
}

export interface MatchSettings {
  overs: number;
  maxWickets: number;
  playersPerTeam: number;
  maxOversPerBowler: number;
  powerplayOvers: number;
  freeHitOnNoball: boolean;
  lastManStanding: boolean;
  houseRules: HouseRules;
}

export interface HighlightEvent {
  type: 'boundary' | 'six' | 'wicket' | 'milestone' | 'maiden';
  description: string;
  over: string;
  innings: number;
  timestamp: number;
}

export interface Match {
  id: number;
  date: string;
  venue: string;
  teams: [string, string];
  teamColors: [string, string];
  players: [string[], string[]];
  battingOrder: [string[], string[]];
  settings: MatchSettings;
  innings: [Innings, Innings];
  superOver?: [Innings, Innings];
  currentInnings: 0 | 1;
  complete: boolean;
  activeScorerId?: string;
  winner: string;
  margin: string;
  tossWinner: string;
  tossChoice: 'bat' | 'bowl';
  notes: string;
  weather: string;
  isAbandoned: boolean;
  version: number;
  highlights: HighlightEvent[];
  // v3 additions
  matchType: MatchType;
  pitchCondition: PitchCondition;
  umpires: string;
  seriesName: string;
  isSuperOver: boolean;
  parentMatchId?: number;
  manOfTheMatch?: string;
  dlsConfig?: {
    enabled: boolean;
    targetScore: number;
    oversLost: number;
    baseResourcePercentage: number;
  };
}

export function createBlankInnings(): Innings {
  return {
    runs: 0,
    wickets: 0,
    deliveries: [],
    batters: {},
    bowlers: {},
    extras: { wide: 0, noball: 0, byes: 0, legByes: 0, penalty: 0 },
    striker: '',
    nonStriker: '',
    currentBowler: '',
    partnerships: [],
    fallOfWickets: [],
    overSummaries: [],
    battingOrder: [],
  };
}

export function createDefaultSettings(): MatchSettings {
  return {
    overs: 6,
    maxWickets: 10,
    playersPerTeam: 11,
    maxOversPerBowler: 2,
    powerplayOvers: 0,
    freeHitOnNoball: true,
    lastManStanding: false,
    houseRules: {
      oneTipOneHand: false,
      noLBW: false,
      tippedAndRun: false,
      autoBowlerRotation: false,
    },
  };
}

export function createBlankMatch(
  team1: string,
  team2: string,
  players1: string[],
  players2: string[],
  settings: MatchSettings,
  tossWinner: string,
  tossChoice: 'bat' | 'bowl',
  teamColors: [string, string] = ['#f0a500', '#e74c3c'],
  venue = '',
  weather = '',
  matchType: MatchType = 'friendly',
  pitchCondition: PitchCondition = '',
  umpires = '',
  seriesName = '',
): Match {
  const battingFirst = tossChoice === 'bat' ? tossWinner : (tossWinner === team1 ? team2 : team1);
  const bowlingFirst = battingFirst === team1 ? team2 : team1;
  const teams: [string, string] = [battingFirst, bowlingFirst];
  const players: [string[], string[]] = battingFirst === team1 ? [players1, players2] : [players2, players1];
  const colors: [string, string] = battingFirst === team1 ? teamColors : [teamColors[1], teamColors[0]];

  return {
    id: Date.now(),
    date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    venue,
    teams,
    teamColors: colors,
    players,
    battingOrder: [[], []],
    settings: { ...settings },
    innings: [createBlankInnings(), createBlankInnings()],
    currentInnings: 0,
    complete: false,
    winner: '',
    margin: '',
    tossWinner,
    tossChoice,
    notes: '',
    weather,
    isAbandoned: false,
    version: 3,
    highlights: [],
    matchType,
    pitchCondition,
    umpires,
    seriesName,
    isSuperOver: false,
  };
}

/** Create default batter stats */
export function createBatterStats(position: number): BatterStats {
  return {
    runs: 0, balls: 0, fours: 0, sixes: 0, dotBalls: 0,
    howOut: '', bowlerName: '', fielderName: '', battingPosition: position,
    isRetired: false, minutesBatted: 0, entryTime: Date.now(),
  };
}

/** Create default bowler stats */
export function createBowlerStats(): BowlerStats {
  return {
    overs: 0, ballsBowled: 0, runsConceded: 0, wickets: 0,
    wides: 0, noballs: 0, maidens: 0, dotBalls: 0, economy: 0,
    foursConceded: 0, sixesConceded: 0, spells: [],
  };
}

// ═══════════════════════════════════════════════════════
//  TOURNAMENT TYPES
// ═══════════════════════════════════════════════════════

export type TournamentFormat = 'knockout' | 'league' | 'group_knockout';
export type FixtureStatus = 'upcoming' | 'live' | 'completed';

export interface TournamentTeam {
  name: string;
  players: string[];
  played: number;
  won: number;
  lost: number;
  nrr: number;       // net run rate
  points: number;
}

export interface Fixture {
  id: string;
  round: number;          // 1 = Quarter-final, 2 = Semi-final, 3 = Final (for knockout)
  matchIndex: number;     // position within the round
  team1: string;
  team2: string;
  status: FixtureStatus;
  matchId?: number;       // links to a Match.id once started
  winner?: string;
  score1?: string;        // e.g. "145/6 (20)"
  score2?: string;
  scorers: string[];      // device IDs allowed to score this match
}

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  teams: TournamentTeam[];
  fixtures: Fixture[];
  settings: MatchSettings;
  currentRound: number;
  champion?: string;
  createdAt: number;
  isComplete: boolean;
}
