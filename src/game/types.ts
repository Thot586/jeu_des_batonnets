/** Index d'un joueur : 0 à gauche, 1 à droite. */
export type PlayerId = 0 | 1;

export type PlayerKind = 'human' | 'ai';

export type Difficulty = 'facile' | 'malin' | 'expert';

/** Ce que provoque le fait de prendre le dernier bâtonnet. */
export type LastStickRule = 'perd' | 'gagne';

export type Starter = PlayerId | 'hasard';

export type AvatarId = 'pepin' | 'mousse' | 'zeste' | 'bleuet' | 'praline';

export interface PlayerConfig {
  name: string;
  avatar: AvatarId;
  kind: PlayerKind;
}

export interface GameSettings {
  totalSticks: number;
  maxTake: number;
  lastStick: LastStickRule;
  starter: Starter;
  /** Niveau de l'ordinateur, utilisé seulement si un joueur est l'ordinateur. */
  difficulty: Difficulty;
}

export interface MatchConfig {
  players: [PlayerConfig, PlayerConfig];
  settings: GameSettings;
}

export interface Move {
  player: PlayerId;
  count: number;
}

export interface GameState {
  remaining: number;
  current: PlayerId;
  /** Nombre de bâtonnets ramassés par chaque joueur pendant la manche. */
  taken: [number, number];
  history: Move[];
  winner: PlayerId | null;
}

export type Scores = [number, number];
