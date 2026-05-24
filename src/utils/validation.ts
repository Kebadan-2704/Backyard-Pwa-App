// ═══════════════════════════════════════════════════════
//  INPUT VALIDATION & SANITIZATION
// ═══════════════════════════════════════════════════════

import type { MatchSettings } from '../types/cricket';

/** Strip HTML tags and dangerous characters from names */
export function sanitizeName(name: string): string {
  return name
    .replace(/<[^>]*>/g, '')
    .replace(/[&<>"'`]/g, '')
    .trim()
    .slice(0, 30);
}

/** Validate match configuration before starting */
export function validateMatchConfig(config: {
  team1: string;
  team2: string;
  settings: MatchSettings;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.team1.trim()) errors.push('Team 1 name is required');
  if (!config.team2.trim()) errors.push('Team 2 name is required');
  if (config.team1.trim().toLowerCase() === config.team2.trim().toLowerCase()) {
    errors.push('Teams must have different names');
  }
  if (config.settings.overs < 1 || config.settings.overs > 50) {
    errors.push('Overs must be between 1 and 50');
  }
  if (config.settings.maxWickets < 1 || config.settings.maxWickets > 11) {
    errors.push('Wickets must be between 1 and 11');
  }

  return { valid: errors.length === 0, errors };
}

/** Check if two batter selections are the same */
export function isDuplicateBatter(striker: string, nonStriker: string): boolean {
  return !!striker && !!nonStriker && striker === nonStriker;
}

/** Check if a player name is already used in the current batting lineup */
export function isPlayerAlreadyBatting(
  name: string,
  striker: string,
  nonStriker: string
): boolean {
  return name === striker || name === nonStriker;
}
