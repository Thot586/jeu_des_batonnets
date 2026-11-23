import { useId, type CSSProperties } from 'react';
import { handTilt } from '../../art/paper';
import { useFeedback } from '../../feedback/FeedbackContext';
import { cx } from '../../utils/cx';
import styles from './Segmented.module.css';

export interface SegmentedOption<T> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string | number> {
  legend: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  tone?: 'light' | 'card';
}

/**
 * Choix exclusif en onglets de papier : l'option choisie est une étiquette de gouache posée
 * de travers. Ce sont de vrais boutons radio, donc accessibles au clavier.
 */
export const Segmented = <T extends string | number>({
  legend,
  options,
  value,
  onChange,
  className,
  tone = 'card',
}: SegmentedProps<T>) => {
  const name = useId();
  const { play, buzz } = useFeedback();

  const choose = (next: T) => {
    play('select');
    buzz('tap');
    onChange(next);
  };

  return (
    <fieldset className={cx(styles.fieldset, styles[tone], className)}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.track}>
        {options.map((option, index) => (
          <label
            key={String(option.value)}
            className={styles.option}
            style={{ '--tilt': `${handTilt(index + legend.length, 2.2)}deg` } as CSSProperties}
          >
            <input
              type="radio"
              className="visually-hidden"
              name={name}
              checked={option.value === value}
              onChange={() => choose(option.value)}
            />
            <span className={styles.pill}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};
