import type { AvatarId } from './types';

/**
 * Caractère de chaque marionnette. Les différences sont volontairement petites :
 * un tempo, une manière de tendre le bras, un tic. Les gestes eux-mêmes sont écrits
 * en CSS (Character.module.css), sélectionnés par l'attribut data-avatar.
 */
export interface Personality {
  /** En deux mots, pour la documentation et les infobulles éventuelles. */
  trait: string;
  /** Images (1/12 s) passées à tendre le bras avant de tirer : l'hésitant prend son temps. */
  reachFrames: number;
  /** Durée d'un cycle de respiration au repos, en secondes. */
  breath: number;
  /** Intervalle moyen entre deux clignements, en secondes. */
  blink: number;
}

export const PERSONALITIES: Record<AvatarId, Personality> = {
  // Vif, sûr de lui : tend le bras d'un geste sec, tire fort, tapote du pied quand il attend.
  pepin: { trait: 'vif et sûr de lui', reachFrames: 4, breath: 2.6, blink: 4.4 },
  // Calme, rêveur : tout est un peu plus lent, l'antenne suit le mouvement avec retard.
  mousse: { trait: 'calme et rêveur', reachFrames: 7, breath: 4.2, blink: 5.2 },
  // Nerveux, aux aguets : regarde partout, cligne souvent, se hérisse en tirant.
  zeste: { trait: 'nerveux et aux aguets', reachFrames: 4, breath: 2.3, blink: 3.1 },
  // Posé, réfléchi : remonte ses lunettes et hésite un instant avant de tirer.
  bleuet: { trait: 'posé et réfléchi', reachFrames: 8, breath: 3.4, blink: 6.2 },
  // Élégante, malicieuse : penche la tête, tire avec un petit mouvement de poignet.
  praline: { trait: 'élégante et malicieuse', reachFrames: 5, breath: 3, blink: 4.8 },
};

export const getPersonality = (avatar: AvatarId): Personality => PERSONALITIES[avatar];
