import { useId, type CSSProperties } from 'react';
import { handTilt } from '../../art/paper';
import { useFeedback } from '../../feedback/FeedbackContext';
import { AVATARS } from '../../game/avatars';
import type { AvatarId } from '../../game/types';
import { Character } from '../Character/Character';
import { cx } from '../../utils/cx';
import styles from './AvatarPicker.module.css';

interface AvatarPickerProps {
  value: AvatarId;
  /** Personnage déjà pris par l'autre joueur. */
  taken?: AvatarId;
  onChange: (avatar: AvatarId) => void;
}

/** Choix du personnage : des vignettes de papier ; la vignette choisie se soulève et reçoit une pastille. */
export const AvatarPicker = ({ value, taken, onChange }: AvatarPickerProps) => {
  const name = useId();
  const { play, buzz } = useFeedback();

  const choose = (avatar: AvatarId) => {
    play('select');
    buzz('tap');
    onChange(avatar);
  };

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Personnage</legend>
      <div className={styles.grid}>
        {AVATARS.map((avatar, index) => {
          const isTaken = avatar.id === taken;
          return (
            <label
              key={avatar.id}
              className={cx(styles.tile, isTaken && styles.taken)}
              style={{ '--tilt': `${handTilt(index + 40, 3)}deg` } as CSSProperties}
              title={isTaken ? `${avatar.name} est déjà choisi par l'autre joueur` : avatar.name}
            >
              <input
                type="radio"
                className="visually-hidden"
                name={name}
                checked={value === avatar.id}
                disabled={isTaken}
                onChange={() => choose(avatar.id)}
              />
              <span className={styles.face} style={{ backgroundColor: avatar.belly }}>
                <Character avatar={avatar.id} className={styles.mini} />
                <span className={styles.badge} aria-hidden="true">
                  <svg viewBox="0 0 16 16">
                    <path d="M3.4 8.6 L6.6 11.6 L12.8 4.4" />
                  </svg>
                </span>
              </span>
              <span className={styles.name}>{avatar.name}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};
