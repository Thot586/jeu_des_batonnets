import { useCallback, useEffect, useState } from 'react';
import { chooseAiMove } from '../../game/ai';
import { getPersonality } from '../../game/personalities';
import { applyMove, createGame, isLegalMove } from '../../game/rules';
import type { MatchConfig, PlayerId } from '../../game/types';
import { usePageVisible } from '../../hooks/usePageVisible';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

/**
 * Les étapes d'un coup, dans l'ordre, pour que le trajet des bâtonnets soit vraisemblable :
 * - reach : le personnage tend le bras vers la table ; les bâtonnets choisis s'en soulèvent ;
 * - fly : ils volent de leur place sur la table jusque dans sa main tendue ;
 * - pull : il les tient et ramène le bras vers lui ;
 * - stow : il les range dans sa pile ; le coup est appliqué quand ils y arrivent.
 */
export type MoveStage = 'reach' | 'fly' | 'pull' | 'stow';

export interface PendingMove {
  player: PlayerId;
  count: number;
  stage: MoveStage;
}

/** Durées en millisecondes de chaque étape d'un coup. */
export interface Timing {
  reach: number;
  fly: number;
  pull: number;
  stow: number;
  think: number;
  thinkJitter: number;
  result: number;
}

// Durées calées sur le stop motion : 1 image = 1/12 s.
// Vol : 5 images ; bras ramené : 4 images de geste + 1 tenue ; rangement : 4 images.
export const FRAME = 1000 / 12;
const NORMAL: Timing = {
  reach: 5 * FRAME,
  fly: 5 * FRAME,
  pull: 5 * FRAME,
  stow: 4 * FRAME,
  think: 10 * FRAME,
  thinkJitter: 6 * FRAME,
  result: 8 * FRAME,
};
// Mouvement réduit : pas de vol, les bâtonnets passent directement de la table à la main, puis à la pile.
const REDUCED: Timing = { reach: 120, fly: 0, pull: 220, stow: 0, think: 450, thinkJitter: 0, result: 250 };

const NEXT: Record<MoveStage, MoveStage | null> = { reach: 'fly', fly: 'pull', pull: 'stow', stow: null };

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

  // Enchaînement des étapes : tendre le bras, attraper, ramener, ranger, puis appliquer le coup.
  useEffect(() => {
    if (pending === null) return;

    // Chaque personnage tend le bras à son rythme (Bleuet hésite, Pépin est vif).
    const duration =
      pending.stage === 'reach' && !reducedMotion
        ? getPersonality(players[pending.player].avatar).reachFrames * FRAME
        : timing[pending.stage];
    const next = NEXT[pending.stage];

    const id = window.setTimeout(() => {
      if (next) {
        setPending({ ...pending, stage: next });
        return;
      }
      setGame((current) => applyMove(current, pending.count, settings));
      setPending(null);
    }, duration);
    return () => window.clearTimeout(id);
  }, [pending, settings, timing, players, reducedMotion]);

  return { game, pending, isAiThinking, canHumanPlay, play, timing };
};
