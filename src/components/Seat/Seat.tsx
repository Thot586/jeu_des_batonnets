import type { CSSProperties } from 'react';
import type { PlayerConfig } from '../../game/types';
import { COOL_STREAK, plural } from '../../game/rules';
import { Character, type Gesture, type HeldInfo, type Mood } from '../Character/Character';
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
  /** Victoires d'affilée en cours. */
  streak?: number;
  /** Liseré d'autocollant : c'est le gagnant de la manche. */
  sticker?: boolean;
  /** 0 pour la place de gauche, 1 pour celle de droite (repère pour le trajet des bâtonnets). */
  seatId: 0 | 1;
  /** Bâtonnets en main (voir Character). */
  held?: HeldInfo | null;
  /** Bâtonnets en route vers la pile : leurs places y sont déjà réservées (invisibles). */
  incoming?: number;
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
  streak = 0,
  sticker = false,
  seatId,
  held = null,
  incoming = 0,
  gesture = null,
  lookAt = null,
  tense = false,
  className,
}: SeatProps) => (
  <section
    data-seat={seatId}
    className={cx(styles.seat, styles[side], isTurn && styles.active, className)}
    aria-label={player.kind === 'ai' ? `${player.name}, l'ordinateur` : player.name}
  >
    <div className={styles.stage}>
      <span className={styles.spot} aria-hidden="true" />
      <Character
        avatar={player.avatar}
        mood={mood}
        facing={side === 'left' ? 'right' : 'left'}
        held={held}
        gesture={gesture}
        shades={streak >= COOL_STREAK}
        sticker={sticker}
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
        {Array.from({ length: Math.min(collected + incoming, PILE_LIMIT) }, (_, i) => (
          <span
            key={i}
            data-slot={i}
            data-slot-last={i === PILE_LIMIT - 1 ? '' : undefined}
            className={cx(styles.mini, i >= collected && styles.reserved)}
            style={{ '--n': i % 3 } as CSSProperties}
          />
        ))}
        {collected > PILE_LIMIT && <span className={styles.more}>+{collected - PILE_LIMIT}</span>}
        {collected === 0 && incoming === 0 && <span className={styles.empty}>aucun bâtonnet</span>}
      </p>
      <p className={styles.wins}>
        {plural(wins, 'victoire')}
        {streak >= COOL_STREAK && <span className={styles.streak}>, {streak} d'affilée</span>}
      </p>
    </div>
  </section>
);
