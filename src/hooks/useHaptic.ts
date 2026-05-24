import { useCallback } from 'react';
import { useAppStore } from '../store/appStore';

export function useHaptic() {
  const enabled = useAppStore((s) => s.settings.hapticEnabled);

  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (enabled && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    },
    [enabled]
  );

  return {
    tap: () => vibrate(30),
    boundary: () => vibrate(80),
    six: () => vibrate([50, 30, 80]),
    wicket: () => vibrate([100, 50, 100]),
    celebration: () => vibrate([50, 30, 50, 30, 100]),
  };
}
