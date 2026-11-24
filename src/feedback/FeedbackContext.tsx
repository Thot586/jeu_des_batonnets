import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { playSound, unlockAudio, type SoundName, type SoundOptions } from './sound';

export type HapticName = 'tap' | 'pick' | 'win' | 'lose';

/**
 * Motifs de vibration (Android ; ignorés ailleurs). Une seule vibration par action validée.
 * - pick : une impulsion par bâtonnet pris, pour sentir combien on en a tiré ;
 * - lose : une seule impulsion courte, jamais plus forte qu'une victoire (on ne punit pas).
 */
const HAPTICS: Record<HapticName, (count: number) => number | number[]> = {
  tap: () => 8,
  pick: (count) => Array.from({ length: Math.max(1, Math.min(count, 4)) * 2 - 1 }, (_, i) => (i % 2 === 0 ? 12 : 45)),
  win: () => [30, 60, 30, 60, 60],
  lose: () => 24,
};

interface Feedback {
  /** Son et vibrations activés. */
  enabled: boolean;
  toggle: () => void;
  play: (name: SoundName, options?: SoundOptions) => void;
  /** `count` : nombre de bâtonnets, pour la vibration « pick ». */
  buzz: (name: HapticName, count?: number) => void;
}

const FeedbackContext = createContext<Feedback | null>(null);

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

/** Son et vibrations, avec un seul réglage mémorisé pour les deux. */
export const FeedbackProvider = ({ children }: { children: ReactNode }) => {
  const [enabled, setEnabled] = useLocalStorage<boolean>('batonnets:son', true, isBoolean);

  // Le navigateur n'autorise le son qu'après un premier geste : on attend le premier toucher ou la première touche.
  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const play = useCallback(
    (name: SoundName, options?: SoundOptions) => {
      if (enabled) playSound(name, options);
    },
    [enabled],
  );

  const buzz = useCallback(
    (name: HapticName, count = 1) => {
      if (!enabled || typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
      try {
        navigator.vibrate(HAPTICS[name](count));
      } catch {
        // Certains navigateurs refusent la vibration hors geste : sans conséquence.
      }
    },
    [enabled],
  );

  const toggle = useCallback(() => {
    if (!enabled) {
      unlockAudio();
      playSound('select');
    }
    setEnabled(!enabled);
  }, [enabled, setEnabled]);

  const value = useMemo(() => ({ enabled, toggle, play, buzz }), [enabled, toggle, play, buzz]);

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
};

export const useFeedback = (): Feedback => {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error('useFeedback doit être utilisé dans <FeedbackProvider>.');
  return value;
};
