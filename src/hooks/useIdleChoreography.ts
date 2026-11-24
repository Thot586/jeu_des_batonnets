import { useEffect, useState } from 'react';
import type { Gesture } from '../components/Character/Character';
import type { PlayerId } from '../game/types';

const FRAME = 1000 / 12;
/** Sans rien faire pendant 8 s, le personnage s'occupe (son tic) ; à 15 s, il bâille. */
const FIDGET_AFTER = 8000;
const YAWN_AFTER = 15000;
/** Puis la petite scène recommence, tant que personne ne bouge. */
const REPEAT_EVERY = 26000;
const FIDGET_MS = 16 * FRAME;
const YAWN_MS = 22 * FRAME;
/** Le bâillement est parfois contagieux : l'autre bâille un peu après. */
const ECHO_DELAY = 1300;
const ECHO_CHANCE = 0.6;

type Gestures = [Gesture | null, Gesture | null];

/**
 * Petite vie des personnages pendant l'attente. Tout mouvement de souris, toucher
 * ou touche du clavier remet le compteur à zéro.
 */
export const useIdleChoreography = (active: boolean, actor: PlayerId): Gestures => {
  const [gestures, setGestures] = useState<Gestures>([null, null]);

  useEffect(() => {
    if (!active) {
      setGestures([null, null]);
      return;
    }

    const other: PlayerId = actor === 0 ? 1 : 0;
    let timers: number[] = [];
    let lastReset = 0;

    const set = (who: PlayerId, gesture: Gesture | null) =>
      setGestures((current) => {
        const next: Gestures = [...current];
        next[who] = gesture;
        return next;
      });

    const at = (ms: number, run: () => void) => timers.push(window.setTimeout(run, ms));

    const schedule = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [];
      setGestures([null, null]);
      at(FIDGET_AFTER, () => set(actor, 'fidget'));
      at(FIDGET_AFTER + FIDGET_MS, () => set(actor, null));
      at(YAWN_AFTER, () => set(actor, 'yawn'));
      at(YAWN_AFTER + YAWN_MS, () => set(actor, null));
      if (Math.random() < ECHO_CHANCE) {
        at(YAWN_AFTER + ECHO_DELAY, () => set(other, 'yawn'));
        at(YAWN_AFTER + ECHO_DELAY + YAWN_MS, () => set(other, null));
      }
      at(REPEAT_EVERY, schedule);
    };

    const onActivity = () => {
      const now = performance.now();
      if (now - lastReset < 400) return;
      lastReset = now;
      schedule();
    };

    schedule();
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel'] as const;
    events.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      events.forEach((name) => window.removeEventListener(name, onActivity));
    };
  }, [active, actor]);

  return gestures;
};
