import { useEffect, useState } from 'react';
import type { Gesture } from '../components/Character/Character';
import { getPersonality } from '../game/personalities';
import type { AvatarId, PlayerId } from '../game/types';

const FRAME = 1000 / 12;
/** Durée du tic (tous les tics tiennent en 16 images). */
const FIDGET_MS = 16 * FRAME;

/** Un nombre au hasard entre deux bornes, en millisecondes. */
const between = (min: number, max: number): number => min + Math.random() * (max - min);

type Gestures = [Gesture | null, Gesture | null];

/**
 * Petite vie des personnages pendant l'attente. Rien n'arrive à heure fixe :
 * - vers 8 à 10 s, celui qui attend son joueur s'occupe (son tic) ;
 * - l'autre a parfois son propre tic, à un autre moment ;
 * - vers 15 à 19 s, le premier bâille, à son rythme (Mousse lentement, Zeste vite) ;
 * - le bâillement est parfois contagieux : l'autre bâille aussi, mais seulement
 *   après avoir vu le premier finir, comme dans la vraie vie ;
 * - puis la scène recommence, et ce n'est pas toujours le même qui commence.
 * Tout mouvement de souris, toucher ou touche du clavier remet le compteur à zéro.
 */
export const useIdleChoreography = (
  active: boolean,
  actor: PlayerId,
  avatars: readonly [AvatarId, AvatarId],
): Gestures => {
  const [gestures, setGestures] = useState<Gestures>([null, null]);
  const [left, right] = avatars;

  useEffect(() => {
    if (!active) {
      setGestures([null, null]);
      return;
    }

    const yawnMs = (who: PlayerId) => getPersonality(who === 0 ? left : right).yawnFrames * FRAME;
    let timers: number[] = [];
    let lastReset = 0;
    let cycle = 0;

    const set = (who: PlayerId, gesture: Gesture | null) =>
      setGestures((current) => {
        const next: Gestures = [...current];
        next[who] = gesture;
        return next;
      });

    const at = (ms: number, run: () => void) => timers.push(window.setTimeout(run, ms));
    const play = (who: PlayerId, gesture: Gesture, start: number, duration: number) => {
      at(start, () => set(who, gesture));
      at(start + duration, () => set(who, null));
      return start + duration;
    };

    const schedule = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [];
      setGestures([null, null]);

      // Au premier tour, c'est celui dont c'est le tour qui s'ennuie ; ensuite, un peu au hasard.
      const lead: PlayerId = cycle === 0 || Math.random() < 0.65 ? actor : actor === 0 ? 1 : 0;
      const other: PlayerId = lead === 0 ? 1 : 0;
      cycle += 1;

      const fidgetAt = between(7500, 10000);
      play(lead, 'fidget', fidgetAt, FIDGET_MS);

      const yawnAt = between(15000, 19000);
      const yawnEnd = play(lead, 'yawn', yawnAt, yawnMs(lead));

      // L'autre a son propre tic, jamais en même temps que le premier.
      if (Math.random() < 0.5) {
        const ownFidget = between(fidgetAt + FIDGET_MS + 1500, yawnAt - FIDGET_MS - 800);
        if (ownFidget > fidgetAt + FIDGET_MS) play(other, 'fidget', ownFidget, FIDGET_MS);
      }

      // Bâillement contagieux : il commence une fois le premier fini, après un temps de réaction.
      let lastEnd = yawnEnd;
      if (Math.random() < 0.55) {
        lastEnd = play(other, 'yawn', yawnEnd + between(900, 2600), yawnMs(other));
      }

      at(lastEnd + between(8000, 13000), schedule);
    };

    const onActivity = () => {
      const now = performance.now();
      if (now - lastReset < 400) return;
      lastReset = now;
      cycle = 0;
      schedule();
    };

    schedule();
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel'] as const;
    events.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      events.forEach((name) => window.removeEventListener(name, onActivity));
    };
  }, [active, actor, left, right]);

  return gestures;
};
