export interface PlayerBattingStats {
  matches: number;
  innings: number;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
  highestScore: number;
  notOuts: number;
}

export interface PlayerBowlingStats {
  matches: number;
  innings: number;
  ballsBowled: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
  fiveWicketHauls: number;
  bestBowling: { wickets: number; runs: number };
}

export interface PlayerProfile {
  name: string;
  batting: PlayerBattingStats;
  bowling: PlayerBowlingStats;
}

export interface TeamPoints {
  teamName: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  netRunRate: number;
  runsScored: number;
  oversFaced: number;
  runsConceded: number;
  oversBowled: number;
}

export interface Tournament {
  id: string;
  name: string;
  startDate: string;
  status: 'active' | 'completed';
  teams: Record<string, TeamPoints>;
  matchIds: string[];
}
