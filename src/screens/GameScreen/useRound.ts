import { useCallback, useEffect, useState } from 'react';
import { chooseAiMove } from '../../game/ai';
import { getPersonality } from '../../game/personalities';
import { applyMove, createGame, isLegalMove } from '../../game/rules';
import type { MatchConfig, PlayerId } from '../../game/types';
import { usePageVisible } from '../../hooks/usePageVisible';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export interface PendingMove {
  player: PlayerId;
  count: number;
  /** "reach" : le personnage tend le bras ; "pull" : il tire les bâtonnets vers lui. */
  stage: 'reach' | 'pull';
}

/** Durées en millisecondes de chaque étape d'un coup. */
export interface Timing {
  reach: number;
  pull: number;
  think: number;
  thinkJitter: number;
  result: number;
}

// Durées calées sur le stop motion : 1 image = 1/12 s (tendre le bras : 5 images, tirer : 8 images).
const FRAME = 1000 / 12;
const NORMAL: Timing = { reach: 5 * FRAME, pull: 8 * FRAME, think: 10 * FRAME, thinkJitter: 6 * FRAME, result: 8 * FRAME };
const REDUCED: Timing = { reach: 120, pull: 160, think: 450, thinkJitter: 0, result: 250 };

/**
 * Déroulé d'une manche : état du jeu, coup en cours d'animation et tour de l'ordinateur.
 * Un coup n'est appliqué à l'état qu'une fois l'animation de tirage terminée.
 */
export const useRound = (config: MatchConfig, firstPlayer: PlayerId) => {
  const { settings, players } = config;
  const reducedMotion = usePrefersReducedMotion();
  const timing = reducedMotion ? REDUCED : NORMAL;
  const pageVisible = usePageVisible();

  const [game, setGame] = useState(() => createGame(settings.totalSticks, firstPlayer));
  const [pending, setPending] = useState<PendingMove | null>(null);

  const isOver = game.winner !== null;
  const currentKind = players[game.current].kind;
  // L'ordinateur ne joue pas pendant que l'onglet est caché : on ne rate jamais son coup.
  const isAiThinking = !isOver && pending === null && currentKind === 'ai' && pageVisible;
  const canHumanPlay = !isOver && pending === null && currentKind === 'human';

  const play = useCallback(
    (count: number) => {
      if (!canHumanPlay || !isLegalMove(game, count, settings.maxTake)) return;
      setPending({ player: game.current, count, stage: 'reach' });
    },
    [canHumanPlay, game, settings.maxTake],
  );

  // Tour de l'ordinateur : il « réfléchit » un instant, puis choisit son coup.
  useEffect(() => {
    if (!isAiThinking) return;
    const delay = timing.think + Math.random() * timing.thinkJitter;
    const id = window.setTimeout(() => {
      const count = chooseAiMove({
        remaining: game.remaining,
        maxTake: settings.maxTake,
        lastStick: settings.lastStick,
        difficulty: settings.difficulty,
      });
      setPending({ player: game.current, count, stage: 'reach' });
    }, delay);
    return () => window.clearTimeout(id);
  }, [isAiThinking, game, settings, timing]);

  // Enchaînement des étapes : tendre le bras, tirer, puis appliquer le coup.
  useEffect(() => {
    if (pending === null) return;

    if (pending.stage === 'reach') {
      // Chaque personnage tend le bras à son rythme (Bleuet hésite, Pépin est vif).
      const reach = reducedMotion
        ? timing.reach
        : getPersonality(players[pending.player].avatar).reachFrames * FRAME;
      const id = window.setTimeout(() => setPending({ ...pending, stage: 'pull' }), reach);
      return () => window.clearTimeout(id);
    }

    const id = window.setTimeout(() => {
      setGame((current) => applyMove(current, pending.count, settings));
      setPending(null);
    }, timing.pull);
    return () => window.clearTimeout(id);
  }, [pending, settings, timing, players, reducedMotion]);

  return { game, pending, isAiThinking, canHumanPlay, play, timing };
};
