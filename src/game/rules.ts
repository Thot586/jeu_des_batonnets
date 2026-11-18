import type { GameSettings, GameState, LastStickRule, PlayerId } from './types';

export const STICKS_MIN = 7;
export const STICKS_MAX = 31;
export const TAKE_OPTIONS = [2, 3, 4] as const;

export const otherPlayer = (player: PlayerId): PlayerId => (player === 0 ? 1 : 0);

export const createGame = (totalSticks: number, firstPlayer: PlayerId): GameState => ({
  remaining: totalSticks,
  current: firstPlayer,
  taken: [0, 0],
  history: [],
  winner: null,
});

/** Plus grand nombre de bâtonnets qu'on peut prendre maintenant. */
export const maxPickable = (state: GameState, maxTake: number): number =>
  state.winner === null ? Math.min(maxTake, state.remaining) : 0;

export const isLegalMove = (state: GameState, count: number, maxTake: number): boolean =>
  Number.isInteger(count) && count >= 1 && count <= maxPickable(state, maxTake);

/**
 * Applique un coup. Un coup illégal laisse l'état inchangé :
 * l'interface ne propose que des coups légaux, ce garde-fou protège le reste.
 */
export const applyMove = (
  state: GameState,
  count: number,
  rules: { maxTake: number; lastStick: LastStickRule },
): GameState => {
  if (!isLegalMove(state, count, rules.maxTake)) return state;

  const mover = state.current;
  const remaining = state.remaining - count;
  const taken: [number, number] = [...state.taken];
  taken[mover] += count;

  const winner =
    remaining === 0 ? (rules.lastStick === 'perd' ? otherPlayer(mover) : mover) : null;

  return {
    remaining,
    taken,
    current: winner === null ? otherPlayer(mover) : mover,
    history: [...state.history, { player: mover, count }],
    winner,
  };
};

/** "1", "1 ou 2", "1, 2 ou 3"... */
export const formatChoices = (max: number): string => {
  const values = Array.from({ length: max }, (_, i) => String(i + 1));
  if (values.length <= 1) return values.join('');
  return `${values.slice(0, -1).join(', ')} ou ${values[values.length - 1]}`;
};

export const plural = (count: number, singular: string, pluralForm = `${singular}s`): string =>
  `${count} ${count > 1 ? pluralForm : singular}`;

export const describeRules = (settings: Pick<GameSettings, 'maxTake' | 'lastStick'>): string =>
  `Chacun son tour, on prend de 1 à ${settings.maxTake} bâtonnets. ` +
  (settings.lastStick === 'perd'
    ? 'Celui qui prend le dernier a perdu.'
    : 'Celui qui prend le dernier a gagné.');
