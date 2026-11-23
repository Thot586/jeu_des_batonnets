import { useMemo, type CSSProperties } from 'react';
import { seededRandom } from '../../art/paper';
import styles from './Confetti.module.css';

const PIECES = 46;
const PAPERS = ['var(--c-tomato)', 'var(--c-saffron)', 'var(--c-seafoam)', 'var(--c-ultramarine)', 'var(--c-rose)', 'var(--c-paper)'];
const SHAPES = ['disc', 'strip', 'triangle', 'square'] as const;

/**
 * Pluie de chutes de papier (ronds, bandes, triangles), qui tombent et tournoient
 * image par image, comme des confettis découpés à la main.
 */
export const Confetti = () => {
  const pieces = useMemo(() => {
    const random = seededRandom(Date.now() & 0xffff);
    return Array.from({ length: PIECES }, (_, i) => {
      const duration = 1.9 + random() * 1.5;
      return {
        id: i,
        shape: SHAPES[i % SHAPES.length],
        style: {
          '--x': `${random() * 100}%`,
          '--delay': `${random() * 0.7}s`,
          '--duration': `${duration}s`,
          // 4 intervalles d'images-clés : 3 images par intervalle et par seconde = 12 images/s.
          '--frames': Math.max(1, Math.round(duration * 3)),
          '--spin': `${(random() < 0.5 ? -1 : 1) * (360 + random() * 540)}deg`,
          '--drift': `${(random() - 0.5) * 10}rem`,
          '--paper': PAPERS[i % PAPERS.length],
          '--size': `${0.55 + random() * 0.5}rem`,
        } as CSSProperties,
      };
    });
  }, []);

  return (
    <div className={styles.confetti} aria-hidden="true">
      {pieces.map((piece) => (
        <span key={piece.id} className={`${styles.piece} ${styles[piece.shape]}`} style={piece.style} />
      ))}
    </div>
  );
};
