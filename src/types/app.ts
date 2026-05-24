// ═══════════════════════════════════════════════════════
//  APP UI TYPES — v3.0
// ═══════════════════════════════════════════════════════

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'danger' | 'info' | 'warning' | 'celebration';
  duration?: number;
}

export type ModalType =
  | 'wicket'
  | 'result'
  | 'scorecard'
  | 'bowlerSelect'
  | 'batterSelect'
  | 'overSummary'
  | 'settings'
  | 'help'
  | 'retire'
  | 'superOver'
  | 'confirm'
  | 'resume'
  | 'endInnings'
  | 'historyScorecardView'
  | null;

export type ThemeMode = 'dark' | 'light' | 'system' | 'dark-green' | 'dark-navy' | 'high-contrast';

export type BallType = 'leather' | 'tennis' | 'rubber';

export type FontSize = 'small' | 'medium' | 'large';

export type SoundTheme = 'stadium' | 'backyard' | 'silent';

export interface AppSettings {
  theme: ThemeMode;
  colorAccent: 'gold' | 'green' | 'blue' | 'purple' | 'red';
  soundEnabled: boolean;
  hapticEnabled: boolean;
  autoPlayCelebrations: boolean;
  autoShowOverSummary: boolean;
  fontSize: FontSize;
  ballType: BallType;
  soundTheme: SoundTheme;
  showCommentary: boolean;
  landscapePrompted: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark',
  colorAccent: 'gold',
  soundEnabled: true,
  hapticEnabled: true,
  autoPlayCelebrations: true,
  autoShowOverSummary: true,
  fontSize: 'medium',
  ballType: 'leather',
  soundTheme: 'stadium',
  showCommentary: true,
  landscapePrompted: false,
};
