// ═══════════════════════════════════════════════════════
//  MATCH STATE STORE v3.0 (Zustand + persist)
//  All scoring bugs fixed, new features added
// ═══════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Match, Delivery, MatchSettings, DismissalType,
  BatterStats, BowlerStats, Partnership, FallOfWicket,
  Innings, OverSummary, HighlightEvent, MatchType, PitchCondition,
} from '../types/cricket';
import { createBlankMatch, createBlankInnings, createBatterStats, createBowlerStats } from '../types/cricket';
import {
  getLegalBallCount, getOversString, isNextFreeHit,
  buildOverSummary, getCurrentOverDeliveries,
} from '../utils/scoring';
import { checkBatterMilestones, checkBowlerMilestones, checkTeamMilestones, checkPartnershipMilestones, checkHatTrick } from '../utils/milestones';
import { generateCommentary, generateSituation } from '../utils/commentary';
import { syncLiveMatch } from '../lib/firebase';
import { useStatsStore } from './statsStore';
import { useAppStore } from './appStore';
import { idbPersistStorage } from '../lib/storage';

export interface MatchState {
  match: Match | null;
  pendingMilestones: { message: string; emoji: string }[];
  lastOverSummary: OverSummary | null;
  showBowlerSelect: boolean;
  showBatterSelect: boolean;
  showOverSummary: boolean;
  showInningsBreak: boolean;
  isFreeHit: boolean;
  lastCommentary: string;
  situationText: string;

  // Setup
  startMatch: (config: {
    team1: string; team2: string;
    players1: string[]; players2: string[];
    settings: MatchSettings;
    tossWinner: string; tossChoice: 'bat' | 'bowl';
    teamColors?: [string, string];
    venue?: string; weather?: string;
    matchType?: MatchType; pitchCondition?: PitchCondition;
    umpires?: string; seriesName?: string;
  }) => void;
  updateMatchSettings: (partial: Partial<MatchSettings>) => void;
  newMatch: () => void;
  resumeMatch: (m: Match) => void;

  // Scoring
  addRun: (runs: number) => void;
  addExtra: (type: 'wide' | 'noball' | 'bye' | 'legbye' | 'penalty', runs?: number) => void;
  submitWicket: (config: {
    type: DismissalType;
    dismissedBatter: 'striker' | 'nonStriker';
    runsBeforeWicket: number;
    fielder?: string;
    isTeamWicket?: boolean;
  }) => void;
  undoLastBall: () => boolean;
  setLastDeliveryRegion: (region: any) => void;

  // Player management
  setStriker: (name: string) => void;
  setNonStriker: (name: string) => void;
  setBowler: (name: string) => void;
  swapBatters: () => void;
  retireBatter: (type: 'hurt' | 'out') => void;

  // Innings
  endInnings: () => void;
  abandonMatch: () => void;
  startSuperOver: () => void;

  // Match editing
  setManOfTheMatch: (name: string) => void;
  addNote: (note: string) => void;

  // Milestones
  clearMilestones: () => void;
  dismissOverSummary: () => void;
  dismissBowlerSelect: () => void;
  dismissBatterSelect: () => void;
  dismissInningsBreak: () => void;
}

function ensureBatter(inn: Innings, name: string, position?: number): void {
  if (!name) return;
  if (!inn.batters[name]) {
    inn.batters[name] = createBatterStats(position ?? Object.keys(inn.batters).length + 1);
    if (!inn.battingOrder.includes(name)) {
      inn.battingOrder.push(name);
    }
  }
}

function ensureBowler(inn: Innings, name: string): void {
  if (!name) return;
  if (!inn.bowlers[name]) {
    inn.bowlers[name] = createBowlerStats();
  }
}

function getCurrentPartnership(inn: Innings): Partnership | null {
  if (inn.partnerships.length === 0) return null;
  const last = inn.partnerships[inn.partnerships.length - 1];
  return last.endedBy ? null : last;
}

function startPartnership(inn: Innings): void {
  const legal = getLegalBallCount(inn.deliveries);
  inn.partnerships.push({
    batter1: inn.striker,
    batter2: inn.nonStriker,
    runs: 0,
    balls: 0,
    overStart: `${Math.floor(legal / 6)}.${legal % 6}`,
    overEnd: '',
  });
}

function finalizeBowlerOver(inn: Innings, bowlerName: string): void {
  if (!bowlerName || !inn.bowlers[bowlerName]) return;
  const bw = inn.bowlers[bowlerName];
  bw.overs++;
  // Track spell
  const spellCount = bw.spells.length;
  const lastSpell = spellCount > 0 ? bw.spells[spellCount - 1] : null;
  const overNum = inn.overSummaries.length;
  if (lastSpell && lastSpell.overEnd === overNum - 1) {
    // Continue existing spell
    lastSpell.overEnd = overNum;
    const summ = inn.overSummaries[inn.overSummaries.length - 1];
    if (summ) {
      lastSpell.runs += summ.runs;
      lastSpell.wickets += summ.wickets;
      if (summ.isMaiden) lastSpell.maidens++;
    }
  } else {
    // New spell
    const summ = inn.overSummaries[inn.overSummaries.length - 1];
    bw.spells.push({
      overStart: overNum,
      overEnd: overNum,
      runs: summ ? summ.runs : 0,
      wickets: summ ? summ.wickets : 0,
      maidens: summ?.isMaiden ? 1 : 0,
    });
  }
  bw.ballsBowled = 0;
  bw.economy = bw.overs > 0 ? bw.runsConceded / bw.overs : 0;
}

