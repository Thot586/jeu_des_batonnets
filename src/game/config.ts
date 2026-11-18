import { AVATAR_IDS } from './avatars';
import { STICKS_MAX, STICKS_MIN, TAKE_OPTIONS } from './rules';
import type { MatchConfig, PlayerConfig } from './types';

export const NAME_MAX_LENGTH = 14;

export const DEFAULT_CONFIG: MatchConfig = {
  players: [
    { name: 'Joueur 1', avatar: 'pepin', kind: 'human' },
    { name: 'Ordi', avatar: 'mousse', kind: 'ai' },
  ],
  settings: {
    totalSticks: 20,
    maxTake: 3,
    lastStick: 'perd',
    starter: 0,
    difficulty: 'malin',
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isPlayer = (value: unknown): value is PlayerConfig =>
  isRecord(value) &&
  typeof value.name === 'string' &&
  AVATAR_IDS.some((id) => id === value.avatar) &&
  (value.kind === 'human' || value.kind === 'ai');

/** Vérifie une configuration relue depuis le stockage local (elle peut dater d'une ancienne version). */
export const isMatchConfig = (value: unknown): value is MatchConfig => {
  if (!isRecord(value) || !Array.isArray(value.players) || !isRecord(value.settings)) return false;
  const [first, second] = value.players as unknown[];
  const s = value.settings;
  return (
    value.players.length === 2 &&
    isPlayer(first) &&
    isPlayer(second) &&
    typeof s.totalSticks === 'number' &&
    s.totalSticks >= STICKS_MIN &&
    s.totalSticks <= STICKS_MAX &&
    TAKE_OPTIONS.some((n) => n === s.maxTake) &&
    (s.lastStick === 'perd' || s.lastStick === 'gagne') &&
    (s.starter === 0 || s.starter === 1 || s.starter === 'hasard') &&
    (s.difficulty === 'facile' || s.difficulty === 'malin' || s.difficulty === 'expert')
  );
};

export type NameErrors = [string | null, string | null];

export const validateNames = (players: [PlayerConfig, PlayerConfig]): NameErrors => {
  const names = players.map((p) => p.name.trim());
  return names.map((name, index) => {
    if (name.length === 0) return 'Choisissez un pseudo.';
    if (name.length > NAME_MAX_LENGTH) return `${NAME_MAX_LENGTH} caractères au maximum.`;
    if (index === 1 && name.toLocaleLowerCase('fr') === names[0].toLocaleLowerCase('fr')) {
      return "Ce pseudo est déjà celui de l'autre joueur.";
    }
    return null;
  }) as NameErrors;
};
