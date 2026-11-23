import { useMemo, type CSSProperties } from 'react';
import { seededRandom } from '../../art/paper';
import { cx } from '../../utils/cx';
import styles from './Curtain.module.css';

/** Bord intérieur d'un pan de rideau, coupé aux ciseaux (polygone en pourcentages). */
const innerEdge = (seed: number, side: 'left' | 'right'): string => {
  const random = seededRandom(seed);
  const rows = 9;
  const edge = Array.from({ length: rows + 1 }, (_, i) => {
    const x = 96 + random() * 4;
    const y = (i / rows) * 100;
    return side === 'left' ? `${x.toFixed(1)}% ${y.toFixed(1)}%` : `${(100 - x).toFixed(1)}% ${y.toFixed(1)}%`;
  });
  return side === 'left'
    ? `polygon(0 0, ${edge.join(', ')}, 0 100%)`
    : `polygon(100% 0, ${edge.join(', ')}, 100% 100%)`;
};

/**
 * Rideau de théâtre en papier. Il se ferme puis se rouvre entre deux écrans,
 * image par image. Décoratif : masqué aux lecteurs d'écran.
 */
export const Curtain = ({ closed }: { closed: boolean }) => {
  const clips = useMemo(
    () => ({
      left: { '--cut': innerEdge(5, 'left') } as CSSProperties,
      right: { '--cut': innerEdge(9, 'right') } as CSSProperties,
    }),
    [],
  );

  return (
    <div className={cx(styles.curtain, closed && styles.closed)} aria-hidden="true">
      <div className={cx(styles.panel, styles.left)} style={clips.left} />
      <div className={cx(styles.panel, styles.right)} style={clips.right} />
      <div className={styles.valance} />
    </div>
  );
};