function checkAndEndInnings(
  m: Match,
  inn: Innings,
  ci: number,
  legalAfter: number,
  milestones: { message: string; emoji: string }[],
  summary: OverSummary | null,
  set: (state: Partial<MatchState>) => void,
  get: () => MatchState,
): boolean {
  const allOut = inn.wickets >= m.settings.maxWickets;
  const lastMan = m.settings.lastManStanding && inn.wickets >= m.settings.maxWickets - 1;
  const allOvers = legalAfter >= m.settings.overs * 6;

  // Chase won
  if (ci === 1) {
    const target = m.innings[0].runs + 1;
    if (inn.runs >= target) {
      m.complete = true;
      const wktsLeft = m.settings.maxWickets - inn.wickets;
      m.winner = m.teams[1];
      m.margin = `by ${wktsLeft} wicket${wktsLeft !== 1 ? 's' : ''}`;
      
      // Ingest into global stats
      useStatsStore.getState().ingestMatch(m);

      const situation = generateSituation(m);
      set({ match: m, pendingMilestones: milestones, isFreeHit: false, situationText: situation });
      return true;
    }
  }

  if (allOut) {
    milestones.push({ message: `ALL OUT! 💥`, emoji: '💥' });
  }

  if (allOut || lastMan || allOvers) {
    set({
      match: m,
      pendingMilestones: milestones,
      isFreeHit: false,
      lastOverSummary: summary,
      showOverSummary: !!summary,
      showBatterSelect: false,
    });
    get().endInnings();
    return true;
  }

  return false;
}


