import { useEffect } from 'react';
import { useMatchStore } from '../store/matchStore';

const KEY_MAP: Record<string, () => void> = {};

export function useKeyboard() {
  const addRun = useMatchStore((s) => s.addRun);
  const addExtra = useMatchStore((s) => s.addExtra);
  const undoLastBall = useMatchStore((s) => s.undoLastBall);
  const swapBatters = useMatchStore((s) => s.swapBatters);
  const match = useMatchStore((s) => s.match);

  useEffect(() => {
    if (!match) return;

    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case '0': addRun(0); break;
        case '1': addRun(1); break;
        case '2': addRun(2); break;
        case '3': addRun(3); break;
        case '4': addRun(4); break;
        case '5': addRun(5); break;
        case '6': addRun(6); break;
        case 'w': addExtra('wide'); break;
        case 'n': addExtra('noball'); break;
        case 'u': undoLastBall(); break;
        case 's': swapBatters(); break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [match, addRun, addExtra, undoLastBall, swapBatters]);
}
