import type { CSSProperties } from 'react';
import type { PlayerConfig } from '../../game/types';
import { plural } from '../../game/rules';
import { Character, type Gesture, type Mood } from '../Character/Character';
import { cx } from '../../utils/cx';
import styles from './Seat.module.css';

interface SeatProps {
  player: PlayerConfig;
  side: 'left' | 'right';
  mood: Mood;
  isTurn: boolean;
  /** Bâtonnets ramassés pendant la manche. */
  collected: number;
  wins: number;
  holding: number;
  gesture?: Gesture | null;
  lookAt?: 'left' | 'right' | null;
  tense?: boolean;
  className?: string;
}

const PILE_LIMIT = 12;

/** La place d'un joueur : son personnage, son pseudo, sa pile et ses victoires. */
export const Seat = ({
  player,
  side,
  mood,
  isTurn,
  collected,
  wins,
  holding,
  gesture = null,
  lookAt = null,
  tense = false,
  className,
}: SeatProps) => (
  <section
    className={cx(styles.seat, styles[side], isTurn && styles.active, className)}
    aria-label={player.kind === 'ai' ? `${player.name}, l'ordinateur` : player.name}
  >
    <div className={styles.stage}>
      <span className={styles.spot} aria-hidden="true" />
      <Character
        avatar={player.avatar}
        mood={mood}
        facing={side === 'left' ? 'right' : 'left'}
        holding={holding}
        gesture={gesture}
        lookAt={lookAt}
        tense={tense}
      />
    </div>

    <div className={styles.plate}>
      <p className={styles.name}>
        {player.name}
        {player.kind === 'ai' && <span className={styles.tag}>ordi</span>}
      </p>
      <p className={styles.pile} aria-label={`${plural(collected, 'bâtonnet')} ramassé${collected > 1 ? 's' : ''}`}>
        {Array.from({ length: Math.min(collected, PILE_LIMIT) }, (_, i) => (
          <span key={i} className={styles.mini} style={{ '--n': i % 3 } as CSSProperties} />
        ))}
        {collected > PILE_LIMIT && <span className={styles.more}>+{collected - PILE_LIMIT}</span>}
        {collected === 0 && <span className={styles.empty}>aucun bâtonnet</span>}
      </p>
      <p className={styles.wins}>{plural(wins, 'victoire')}</p>
    </div>
  </section>
);
