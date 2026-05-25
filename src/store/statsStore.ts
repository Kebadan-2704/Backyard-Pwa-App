import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Match, BatterStats, BowlerStats, Innings } from '../types/cricket';
import type { PlayerProfile, Tournament, TeamPoints } from '../types/stats';

interface StatsStoreState {
  players: Record<string, PlayerProfile>;
  tournaments: Record<string, Tournament>;
  activeTournamentId: string | null;
  
  ingestMatch: (match: Match) => void;
  recomputeAllStats: (matches: Match[]) => void;
  setActiveTournament: (id: string | null) => void;
  createTournament: (name: string, teams: string[]) => void;
  clearStats: () => void;
}

function createEmptyPlayer(name: string): PlayerProfile {
  return {
    name,
    batting: {
      matches: 0, innings: 0, runs: 0, ballsFaced: 0,
      fours: 0, sixes: 0, fifties: 0, hundreds: 0,
      highestScore: 0, notOuts: 0
    },
    bowling: {
      matches: 0, innings: 0, ballsBowled: 0, runsConceded: 0,
      wickets: 0, maidens: 0, fiveWicketHauls: 0,
      bestBowling: { wickets: 0, runs: 0 }
    },
    fielding: {
      matches: 0, dismissals: 0, catches: 0, runOuts: 0, stumpings: 0
    }
  };
}

function createEmptyTeam(teamName: string): TeamPoints {
  return {
    teamName, played: 0, won: 0, lost: 0, tied: 0, points: 0,
    netRunRate: 0, runsScored: 0, oversFaced: 0, runsConceded: 0, oversBowled: 0
  };
}

