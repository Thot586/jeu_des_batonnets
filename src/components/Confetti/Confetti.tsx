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
interface ConfettiProps {
  /** Côté du gagnant : la pluie tombe surtout de son côté et dérive vers le milieu. */
  side?: 'left' | 'right' | 'center';
}

/** Position de départ : resserrée du côté du gagnant (plus dense près du bord, puis de moins en moins). */
const startX = (side: ConfettiProps['side'], value: number): number => {
  if (side === 'left') return value ** 1.5 * 72;
  if (side === 'right') return 100 - value ** 1.5 * 72;
  return value * 100;
};

export const Confetti = ({ side = 'center' }: ConfettiProps) => {
  const pieces = useMemo(() => {
    const random = seededRandom(Date.now() & 0xffff);
    // Vers le milieu : à gauche la pluie dérive vers la droite, et inversement.
    const lean = side === 'left' ? 3 : side === 'right' ? -3 : 0;
    return Array.from({ length: PIECES }, (_, i) => {
      const duration = 1.9 + random() * 1.5;
      return {
        id: i,
        shape: SHAPES[i % SHAPES.length],
        style: {
          '--x': `${startX(side, random())}%`,
          '--delay': `${random() * 0.7}s`,
          '--duration': `${duration}s`,
          // 4 intervalles d'images-clés : 3 images par intervalle et par seconde = 12 images/s.
          '--frames': Math.max(1, Math.round(duration * 3)),
          '--spin': `${(random() < 0.5 ? -1 : 1) * (360 + random() * 540)}deg`,
          '--drift': `${(random() - 0.5) * 10 + lean}rem`,
          '--paper': PAPERS[i % PAPERS.length],
          '--size': `${0.55 + random() * 0.5}rem`,
        } as CSSProperties,
      };
    });
  }, [side]);

  return (
    <div className={styles.confetti} aria-hidden="true">
      {pieces.map((piece) => (
        <span key={piece.id} className={`${styles.piece} ${styles[piece.shape]}`} style={piece.style} />
      ))}
    </div>
  );
};
