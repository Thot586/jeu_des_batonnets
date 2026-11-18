import type { AvatarId } from './types';

export interface Avatar {
  id: AvatarId;
  name: string;
  /** Couleur du corps. */
  color: string;
  /** Teinte plus sombre : bras, contours. */
  shade: string;
  /** Teinte claire : ventre. */
  belly: string;
}

export const AVATARS: readonly Avatar[] = [
  { id: 'pepin', name: 'Pépin', color: '#ff8a3d', shade: '#d6601b', belly: '#ffd2ad' },
  { id: 'mousse', name: 'Mousse', color: '#22c3a6', shade: '#128c76', belly: '#bdf1e6' },
  { id: 'zeste', name: 'Zeste', color: '#ffc93c', shade: '#d3940c', belly: '#fff1c4' },
  { id: 'bleuet', name: 'Bleuet', color: '#4d7cfe', shade: '#2b52c9', belly: '#cddaff' },
  { id: 'praline', name: 'Praline', color: '#ff6fb5', shade: '#d33f87', belly: '#ffd5e9' },
];

export const AVATAR_IDS = AVATARS.map((avatar) => avatar.id);

export const getAvatar = (id: AvatarId): Avatar =>
  AVATARS.find((avatar) => avatar.id === id) ?? AVATARS[0];
