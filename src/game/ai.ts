import type { Difficulty, LastStickRule } from './types';

/**
 * Coup gagnant, s'il existe.
 *
 * Avec une prise de 1 à k bâtonnets, les positions perdantes pour celui qui doit jouer
 * reviennent toutes les k + 1 cases :
 * - si le dernier bâtonnet fait perdre : quand il en reste 1, k + 2, 2k + 3...
 *   (reste - 1 multiple de k + 1)
 * - si le dernier bâtonnet fait gagner : quand le reste est un multiple de k + 1.
 *
 * Le bon coup consiste à laisser l'adversaire sur une de ces positions.
 * Renvoie null quand on est soi-même sur une position perdante.
 */
export const winningTake = (
  remaining: number,
  maxTake: number,
  lastStick: LastStickRule,
): number | null => {
  const period = maxTake + 1;
  const take = lastStick === 'perd' ? (remaining - 1) % period : remaining % period;
  return take === 0 ? null : take;
};

/** Probabilité de jouer le coup parfait, selon le niveau. */
const SKILL: Record<Difficulty, number> = {
  facile: 0.25,
  malin: 0.7,
  expert: 1,
};

export interface AiInput {
  remaining: number;
  maxTake: number;
  lastStick: LastStickRule;
  difficulty: Difficulty;
  random?: () => number;
}

export const chooseAiMove = ({
  remaining,
  maxTake,
  lastStick,
  difficulty,
  random = Math.random,
}: AiInput): number => {
  const best = winningTake(remaining, maxTake, lastStick);
  if (best !== null && random() < SKILL[difficulty]) return best;

  // Coup au hasard, sans se jeter dans le piège évident :
  // quand le dernier bâtonnet fait perdre, on évite de tout ramasser s'il reste un autre choix.
  let max = Math.min(maxTake, remaining);
  if (lastStick === 'perd' && max === remaining && remaining > 1) max -= 1;
  return 1 + Math.floor(random() * max);
};
