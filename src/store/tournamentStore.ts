import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tournament, TournamentTeam, Fixture, MatchSettings, TournamentFormat } from '../types/cricket';
import { createDefaultSettings } from '../types/cricket';
import { idbPersistStorage } from '../lib/storage';

// ═══════════════════════════════════════════════════════
//  TOURNAMENT STORE
// ═══════════════════════════════════════════════════════

interface TournamentState {
  tournaments: Tournament[];
  activeTournamentId: string | null;

  // Actions
  createTournament: (config: {
    name: string;
    format: TournamentFormat;
    teamNames: string[];
    settings?: MatchSettings;
  }) => Tournament;

  getActiveTournament: () => Tournament | null;
  setActiveTournament: (id: string | null) => void;
  deleteTournament: (id: string) => void;

  // Fixture management
  startFixture: (tournamentId: string, fixtureId: string, matchId: number) => void;
  completeFixture: (tournamentId: string, fixtureId: string, winner: string, score1: string, score2: string) => void;
  addScorer: (tournamentId: string, fixtureId: string, scorerId: string) => void;
  removeScorer: (tournamentId: string, fixtureId: string, scorerId: string) => void;
}

/** Generate a short unique ID */
function uid(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/** Generate knockout bracket fixtures from a list of teams */
function generateKnockoutFixtures(teams: string[]): Fixture[] {
  const fixtures: Fixture[] = [];
  const n = teams.length;

  // Pad to next power of 2 with BYEs
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(n)));
  const paddedTeams = [...teams];
  while (paddedTeams.length < nextPow2) {
    paddedTeams.push('BYE');
  }

  // Shuffle for randomness
  for (let i = paddedTeams.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [paddedTeams[i], paddedTeams[j]] = [paddedTeams[j], paddedTeams[i]];
  }

  // Calculate total rounds
  const totalRounds = Math.log2(nextPow2);

  // Generate Round 1 matches
  for (let i = 0; i < paddedTeams.length; i += 2) {
    const t1 = paddedTeams[i];
    const t2 = paddedTeams[i + 1];
    const isBye = t1 === 'BYE' || t2 === 'BYE';

    fixtures.push({
      id: uid(),
      round: 1,
      matchIndex: Math.floor(i / 2),
      team1: t1 === 'BYE' ? t2 : t1,
      team2: t2 === 'BYE' ? t1 : t2,
      status: isBye ? 'completed' : 'upcoming',
      winner: isBye ? (t1 === 'BYE' ? t2 : t1) : undefined,
      scorers: [],
    });
  }

  // Generate placeholder fixtures for subsequent rounds
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = nextPow2 / Math.pow(2, round);
    for (let i = 0; i < matchesInRound; i++) {
      fixtures.push({
        id: uid(),
        round,
        matchIndex: i,
        team1: 'TBD',
        team2: 'TBD',
        status: 'upcoming',
        scorers: [],
      });
    }
  }

  // Auto-advance BYE winners into the next round
  advanceByes(fixtures, totalRounds);

  return fixtures;
}

/** Generate round-robin (league) fixtures */
function generateLeagueFixtures(teams: string[]): Fixture[] {
  const fixtures: Fixture[] = [];
  const n = teams.length;
  const paddedTeams = n % 2 === 0 ? [...teams] : [...teams, 'BYE'];
  const total = paddedTeams.length;
  const rounds = total - 1;
  const half = total / 2;

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < half; i++) {
      const home = paddedTeams[i];
      const away = paddedTeams[total - 1 - i];
      if (home === 'BYE' || away === 'BYE') continue;
      fixtures.push({
        id: uid(),
        round: round + 1,
        matchIndex: i,
        team1: home,
        team2: away,
        status: 'upcoming',
        scorers: [],
      });
    }
    // Rotate teams (keep first fixed)
    paddedTeams.splice(1, 0, paddedTeams.pop()!);
  }

  return fixtures;
}

/** Advance BYE winners into subsequent rounds */
function advanceByes(fixtures: Fixture[], totalRounds: number) {
  for (let round = 1; round < totalRounds; round++) {
    const currentRound = fixtures.filter(f => f.round === round);
    const nextRound = fixtures.filter(f => f.round === round + 1);

    for (let i = 0; i < currentRound.length; i += 2) {
      const m1 = currentRound[i];
      const m2 = currentRound[i + 1];
      const nextMatch = nextRound[Math.floor(i / 2)];
      if (!nextMatch) continue;

      if (m1?.winner) nextMatch.team1 = m1.winner;
      if (m2?.winner) nextMatch.team2 = m2.winner;

      // If both slots are filled and one is BYE
      if (nextMatch.team1 !== 'TBD' && nextMatch.team2 !== 'TBD') {
        if (nextMatch.team1 === 'BYE') {
          nextMatch.winner = nextMatch.team2;
          nextMatch.status = 'completed';
        } else if (nextMatch.team2 === 'BYE') {
          nextMatch.winner = nextMatch.team1;
          nextMatch.status = 'completed';
        }
      }
    }
  }
}

