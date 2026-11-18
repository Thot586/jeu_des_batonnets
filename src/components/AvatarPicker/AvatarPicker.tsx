import { useId } from 'react';
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

export const AvatarPicker = ({ value, taken, onChange }: AvatarPickerProps) => {
  const name = useId();

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Personnage</legend>
      <div className={styles.grid}>
        {AVATARS.map((avatar) => {
          const isTaken = avatar.id === taken;
          return (
            <label
              key={avatar.id}
              className={cx(styles.tile, isTaken && styles.taken)}
              title={isTaken ? `${avatar.name} est déjà choisi par l'autre joueur` : avatar.name}
            >
              <input
                type="radio"
                className="visually-hidden"
                name={name}
                checked={value === avatar.id}
                disabled={isTaken}
                onChange={() => onChange(avatar.id)}
              />
              <span className={styles.face} style={{ backgroundColor: avatar.belly }}>
                <Character avatar={avatar.id} className={styles.mini} />
              </span>
              <span className={styles.name}>{avatar.name}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};
