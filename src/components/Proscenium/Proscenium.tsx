import { useMemo, type CSSProperties } from 'react';
import { seededRandom } from '../../art/paper';
import { cx } from '../../utils/cx';
import styles from './Proscenium.module.css';

/** Bord intérieur d'une draperie retenue par une embrasse : il se creuse vers le milieu. */
const drapeEdge = (seed: number, side: 'left' | 'right'): string => {
  const random = seededRandom(seed);
  const rows = 12;
  const edge = Array.from({ length: rows + 1 }, (_, i) => {
    const t = i / rows;
    // La draperie est plus étroite à la hauteur de l'embrasse (vers 55 %).
    const pinch = 1 - 0.38 * Math.exp(-((t - 0.55) ** 2) / 0.02);
    const x = (pinch * 100 - random() * 3).toFixed(1);
    const y = (t * 100).toFixed(1);
    return side === 'left' ? `${x}% ${y}%` : `${(100 - Number(x)).toFixed(1)}% ${y}%`;
  });
  return side === 'left'
    ? `polygon(0 0, ${edge.join(', ')}, 0 100%)`
    : `polygon(100% 0, ${edge.join(', ')}, 100% 100%)`;
};

/**
 * Cadre de scène : deux draperies de papier, au premier plan, sur les côtés des grands écrans.
 * Elles sont plus près de nous que le jeu : la parallaxe les fait glisser en sens inverse
 * du décor du fond. Purement décoratif.
 */
export const Proscenium = () => {
  const cuts = useMemo(
    () => ({
      left: { '--cut': drapeEdge(17, 'left') } as CSSProperties,
      right: { '--cut': drapeEdge(31, 'right') } as CSSProperties,
    }),
    [],
  );

  return (
    <div className={styles.frame} aria-hidden="true">
      <div className={cx(styles.drape, styles.left)} style={cuts.left}>
        <span className={styles.tie} />
      </div>
      <div className={cx(styles.drape, styles.right)} style={cuts.right}>
        <span className={styles.tie} />
      </div>
    </div>
  );
};
