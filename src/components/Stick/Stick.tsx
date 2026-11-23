import type { CSSProperties } from 'react';
import { handTilt, stickCut } from '../../art/paper';
import { cx } from '../../utils/cx';
import styles from './Stick.module.css';

export type StickState = 'idle' | 'preview' | 'grabbed' | 'flying';

interface StickProps {
  /** Position dans la rangée : sert à la découpe, à l'inclinaison et au décalage de l'entrée. */
  index: number;
  state: StickState;
  /** Sens de l'envol : -1 vers la gauche, 1 vers la droite. */
  direction: -1 | 1;
}

/**
 * Un bâtonnet de carton découpé : une bande aux bords irréguliers et une tête de papier tomate.
 * Chaque bâtonnet a sa propre découpe (stable d'un affichage à l'autre).
 * Seuls transform et opacity sont animés.
 */
export const Stick = ({ index, state, direction }: StickProps) => {
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
    <span className={cx(styles.stick, styles[state])} style={vars}>
      {/* L'ombre est une découpe à part : quand le bâtonnet se soulève, elle reste sur la table et s'éloigne. */}
      <span className={styles.ghost}>
        <span className={styles.strip} />
        <span className={styles.head} />
      </span>
      <span className={styles.strip} />
      <span className={styles.head} />
    </span>
  );
};
