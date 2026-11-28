import type { CSSProperties } from 'react';
import { handTilt, stickCut } from '../../art/paper';
import { cx } from '../../utils/cx';
import styles from './Stick.module.css';

/**
 * - idle : posé sur la table ;
 * - preview : visé, il se soulève un peu ;
 * - grabbed : choisi, il quitte la table et frémit ;
 * - gone : parti (il vole vers la main, il est tenu ou rangé) : sa place reste vide.
 */
export type StickState = 'idle' | 'preview' | 'grabbed' | 'gone';

interface StickProps {
  /** Position dans la rangée : sert à la découpe, à l'inclinaison et au décalage de l'entrée. */
  index: number;
  state: StickState;
  /** Sens de l'envol : -1 vers la gauche, 1 vers la droite. */
  direction: -1 | 1;
  /**
   * Bâtonnet en vol : sans inclinaison ni animation propre (c'est le vol qui le place),
   * avec une ombre portée plus loin (il est en l'air).
   */
  inFlight?: boolean;
}

/**
 * Un bâtonnet de carton découpé : une bande aux bords irréguliers et une tête de papier tomate.
 * Chaque bâtonnet a sa propre découpe (stable d'un affichage à l'autre).
 * Seuls transform et opacity sont animés.
 */
export const Stick = ({ index, state, direction, inFlight = false }: StickProps) => {
  const cut = stickCut(index);
  const vars = {
    '--tilt': `${handTilt(index, 2.6)}deg`,
    '--i': index,
    '--dir': direction,
    '--clip': cut.clip,
    '--head-shape': cut.head,
    '--tone': cut.tone,
  } as CSSProperties;

  return (
    <span className={cx(styles.stick, styles[state], inFlight && styles.inFlight)} style={vars}>
      {/* L'ombre est une découpe à part : quand le bâtonnet se soulève, elle reste sur la table et s'éloigne. */}
      <span className={styles.ghost}>
        <span className={styles.strip} />
        <span className={styles.head} />
      </span>
      <span className={styles.strip} />
      <span className={styles.head} />
      {/* Trois repères (coin haut gauche, haut droit, bas gauche) : on en déduit exactement
          où est le bâtonnet à l'écran, inclinaison comprise, pour le faire partir de là. */}
      <i className={styles.marker} data-marker="0" />
      <i className={styles.marker} data-marker="1" style={{ left: '100%' }} />
      <i className={styles.marker} data-marker="2" style={{ top: '100%' }} />
    </span>
  );
};