export const useMatchStore = create<MatchState>()(
  persist(
    (set, get) => ({
      match: null,
      pendingMilestones: [],
      lastOverSummary: null,
      showBowlerSelect: false,
      showBatterSelect: false,
      showOverSummary: false,
      showInningsBreak: false,
      isFreeHit: false,
      lastCommentary: '',
      situationText: '',

      startMatch: (config) => {
        const m = createBlankMatch(
          config.team1, config.team2,
          config.players1, config.players2,
          config.settings,
          config.tossWinner, config.tossChoice,
          config.teamColors, config.venue, config.weather,
          config.matchType, config.pitchCondition,
          config.umpires, config.seriesName,
        );
        m.activeScorerId = useAppStore.getState().deviceId;
        set({ match: m, isFreeHit: false, pendingMilestones: [], lastOverSummary: null, lastCommentary: '', situationText: '', showInningsBreak: false });
      },

      newMatch: () => {
        set({ match: null, isFreeHit: false, pendingMilestones: [], lastOverSummary: null, showBowlerSelect: false, showBatterSelect: false, showInningsBreak: false, lastCommentary: '', situationText: '' });
      },

      updateMatchSettings: (partial) => {
        const state = get();
        if (!state.match) return;
        const newMatch = { ...state.match, settings: { ...state.match.settings, ...partial } };
        set({ match: newMatch });
        syncLiveMatch(newMatch.id.toString(), newMatch);
      },

      resumeMatch: (m) => {
        set({ 
          match: structuredClone(m), 
          isFreeHit: false, 
          pendingMilestones: [], 
          lastOverSummary: null, 
          showBowlerSelect: false, 
          showBatterSelect: false, 
          showInningsBreak: false,
          lastCommentary: 'Match resumed from history.', 
          situationText: generateSituation(m) 
        });
      },

      // ═══════════════════════════════════════
      //  ADD RUN — Legal delivery
      // ═══════════════════════════════════════
      addRun: (runs) => {
        const { match } = get();
        if (!match || match.complete) return;
        const m = structuredClone(match);
        const ci = m.currentInnings;
        const inn = m.innings[ci];
        const prevTeamRuns = inn.runs;

        const legalBefore = getLegalBallCount(inn.deliveries);
        const currentOverNum = Math.floor(legalBefore / 6);
        const ballInOver = legalBefore % 6;

        const delivery: Delivery = {
          id: Date.now(),
          runs,
          wide: false, noball: false, wicket: false,
          batter: inn.striker,
          bowler: inn.currentBowler,
          isFreeHit: get().isFreeHit,
          isBye: false, isLegBye: false, isPenalty: false,
          boundaryOverthrow: 0,
          overNumber: currentOverNum,
          ballInOver: ballInOver + 1,
          timestamp: Date.now(),
          swappedBatters: false,
          wasEndOfOver: false,
        };

        inn.deliveries.push(delivery);
        inn.runs += runs;

        // Update batter stats
        if (inn.striker) {
          ensureBatter(inn, inn.striker);
          const b = inn.batters[inn.striker];
          const prevBatterRuns = b.runs;
          b.runs += runs;
          b.balls++;
          if (runs === 0) b.dotBalls++;
          if (runs === 4) b.fours++;
          if (runs === 6) b.sixes++;

          // Batter milestones
          const milestone = checkBatterMilestones(b, prevBatterRuns, inn.striker);
          if (milestone) {
            m.highlights.push({
              type: 'milestone', description: milestone.message,
              over: getOversString(inn.deliveries), innings: ci, timestamp: Date.now(),
            });
          }
        }

        // Update bowler stats
        if (inn.currentBowler) {
          ensureBowler(inn, inn.currentBowler);
          const bw = inn.bowlers[inn.currentBowler];
          bw.runsConceded += runs;
          bw.ballsBowled++;
          if (runs === 0) bw.dotBalls++;
          if (runs === 4) bw.foursConceded++;
          if (runs === 6) bw.sixesConceded++;
        }

        // Update partnership
        const partnership = getCurrentPartnership(inn);
        if (partnership) {
          partnership.runs += runs;
          partnership.balls++;
        }

        // Highlights
        if (runs === 4) {
          m.highlights.push({
            type: 'boundary', description: `FOUR by ${inn.striker}`,
            over: getOversString(inn.deliveries), innings: ci, timestamp: Date.now(),
          });
        }
        if (runs === 6) {
          m.highlights.push({
            type: 'six', description: `SIX by ${inn.striker}`,
            over: getOversString(inn.deliveries), innings: ci, timestamp: Date.now(),
          });
        }

        // Team milestones
        const teamMilestone = checkTeamMilestones(inn, prevTeamRuns);
        const milestones = [...get().pendingMilestones];
        if (teamMilestone) milestones.push(teamMilestone);

        // Partnership milestones
        if (partnership) {
          const prevPartRuns = partnership.runs - runs;
          const pm = checkPartnershipMilestones(partnership, prevPartRuns);
          if (pm) milestones.push(pm);
        }

        // Swap on odd runs
        let swapped = false;
        if (runs % 2 === 1) {
          [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];
          swapped = true;
        }
        delivery.swappedBatters = swapped;

        // Free hit consumed — legal ball clears free hit
        const commentary = generateCommentary(delivery, m);

        // Check end of over
        const legalAfter = getLegalBallCount(inn.deliveries);
        if (legalAfter > 0 && legalAfter % 6 === 0 && legalAfter > legalBefore) {
          delivery.wasEndOfOver = true;
          // Swap batters at end of over
          [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];

          // Build over summary
          const overDeliveries = getCurrentOverDeliveries(inn.deliveries);
          const overNum = Math.floor(legalAfter / 6);
          const summary = buildOverSummary(overDeliveries, overNum, inn.currentBowler);

          // Check maiden
          if (summary.isMaiden) {
            if (inn.currentBowler) {
              ensureBowler(inn, inn.currentBowler);
              inn.bowlers[inn.currentBowler].maidens++;
            }
            m.highlights.push({
              type: 'maiden', description: `Maiden over by ${inn.currentBowler}`,
              over: `${overNum}`, innings: ci, timestamp: Date.now(),
            });
          }

          inn.overSummaries.push(summary);

          // Finalize bowler over
          if (inn.currentBowler) {
            finalizeBowlerOver(inn, inn.currentBowler);
          }

          // Check if innings is over (all overs bowled or chase won)
          if (checkAndEndInnings(m, inn, ci, legalAfter, milestones, summary, set, get)) return;

          const situation = generateSituation(m);
          set({
            match: m,
            pendingMilestones: milestones,
            lastOverSummary: summary,
            showOverSummary: true,
            showBowlerSelect: true,
            isFreeHit: false,
            lastCommentary: commentary,
            situationText: situation,
          });
          return;
        }

        // Check 2nd innings target chase mid-over
        if (checkAndEndInnings(m, inn, ci, legalAfter, milestones, null, set, get)) return;

        const situation = generateSituation(m);
        set({ match: m, pendingMilestones: milestones, isFreeHit: false, lastCommentary: commentary, situationText: situation });
      },

      // ═══════════════════════════════════════
      //  ADD EXTRA — Wide, No-ball, Bye, Leg-bye, Penalty
      // ═══════════════════════════════════════
      addExtra: (type, extraRuns = 1, batterRuns = 0) => {
        const { match } = get();
        if (!match || match.complete) return;
        const m = structuredClone(match);
        const ci = m.currentInnings;
        const inn = m.innings[ci];

        const legalBefore = getLegalBallCount(inn.deliveries);
        const currentOverNum = Math.floor(legalBefore / 6);

        const delivery: Delivery = {
          id: Date.now(),
          runs: type === 'penalty' ? 5 : (extraRuns + batterRuns),
          wide: type === 'wide',
          noball: type === 'noball',
          wicket: false,
          batter: inn.striker,
          bowler: inn.currentBowler,
          isFreeHit: get().isFreeHit,
          isBye: type === 'bye',
          isLegBye: type === 'legbye',
          isPenalty: type === 'penalty',
          boundaryOverthrow: 0,
          overNumber: currentOverNum,
          ballInOver: 0,
          timestamp: Date.now(),
          swappedBatters: false,
          wasEndOfOver: false,
        };

        inn.deliveries.push(delivery);
        inn.runs += delivery.runs;

        // Update extras
        switch (type) {
          case 'wide': inn.extras.wide += extraRuns; break;
          case 'noball': inn.extras.noball += extraRuns; break;
          case 'bye': inn.extras.byes += extraRuns; break;
          case 'legbye': inn.extras.legByes += extraRuns; break;
          case 'penalty': inn.extras.penalty += 5; break;
        }

        const milestones = [...get().pendingMilestones];
        const commentary = generateCommentary(delivery, m);

        // For byes and leg byes — they are legal deliveries
        if (type === 'bye' || type === 'legbye') {
          if (inn.striker) {
            ensureBatter(inn, inn.striker);
            inn.batters[inn.striker].balls++;
            // Only count as dot ball if 0 byes were scored (rare but possible)
            if (delivery.runs === 0) inn.batters[inn.striker].dotBalls++;
          }
          if (inn.currentBowler) {
            ensureBowler(inn, inn.currentBowler);
            inn.bowlers[inn.currentBowler].ballsBowled++;
            // Byes/legbyes don't count as bowler's runs
            if (delivery.runs === 0) inn.bowlers[inn.currentBowler].dotBalls++;
          }

          // Update partnership
          const partnership = getCurrentPartnership(inn);
          if (partnership) {
            partnership.runs += delivery.runs;
            partnership.balls++;
          }

          // Swap on odd byes/legbyes
          if (delivery.runs % 2 === 1) {
            [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];
            delivery.swappedBatters = true;
          }

          // Check end of over for byes/legbyes
          const legalAfter = getLegalBallCount(inn.deliveries);
          if (legalAfter > 0 && legalAfter % 6 === 0 && legalAfter > legalBefore) {
            delivery.wasEndOfOver = true;
            [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];

            const overDeliveries = getCurrentOverDeliveries(inn.deliveries);
            const summary = buildOverSummary(overDeliveries, Math.floor(legalAfter / 6), inn.currentBowler);
            if (inn.currentBowler && inn.bowlers[inn.currentBowler]) {
              if (summary.isMaiden) inn.bowlers[inn.currentBowler].maidens++;
            }
            inn.overSummaries.push(summary);
            if (inn.currentBowler) finalizeBowlerOver(inn, inn.currentBowler);

            if (checkAndEndInnings(m, inn, ci, legalAfter, milestones, summary, set, get)) return;

            const situation = generateSituation(m);
            set({ match: m, isFreeHit: false, lastOverSummary: summary, showOverSummary: true, showBowlerSelect: true, lastCommentary: commentary, situationText: situation });
            return;
          }

          // Check chase won
          if (checkAndEndInnings(m, inn, ci, getLegalBallCount(inn.deliveries), milestones, null, set, get)) return;

          const situation = generateSituation(m);
          set({ match: m, lastCommentary: commentary, situationText: situation });
          return;
        }

        // For wide — update bowler (not a legal ball)
        if (type === 'wide') {
          if (inn.currentBowler) {
            ensureBowler(inn, inn.currentBowler);
            inn.bowlers[inn.currentBowler].wides += extraRuns;
            inn.bowlers[inn.currentBowler].runsConceded += delivery.runs;
          }
          // Update partnership
          const partnership = getCurrentPartnership(inn);
          if (partnership) {
            partnership.runs += delivery.runs;
          }
          // Swap on odd wide runs (more than 1 run off a wide)
          // Wide is 1. If they ran 1, extraRuns = 2 (1 wide + 1 run). So ran = extraRuns - 1.
          const ran = extraRuns - 1;
          if (ran % 2 === 1) {
             [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];
             delivery.swappedBatters = true;
          }

          // Check chase won
          if (checkAndEndInnings(m, inn, ci, getLegalBallCount(inn.deliveries), milestones, null, set, get)) return;

          const situation = generateSituation(m);
          set({ match: m, lastCommentary: commentary, situationText: situation });
          return;
        }

        // For noball — update bowler + set free hit
        if (type === 'noball') {
          if (inn.currentBowler) {
            ensureBowler(inn, inn.currentBowler);
            inn.bowlers[inn.currentBowler].noballs += extraRuns;
            inn.bowlers[inn.currentBowler].runsConceded += delivery.runs;
          }
          if (inn.striker && batterRuns > 0) {
            ensureBatter(inn, inn.striker);
            const b = inn.batters[inn.striker];
            b.runs += batterRuns;
            b.balls++;
            if (batterRuns === 4) b.fours++;
            if (batterRuns === 6) b.sixes++;
          } else if (inn.striker) {
             ensureBatter(inn, inn.striker);
             inn.batters[inn.striker].balls++;
          }

          // Update partnership
          const partnership = getCurrentPartnership(inn);
          if (partnership) {
            partnership.runs += delivery.runs;
            partnership.balls++;
          }

          // Swap on odd batter runs (or odd extra runs? Usually batters swap based on total runs run)
          // If total runs is odd (excluding boundary), they swap. 
          // Note: If batter hits 4 or 6 off a no ball, they don't swap.
          if (batterRuns > 0 && batterRuns % 2 === 1 && batterRuns !== 5) {
             [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];
             delivery.swappedBatters = true;
          } else if (batterRuns === 0 && extraRuns > 1 && (extraRuns - 1) % 2 === 1) {
             // they ran byes off a no ball. extraRuns = 1 noball + X byes.
             // if X is odd, they swap.
             [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];
             delivery.swappedBatters = true;
          }

          // Check chase won
          if (checkAndEndInnings(m, inn, ci, getLegalBallCount(inn.deliveries), milestones, null, set, get)) return;

          const situation = generateSituation(m);
          set({ match: m, isFreeHit: m.settings.freeHitOnNoball, lastCommentary: commentary, situationText: situation });
          return;
        }

        // For penalty
        if (type === 'penalty') {
          const partnership = getCurrentPartnership(inn);
          if (partnership) {
            partnership.runs += delivery.runs;
          }

          if (checkAndEndInnings(m, inn, ci, getLegalBallCount(inn.deliveries), milestones, null, set, get)) return;

          const situation = generateSituation(m);
          set({ match: m, lastCommentary: commentary, situationText: situation });
        }
      },

      // ═══════════════════════════════════════
      //  SET LAST DELIVERY REGION
      // ═══════════════════════════════════════
      setLastDeliveryRegion: (region) => {
        const { match } = get();
        if (!match || match.complete) return;
        const m = structuredClone(match);
        const ci = m.currentInnings;
        const inn = m.innings[ci];
        
        if (inn.deliveries.length > 0) {
          inn.deliveries[inn.deliveries.length - 1].shotRegion = region;
          set({ match: m });
        }
      },

      // ═══════════════════════════════════════
      //  SUBMIT WICKET
      // ═══════════════════════════════════════
      submitWicket: (config) => {
        const { match } = get();
        if (!match || match.complete) return;
        const m = structuredClone(match);
        const ci = m.currentInnings;
        const inn = m.innings[ci];

        // Free hit check — only run out allowed
        if (get().isFreeHit && config.type !== 'Run Out') {
          return;
        }

        const legalBefore = getLegalBallCount(inn.deliveries);
        const currentOverNum = Math.floor(legalBefore / 6);
        const ballInOver = legalBefore % 6;

        const dismissedName = config.dismissedBatter === 'striker' ? inn.striker : inn.nonStriker;

        const delivery: Delivery = {
          id: Date.now(),
          runs: config.runsBeforeWicket,
          wide: false, noball: false,
          wicket: true,
          wktType: config.type,
          dismissedBatter: dismissedName,
          batter: inn.striker,
          bowler: inn.currentBowler,
          isFreeHit: false,
          isBye: false, isLegBye: false, isPenalty: false,
          boundaryOverthrow: 0,
          overNumber: currentOverNum,
          ballInOver: ballInOver + 1,
          timestamp: Date.now(),
          swappedBatters: false,
          wasEndOfOver: false,
          fielder: config.fielder,
          isTeamWicket: config.isTeamWicket,
        };

        inn.deliveries.push(delivery);
        inn.runs += config.runsBeforeWicket;

        const isRetirement = config.type === 'Retired Hurt' || config.type === 'Retired Out';

        if (!isRetirement) {
          inn.wickets++;
        }

        // Update batter stats — only count ball for striker
        if (inn.striker) {
          ensureBatter(inn, inn.striker);
          const b = inn.batters[inn.striker];
          b.runs += config.runsBeforeWicket;
          if (!isRetirement) b.balls++;
          if (config.runsBeforeWicket === 4) b.fours++;
          if (config.runsBeforeWicket === 6) b.sixes++;
        }

        // Mark dismissed batter
        if (dismissedName && inn.batters[dismissedName]) {
          if (isRetirement) {
            inn.batters[dismissedName].isRetired = true;
            inn.batters[dismissedName].retireType = config.type === 'Retired Hurt' ? 'hurt' : 'out';
            inn.batters[dismissedName].howOut = config.type;
          } else {
            inn.batters[dismissedName].howOut = config.type;
            inn.batters[dismissedName].bowlerName = inn.currentBowler;
            if (config.fielder) {
              inn.batters[dismissedName].fielderName = config.fielder;
            }
          }
        }

        // Update bowler stats
        if (inn.currentBowler && !isRetirement) {
          ensureBowler(inn, inn.currentBowler);
          const bw = inn.bowlers[inn.currentBowler];
          bw.runsConceded += config.runsBeforeWicket;
          bw.ballsBowled++;
          if (!config.isTeamWicket) {
            bw.wickets++;
          }
        }

        // Fall of wicket
        if (!isRetirement) {
          const legal = getLegalBallCount(inn.deliveries);
          inn.fallOfWickets.push({
            wicketNumber: inn.wickets,
            score: inn.runs,
            over: `${Math.floor(legal / 6)}.${legal % 6}`,
            batterName: dismissedName,
            dismissalType: config.type,
            bowlerName: inn.currentBowler,
          });
        }

        // End partnership
        const partnership = getCurrentPartnership(inn);
        if (partnership && !isRetirement) {
          partnership.endedBy = config.type;
          const legal = getLegalBallCount(inn.deliveries);
          partnership.overEnd = `${Math.floor(legal / 6)}.${legal % 6}`;
        }

        // Highlights
        m.highlights.push({
          type: 'wicket',
          description: `${config.type}! ${dismissedName} dismissed${inn.currentBowler ? ` by ${inn.currentBowler}` : ''}`,
          over: getOversString(inn.deliveries),
          innings: ci,
          timestamp: Date.now(),
        });

        // Check hat-trick
        const legalDeliveries = inn.deliveries.filter(d => !d.wide && !d.noball);
        const htBowler = checkHatTrick(legalDeliveries);
        const milestones = [...get().pendingMilestones];
        if (htBowler) {
          milestones.push({ message: `HAT-TRICK by ${htBowler}! 🎩`, emoji: '🎩' });
        }

        // Bowler milestones
        if (inn.currentBowler && inn.bowlers[inn.currentBowler] && config.type !== 'Run Out') {
          const prevW = inn.bowlers[inn.currentBowler].wickets - 1;
          const bm = checkBowlerMilestones(inn.bowlers[inn.currentBowler], prevW, inn.currentBowler);
          if (bm) milestones.push(bm);
        }

        // Swap on odd runs before wicket
        if (config.runsBeforeWicket % 2 === 1) {
          [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];
          delivery.swappedBatters = true;
        }

        // Clear dismissed batter position
        if (config.dismissedBatter === 'striker') {
          // After potential swap from odd runs, the dismissed was the original striker
          // If swapped happened, the original striker is now at nonStriker
          if (delivery.swappedBatters) {
            inn.nonStriker = '';
          } else {
            inn.striker = '';
          }
        } else {
          if (delivery.swappedBatters) {
            inn.striker = '';
          } else {
            inn.nonStriker = '';
          }
        }

        const commentary = generateCommentary(delivery, m);

        // Check end of over
        const legalAfter = getLegalBallCount(inn.deliveries);
        let endOfOver = false;
        if (legalAfter > 0 && legalAfter % 6 === 0 && legalAfter > legalBefore) {
          delivery.wasEndOfOver = true;
          endOfOver = true;
          [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];

          const overDeliveries = getCurrentOverDeliveries(inn.deliveries);
          const summary = buildOverSummary(overDeliveries, Math.floor(legalAfter / 6), inn.currentBowler);
          if (inn.currentBowler && inn.bowlers[inn.currentBowler]) {
            if (summary.isMaiden) inn.bowlers[inn.currentBowler].maidens++;
          }
          inn.overSummaries.push(summary);
          if (inn.currentBowler) finalizeBowlerOver(inn, inn.currentBowler);
        }

        if (checkAndEndInnings(m, inn, ci, legalAfter, milestones, null, set, get)) return;

        const situation = generateSituation(m);
        set({
          match: m,
          pendingMilestones: milestones,
          isFreeHit: false,
          showBatterSelect: !isRetirement,
          showBowlerSelect: endOfOver,
          lastCommentary: commentary,
          situationText: situation,
        });
      },

      // ═══════════════════════════════════════
      //  UNDO LAST BALL — Fixed over boundary handling
      // ═══════════════════════════════════════
      undoLastBall: () => {
        const { match } = get();
        if (!match) return false;
        const m = structuredClone(match);
        const ci = m.currentInnings;
        const inn = m.innings[ci];
        if (inn.deliveries.length === 0) return false;

        // If match was complete, reopen it
        if (m.complete) {
          m.complete = false;
          m.winner = '';
          m.margin = '';
        }

        const d = inn.deliveries.pop()!;

        // Reverse runs
        inn.runs -= d.runs;

        // Reverse extras
        if (d.wide) inn.extras.wide -= d.runs;
        if (d.noball) inn.extras.noball -= d.runs;
        if (d.isBye) inn.extras.byes -= d.runs;
        if (d.isLegBye) inn.extras.legByes -= d.runs;
        if (d.isPenalty) inn.extras.penalty -= d.runs;

        // Reverse wicket
        if (d.wicket) {
          const isRetirement = d.wktType === 'Retired Hurt' || d.wktType === 'Retired Out';
          if (!isRetirement) {
            inn.wickets--;
            if (inn.fallOfWickets.length > 0) inn.fallOfWickets.pop();
          }
          // Restore dismissed batter
          if (d.dismissedBatter) {
            if (inn.batters[d.dismissedBatter]) {
              inn.batters[d.dismissedBatter].howOut = '';
              inn.batters[d.dismissedBatter].bowlerName = '';
              inn.batters[d.dismissedBatter].fielderName = '';
              inn.batters[d.dismissedBatter].isRetired = false;
              inn.batters[d.dismissedBatter].retireType = undefined;
            }
          }
        }

        // IMPORTANT: Reverse swaps in the correct order
        // The forward order was: odd-run swap → end-of-over swap
        // So we reverse in opposite order: end-of-over swap → odd-run swap

        // 1. Reverse end-of-over swap first
        if (d.wasEndOfOver) {
          [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];
          // Remove last over summary
          if (inn.overSummaries.length > 0) inn.overSummaries.pop();
          // Restore bowler's over count
          if (d.bowler && inn.bowlers[d.bowler]) {
            inn.bowlers[d.bowler].overs = Math.max(0, inn.bowlers[d.bowler].overs - 1);
            // Restore ballsBowled to correct count from remaining deliveries
            const bowlerBallsThisOver = inn.deliveries.filter(
              dd => dd.bowler === d.bowler && !dd.wide && !dd.noball && dd.overNumber === d.overNumber
            ).length;
            inn.bowlers[d.bowler].ballsBowled = bowlerBallsThisOver;
            // Remove last spell entry or adjust
            const bw = inn.bowlers[d.bowler];
            if (bw.spells.length > 0) {
              const lastSpell = bw.spells[bw.spells.length - 1];
              if (lastSpell.overStart === lastSpell.overEnd) {
                bw.spells.pop();
              } else {
                lastSpell.overEnd--;
              }
            }
            bw.economy = bw.overs > 0 ? bw.runsConceded / bw.overs : 0;
          }
        }

        // 2. Reverse odd-run swap
        if (d.swappedBatters) {
          [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];
        }

        // 3. Restore dismissed batter to correct position (after undoing swaps)
        if (d.wicket && d.dismissedBatter) {
          if (!inn.striker) inn.striker = d.dismissedBatter;
          else if (!inn.nonStriker) inn.nonStriker = d.dismissedBatter;
        }

        // Reverse batter stats
        if (d.batter && inn.batters[d.batter] && !d.wide && !d.noball) {
          const b = inn.batters[d.batter];
          b.runs -= d.runs;
          b.balls--;
          if (d.runs === 0) b.dotBalls = Math.max(0, b.dotBalls - 1);
          if (d.runs === 4) b.fours = Math.max(0, b.fours - 1);
          if (d.runs === 6) b.sixes = Math.max(0, b.sixes - 1);
        }

        // Reverse bye/legbye batter ball count
        if (d.isBye || d.isLegBye) {
          if (d.batter && inn.batters[d.batter]) {
            inn.batters[d.batter].balls--;
            if (d.runs === 0) inn.batters[d.batter].dotBalls = Math.max(0, inn.batters[d.batter].dotBalls - 1);
          }
        }

        // Reverse bowler stats
        if (d.bowler && inn.bowlers[d.bowler]) {
          const bw = inn.bowlers[d.bowler];
          if (!d.wide && !d.noball && !d.wasEndOfOver) {
            bw.ballsBowled = Math.max(0, bw.ballsBowled - 1);
          }
          if (d.wide) { bw.wides--; bw.runsConceded -= d.runs; }
          if (d.noball) { bw.noballs--; bw.runsConceded -= d.runs; }
          if (!d.wide && !d.noball && !d.isBye && !d.isLegBye) bw.runsConceded -= d.runs;
          // Byes/legbyes: bowler stats already don't include these runs (bowler conceded 0 for byes)
          if (d.isBye || d.isLegBye) {
            if (!d.wasEndOfOver) bw.ballsBowled = Math.max(0, bw.ballsBowled - 1);
            if (d.runs === 0) bw.dotBalls = Math.max(0, bw.dotBalls - 1);
          }
          if (!d.wide && !d.noball && d.runs === 0 && !d.isBye && !d.isLegBye) bw.dotBalls = Math.max(0, bw.dotBalls - 1);
          if (d.wicket && d.wktType !== 'Run Out') bw.wickets = Math.max(0, bw.wickets - 1);
          if (d.runs === 4 && !d.isBye && !d.isLegBye) bw.foursConceded = Math.max(0, bw.foursConceded - 1);
          if (d.runs === 6 && !d.isBye && !d.isLegBye) bw.sixesConceded = Math.max(0, bw.sixesConceded - 1);
        }

        // Reverse partnership
        const pship = getCurrentPartnership(inn);
        if (pship) {
          pship.runs -= d.runs;
          if (!d.wide && !d.noball) pship.balls = Math.max(0, pship.balls - 1);
        }
        // Re-open ended partnership if wicket was undone
        if (d.wicket && inn.partnerships.length > 0) {
          const lastP = inn.partnerships[inn.partnerships.length - 1];
          if (lastP.endedBy) {
            lastP.endedBy = undefined;
            lastP.overEnd = '';
          }
        }

        // Re-evaluate free hit
        const isFreeHit = isNextFreeHit(inn.deliveries, m.settings.freeHitOnNoball);

        // Remove last highlight if it matches this delivery
        if (m.highlights.length > 0) {
          const lastH = m.highlights[m.highlights.length - 1];
          if (Math.abs(lastH.timestamp - d.timestamp) < 1000) {
            m.highlights.pop();
          }
        }

        const situation = inn.deliveries.length > 0 ? generateSituation(m) : '';
        set({ match: m, isFreeHit, showBowlerSelect: false, showBatterSelect: false, showOverSummary: false, situationText: situation });
        return true;
      },

      setStriker: (name) => {
        const { match } = get();
        if (!match) return;
        const m = structuredClone(match);
        const inn = m.innings[m.currentInnings];
        inn.striker = name;
        ensureBatter(inn, name);
        if (inn.striker && inn.nonStriker && !getCurrentPartnership(inn)) {
          startPartnership(inn);
        }
        set({ match: m });
      },

      setNonStriker: (name) => {
        const { match } = get();
        if (!match) return;
        const m = structuredClone(match);
        const inn = m.innings[m.currentInnings];
        inn.nonStriker = name;
        ensureBatter(inn, name);
        if (inn.striker && inn.nonStriker && !getCurrentPartnership(inn)) {
          startPartnership(inn);
        }
        set({ match: m });
      },

      setBowler: (name) => {
        const { match } = get();
        if (!match) return;
        const m = structuredClone(match);
        const inn = m.innings[m.currentInnings];
        inn.currentBowler = name;
        ensureBowler(inn, name);
        set({ match: m, showBowlerSelect: false });
      },

      swapBatters: () => {
        const { match } = get();
        if (!match) return;
        const m = structuredClone(match);
        const inn = m.innings[m.currentInnings];
        [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];
        set({ match: m });
      },

      retireBatter: (type) => {
        const { match } = get();
        if (!match) return;
        get().submitWicket({
          type: type === 'hurt' ? 'Retired Hurt' : 'Retired Out',
          dismissedBatter: 'striker',
          runsBeforeWicket: 0,
        });
      },

      endInnings: () => {
        const { match } = get();
        if (!match) return;
        const m = structuredClone(match);
        const ci = m.currentInnings;

        if (ci === 0) {
          m.currentInnings = 1;
          m.innings[1] = createBlankInnings();
          set({ match: m, isFreeHit: false, showBowlerSelect: false, showBatterSelect: false, showOverSummary: false, showInningsBreak: true });
        } else {
          // 2nd innings done — declare winner
          const i1 = m.innings[0];
          const i2 = m.innings[1];

          if (i2.runs > i1.runs) {
            const wktsLeft = m.settings.maxWickets - i2.wickets;
            m.winner = m.teams[1];
            m.margin = `by ${wktsLeft} wicket${wktsLeft !== 1 ? 's' : ''}`;
          } else if (i1.runs > i2.runs) {
            const diff = i1.runs - i2.runs;
            m.winner = m.teams[0];
            m.margin = `by ${diff} run${diff !== 1 ? 's' : ''}`;
          } else {
            m.winner = 'Match tied';
            m.margin = '';
          }
          m.complete = true;
          
          // Ingest into global stats
          useStatsStore.getState().ingestMatch(m);

          set({ match: m, isFreeHit: false });
        }
      },

      abandonMatch: () => {
        const { match } = get();
        if (!match) return;
        const m = structuredClone(match);
        m.isAbandoned = true;
        m.complete = true;
        m.winner = 'Abandoned';
        set({ match: m });
      },

      startSuperOver: () => {
        const { match } = get();
        if (!match || !match.complete || match.winner !== 'Match tied') return;
        // Create a new super over match with 1 over, 2 wickets
        const soSettings: MatchSettings = {
          ...match.settings,
          overs: 1,
          maxWickets: 2,
          powerplayOvers: 0,
          maxOversPerBowler: 1,
        };
        const soMatch = createBlankMatch(
          match.teams[0], match.teams[1],
          match.players[0], match.players[1],
          soSettings,
          match.teams[1], 'bat', // loser of toss usually bats first in SO, but here team 2 bats
          match.teamColors,
          match.venue, match.weather,
          'superover', match.pitchCondition,
        );
        soMatch.isSuperOver = true;
        soMatch.parentMatchId = match.id;
        set({ match: soMatch, isFreeHit: false, pendingMilestones: [], lastOverSummary: null });
      },

      setManOfTheMatch: (name) => {
        const { match } = get();
        if (!match) return;
        const m = structuredClone(match);
        m.manOfTheMatch = name;
        set({ match: m });
      },

      addNote: (note) => {
        const { match } = get();
        if (!match) return;
        const m = structuredClone(match);
        m.notes = note;
        set({ match: m });
      },

      clearMilestones: () => set({ pendingMilestones: [] }),
      dismissOverSummary: () => set({ showOverSummary: false, lastOverSummary: null }),
      dismissBowlerSelect: () => set({ showBowlerSelect: false }),
      dismissBatterSelect: () => set({ showBatterSelect: false }),
      dismissInningsBreak: () => set({ showInningsBreak: false }),
    }),
    {
      name: 'cricket-active-match',
      storage: idbPersistStorage,
      partialize: (state) => ({
        match: state.match,
        isFreeHit: state.isFreeHit,
      }),
    }
  )
);
