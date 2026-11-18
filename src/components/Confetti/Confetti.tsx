import { useMemo, type CSSProperties } from 'react';
import styles from './Confetti.module.css';

const PIECES = 42;

/** Pluie de petites allumettes colorées pour fêter la victoire. */
export const Confetti = () => {
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        id: i,
        style: {
          '--x': `${Math.random() * 100}%`,
          '--delay': `${Math.random() * 0.6}s`,
          '--duration': `${1.8 + Math.random() * 1.4}s`,
          '--spin': `${(Math.random() < 0.5 ? -1 : 1) * (240 + Math.random() * 480)}deg`,
          '--drift': `${(Math.random() - 0.5) * 120}px`,
          '--hue': ['#f2475a', '#ffc93c', '#22c3a6', '#4d7cfe', '#ff6fb5', '#ff8a3d'][i % 6],
        } as CSSProperties,
      })),
    [],
  );

  return (
    <div className={styles.confetti} aria-hidden="true">
      {pieces.map((piece) => (
        <span key={piece.id} className={styles.piece} style={piece.style} />
      ))}
    </div>
  );
};
