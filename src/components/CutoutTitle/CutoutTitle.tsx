import type { CSSProperties } from 'react';
import { handTilt } from '../../art/paper';
import styles from './CutoutTitle.module.css';

const PAPERS = ['var(--c-tomato)', 'var(--c-ultramarine)', 'var(--c-saffron)', 'var(--c-seafoam)'];

interface CutoutTitleProps {
  /** Petite ligne au-dessus du titre. */
  kicker: string;
  /** Le mot découpé lettre à lettre. */
  word: string;
  /** Délai avant la pose de la première lettre, en millisecondes. */
  delay?: number;
}

/**
 * Titre en lettres de papier découpées au pochoir. Chaque lettre est posée à la main,
 * l'une après l'autre (deux images d'écart), puis reste légèrement de travers.
 */
export const CutoutTitle = ({ kicker, word, delay = 0 }: CutoutTitleProps) => (
  <h1 className={styles.title}>
    <span className="visually-hidden">
      {kicker} {word}
    </span>
    <span className={styles.kicker} aria-hidden="true" style={{ '--d': `${delay}ms` } as CSSProperties}>
      {kicker}
    </span>
    <span className={styles.word} aria-hidden="true">
      {[...word].map((letter, index) => (
        <span
          key={index}
          className={styles.letter}
          style={
            {
              '--paper': PAPERS[index % PAPERS.length],
              '--tilt': `${handTilt(index + 3, 4.5)}deg`,
              '--d': `calc(${delay}ms + var(--frame) * ${2 + index * 2})`,
            } as CSSProperties
          }
        >
          {letter}
        </span>
      ))}
    </span>
  </h1>
);