/** Get round label */
export function getRoundLabel(round: number, totalRounds: number, format: TournamentFormat): string {
  if (format === 'league') return `Round ${round}`;
  const fromFinal = totalRounds - round;
  if (fromFinal === 0) return 'Final';
  if (fromFinal === 1) return 'Semi-Final';
  if (fromFinal === 2) return 'Quarter-Final';
  return `Round ${round}`;
}

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      tournaments: [],
      activeTournamentId: null,

      createTournament: (config) => {
        const teams: TournamentTeam[] = config.teamNames.map(name => ({
          name,
          players: [],
          played: 0,
          won: 0,
          lost: 0,
          nrr: 0,
          points: 0,
        }));

        const fixtures = config.format === 'knockout'
          ? generateKnockoutFixtures(config.teamNames)
          : generateLeagueFixtures(config.teamNames);

        const tournament: Tournament = {
          id: uid(),
          name: config.name,
          format: config.format,
          teams,
          fixtures,
          settings: config.settings || createDefaultSettings(),
          currentRound: 1,
          createdAt: Date.now(),
          isComplete: false,
        };

        set(state => ({
          tournaments: [...state.tournaments, tournament],
          activeTournamentId: tournament.id,
        }));

        return tournament;
      },

      getActiveTournament: () => {
        const { tournaments, activeTournamentId } = get();
        return tournaments.find(t => t.id === activeTournamentId) || null;
      },

      setActiveTournament: (id) => set({ activeTournamentId: id }),

      deleteTournament: (id) => set(state => ({
        tournaments: state.tournaments.filter(t => t.id !== id),
        activeTournamentId: state.activeTournamentId === id ? null : state.activeTournamentId,
      })),

      startFixture: (tournamentId, fixtureId, matchId) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t;
            return {
              ...t,
              fixtures: t.fixtures.map(f => 
                f.id === fixtureId ? { ...f, status: 'live' as const, matchId } : f
              ),
            };
          }),
        }));
      },

      completeFixture: (tournamentId, fixtureId, winner, score1, score2) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t;

            const newFixtures = t.fixtures.map(f =>
              f.id === fixtureId
                ? { ...f, status: 'completed' as const, winner, score1, score2 }
                : f
            );

            // Update team standings (for league)
            const newTeams = t.teams.map(team => {
              const fixture = newFixtures.find(f => f.id === fixtureId);
              if (!fixture) return team;
              if (team.name !== fixture.team1 && team.name !== fixture.team2) return team;
              
              return {
                ...team,
                played: team.played + 1,
                won: team.name === winner ? team.won + 1 : team.won,
                lost: team.name !== winner ? team.lost + 1 : team.lost,
                points: team.name === winner ? team.points + 2 : team.points,
              };
            });

            // For knockout: advance winner to next round
            if (t.format === 'knockout') {
              const completedFixture = newFixtures.find(f => f.id === fixtureId);
              if (completedFixture && winner) {
                const nextRoundFixtures = newFixtures.filter(f => f.round === completedFixture.round + 1);
                const nextMatchIdx = Math.floor(completedFixture.matchIndex / 2);
                const nextMatch = nextRoundFixtures[nextMatchIdx];
                if (nextMatch) {
                  const isFirstInPair = completedFixture.matchIndex % 2 === 0;
                  if (isFirstInPair) {
                    nextMatch.team1 = winner;
                  } else {
                    nextMatch.team2 = winner;
                  }
                }
              }
            }

            // Check if tournament is complete
            const totalRounds = Math.max(...newFixtures.map(f => f.round));
            const finalMatch = newFixtures.find(f => f.round === totalRounds);
            const isComplete = t.format === 'knockout'
              ? finalMatch?.status === 'completed'
              : newFixtures.every(f => f.status === 'completed');

            return {
              ...t,
              fixtures: newFixtures,
              teams: newTeams,
              champion: isComplete ? (t.format === 'knockout' ? finalMatch?.winner : newTeams.sort((a, b) => b.points - a.points)[0]?.name) : undefined,
              isComplete,
            };
          }),
        }));
      },

      addScorer: (tournamentId, fixtureId, scorerId) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t;
            return {
              ...t,
              fixtures: t.fixtures.map(f => {
                if (f.id !== fixtureId) return f;
                if (f.scorers.includes(scorerId)) return f;
                return { ...f, scorers: [...f.scorers, scorerId] };
              }),
            };
          }),
        }));
      },

      removeScorer: (tournamentId, fixtureId, scorerId) => {
        set(state => ({
          tournaments: state.tournaments.map(t => {
            if (t.id !== tournamentId) return t;
            return {
              ...t,
              fixtures: t.fixtures.map(f => {
                if (f.id !== fixtureId) return f;
                return { ...f, scorers: f.scorers.filter(s => s !== scorerId) };
              }),
            };
          }),
        }));
      },
    }),
    {
      name: 'cricket-tournament',
      storage: idbPersistStorage,
    },
  ),
);
