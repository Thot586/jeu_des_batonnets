import type { CSSProperties } from 'react';
import { cx } from '../../utils/cx';
import styles from './Stick.module.css';

export type StickState = 'idle' | 'preview' | 'grabbed' | 'flying';

interface StickProps {
  /** Position dans la rangée : sert à l'inclinaison et au décalage de l'entrée. */
  index: number;
  state: StickState;
  /** Sens de l'envol : -1 vers la gauche, 1 vers la droite. */
  direction: -1 | 1;
}

/** Inclinaison légère et reproductible, pour un rendu moins mécanique. */
const tiltFor = (index: number): number => (((index * 37) % 7) - 3) * 0.9;

/**
 * Un bâtonnet (une allumette) dessiné en CSS : un simple élément avec dégradé
 * et une tête en pseudo-élément. Léger, et animé uniquement par transform/opacity.
 */
export const Stick = ({ index, state, direction }: StickProps) => {
  const vars = {
    '--tilt': `${tiltFor(index)}deg`,
    '--i': index,
    '--dir': direction,
  } as CSSProperties;

  return <span className={cx(styles.stick, styles[state])} style={vars} />;
};