export const useStatsStore = create<StatsStoreState>()(
  persist(
    (set, get) => ({
      players: {},
      tournaments: {},
      activeTournamentId: null,

      setActiveTournament: (id) => set({ activeTournamentId: id }),

      createTournament: (name, teams) => {
        const id = Date.now().toString();
        const teamsRecord: Record<string, TeamPoints> = {};
        teams.forEach(t => teamsRecord[t] = createEmptyTeam(t));
        
        set((state) => ({
          tournaments: {
            ...state.tournaments,
            [id]: {
              id,
              name,
              startDate: new Date().toISOString().split('T')[0],
              status: 'active',
              teams: teamsRecord,
              matchIds: []
            }
          },
          activeTournamentId: id
        }));
      },

      ingestMatch: (match) => {
        if (!match.complete) return;
        
        set((state) => {
          const players = { ...state.players };
          const tournaments = { ...state.tournaments };
          const activeId = state.activeTournamentId;

          // 1. Ingest Player Stats
          const allMatchPlayers = new Set<string>();
          match.innings.forEach((inn: Innings) => {
            Object.keys(inn.batters).forEach(name => allMatchPlayers.add(name));
            Object.keys(inn.bowlers).forEach(name => allMatchPlayers.add(name));
          });

          // Ensure all players exist and deeply clone them so we can mutate safely
          allMatchPlayers.forEach(pName => {
            if (!players[pName]) {
              players[pName] = createEmptyPlayer(pName);
            } else {
              players[pName] = {
                ...players[pName],
                batting: { ...players[pName].batting },
                bowling: { 
                  ...players[pName].bowling, 
                  bestBowling: { ...players[pName].bowling.bestBowling } 
                },
                fielding: { ...(players[pName].fielding || createEmptyPlayer(pName).fielding) }
              };
            }
            // Increment matches played
            players[pName].batting.matches += 1;
            players[pName].bowling.matches += 1;
            players[pName].fielding.matches += 1;
          });

          // Update batting and bowling
          match.innings.forEach((inn: Innings) => {
            // Batting
            Object.entries(inn.batters).forEach(([name, p]) => {
              if (p.balls > 0 || p.runs > 0 || p.howOut) {
                const b = players[name].batting;
                b.innings += 1;
                b.runs += p.runs;
                b.ballsFaced += p.balls;
                b.fours += p.fours;
                b.sixes += p.sixes;
                if (p.runs >= 100) b.hundreds += 1;
                else if (p.runs >= 50) b.fifties += 1;
                if (p.runs > b.highestScore) b.highestScore = p.runs;
                if (!p.howOut) b.notOuts += 1;
              }
              
              // Fielding
              if (p.fielderName) {
                // We add the fielder to players if they don't exist yet
                if (!players[p.fielderName]) {
                  players[p.fielderName] = createEmptyPlayer(p.fielderName);
                  // Assuming they played the match since they fielded
                  players[p.fielderName].batting.matches += 1;
                  players[p.fielderName].bowling.matches += 1;
                  players[p.fielderName].fielding.matches += 1;
                } else if (!players[p.fielderName].fielding) {
                  players[p.fielderName].fielding = createEmptyPlayer(p.fielderName).fielding;
                }
                
                const f = players[p.fielderName].fielding;
                f.dismissals += 1;
                
                if (p.howOut.toLowerCase().includes('catch') || p.howOut.toLowerCase().includes('caught')) {
                  f.catches += 1;
                } else if (p.howOut.toLowerCase().includes('run out')) {
                  f.runOuts += 1;
                } else if (p.howOut.toLowerCase().includes('stumped')) {
                  f.stumpings += 1;
                }
              }
            });

            // Bowling
            Object.entries(inn.bowlers).forEach(([name, b]) => {
              if (b.ballsBowled > 0 || b.runsConceded > 0 || b.wickets > 0) {
                const p = players[name].bowling;
                p.innings += 1;
                p.ballsBowled += b.ballsBowled;
                p.runsConceded += b.runsConceded;
                p.wickets += b.wickets;
                p.maidens += b.maidens;
                if (b.wickets >= 5) p.fiveWicketHauls += 1;
                
                // Best bowling logic
                if (b.wickets > p.bestBowling.wickets || (b.wickets === p.bestBowling.wickets && b.runsConceded < p.bestBowling.runs)) {
                  p.bestBowling = { wickets: b.wickets, runs: b.runsConceded };
                }
              }
            });
          });

          // 2. Ingest Tournament Points & NRR
          if (activeId && tournaments[activeId]) {
            const trn = tournaments[activeId];
            if (trn.matchIds.includes(match.id.toString())) return state; // Already ingested
            trn.matchIds.push(match.id.toString());

            const t1 = match.teams[0];
            const t2 = match.teams[1];
            if (!trn.teams[t1]) trn.teams[t1] = createEmptyTeam(t1);
            if (!trn.teams[t2]) trn.teams[t2] = createEmptyTeam(t2);

            trn.teams[t1].played += 1;
            trn.teams[t2].played += 1;

            const res = match.winner;
            if (res) {
              if (res === t1) {
                trn.teams[t1].won += 1;
                trn.teams[t1].points += 2;
                trn.teams[t2].lost += 1;
              } else if (res === t2) {
                trn.teams[t2].won += 1;
                trn.teams[t2].points += 2;
                trn.teams[t1].lost += 1;
              } else if (res === 'Match tied') {
                trn.teams[t1].tied += 1;
                trn.teams[t2].tied += 1;
                trn.teams[t1].points += 1;
                trn.teams[t2].points += 1;
              }
            }

            // NRR Calculation
            const t1Inn = match.innings[0];
            const t2Inn = match.innings[1];

            if (t1Inn && t1Inn.runs > 0) { // t1 bats first typically, wait, let's just assume innings 0 and 1
              // Actually we need to know who batted when.
              // match.tossWinner / match.tossChoice decides team1 or team2 batting first.
              const batFirstTeam = (match.tossChoice === 'bat') ? match.tossWinner : (match.tossWinner === t1 ? t2 : t1);
              const batSecondTeam = (batFirstTeam === t1) ? t2 : t1;

              const inn1 = match.innings[0];
              if (inn1) {
                trn.teams[batFirstTeam].runsScored += inn1.runs;
                trn.teams[batFirstTeam].oversFaced += (inn1.wickets === match.settings.maxWickets) ? match.settings.overs : inn1.deliveries.length / 6;
                trn.teams[batSecondTeam].runsConceded += inn1.runs;
                trn.teams[batSecondTeam].oversBowled += (inn1.wickets === match.settings.maxWickets) ? match.settings.overs : inn1.deliveries.length / 6;
              }
              const inn2 = match.innings[1];
              if (inn2) {
                trn.teams[batSecondTeam].runsScored += inn2.runs;
                trn.teams[batSecondTeam].oversFaced += (inn2.wickets === match.settings.maxWickets) ? match.settings.overs : inn2.deliveries.length / 6;
                trn.teams[batFirstTeam].runsConceded += inn2.runs;
                trn.teams[batFirstTeam].oversBowled += (inn2.wickets === match.settings.maxWickets) ? match.settings.overs : inn2.deliveries.length / 6;
              }
            }

            // Recalculate NRR
            [t1, t2].forEach(t => {
              const scoredRate = trn.teams[t].oversFaced > 0 ? (trn.teams[t].runsScored / trn.teams[t].oversFaced) : 0;
              const concededRate = trn.teams[t].oversBowled > 0 ? (trn.teams[t].runsConceded / trn.teams[t].oversBowled) : 0;
              trn.teams[t].netRunRate = scoredRate - concededRate;
            });
          }

          return { players, tournaments };
        });
      },

      recomputeAllStats: (matches: Match[]) => {
        // Reset players entirely, but KEEP tournament definitions, just clear their team points & matchIds
        set((state) => {
          const tournaments = { ...state.tournaments };
          
          // Reset team points inside existing tournaments
          Object.keys(tournaments).forEach(tId => {
            const trn = tournaments[tId];
            trn.matchIds = [];
            Object.keys(trn.teams).forEach(teamName => {
              trn.teams[teamName] = createEmptyTeam(teamName);
            });
          });

          return { players: {}, tournaments };
        });

        // Now sequentially ingest all completed matches back into the fresh state
        matches.forEach(m => {
          if (m.complete) get().ingestMatch(m);
        });
      },

      clearStats: () => set({ players: {}, tournaments: {}, activeTournamentId: null })
    }),
    {
      name: 'backyard-cricket-stats',
    }
  )
);
