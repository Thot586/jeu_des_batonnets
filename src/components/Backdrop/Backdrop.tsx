import { useMemo } from 'react';
import { blobPath, ridgePath } from '../../art/paper';
import styles from './Backdrop.module.css';

const WIDTH = 1600;
const HEIGHT = 420;

/**
 * Décor du fond, comme dans un théâtre de papier : deux rangées de collines découpées,
 * posées l'une devant l'autre devant le mur de kraft, et un soleil qui dépasse entre elles.
 * Chaque plan a sa propre profondeur : il glisse plus ou moins quand la souris bouge
 * (variables --px et --py, voir art/parallax.ts). Purement décoratif.
 */
export const Backdrop = () => {
  const shapes = useMemo(
    () => ({
      sun: blobPath(1190, 290, 62, 62, 71, 0.02, 26),
      far: ridgePath(WIDTH, HEIGHT, 352, 118, 5, 13),
      near: ridgePath(WIDTH, HEIGHT, 404, 84, 4, 29),
    }),
    [],
  );

  return (
    <div className={styles.backdrop} aria-hidden="true">
      <svg className={styles.far} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMax slice">
        <path className={styles.sun} d={shapes.sun} />
        <path className={styles.farHills} d={shapes.far} />
        <path d={shapes.far} fill="url(#paper-grain)" />
      </svg>
      <svg className={styles.near} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMax slice">
        <path className={styles.nearHills} d={shapes.near} />
        <path d={shapes.near} fill="url(#paper-grain)" />
      </svg>
    </div>
  );
};
