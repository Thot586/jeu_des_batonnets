import type { AvatarId } from './types';

export interface Avatar {
  id: AvatarId;
  name: string;
  /** Papier du corps (gouache). */
  color: string;
  /** Teinte plus sombre : bras, cheveux. */
  shade: string;
  /** Papier clair : ventre. */
  belly: string;
  /** Papier de l'accessoire (bonnet, nœud...). */
  accent: string;
  /** Graine de découpe : chaque marionnette a ses propres irrégularités. */
  seed: number;
}

export const AVATARS: readonly Avatar[] = [
  { id: 'pepin', name: 'Pépin', color: '#e2412b', shade: '#a92d1c', belly: '#f6c9a9', accent: '#2b3a9e', seed: 11 },
  { id: 'mousse', name: 'Mousse', color: '#3f9a84', shade: '#2a6f5f', belly: '#c3e8dc', accent: '#f2a71b', seed: 23 },
  { id: 'zeste', name: 'Zeste', color: '#f2a71b', shade: '#b97a08', belly: '#fbe6ad', accent: '#e2412b', seed: 37 },
  { id: 'bleuet', name: 'Bleuet', color: '#2b3a9e', shade: '#1b246b', belly: '#bfc8f1', accent: '#2a1f17', seed: 41 },
  { id: 'praline', name: 'Praline', color: '#ee8fa8', shade: '#c25c79', belly: '#fbdbe3', accent: '#2b3a9e', seed: 53 },
];

export const AVATAR_IDS = AVATARS.map((avatar) => avatar.id);

export const getAvatar = (id: AvatarId): Avatar =>
  AVATARS.find((avatar) => avatar.id === id) ?? AVATARS[0];
