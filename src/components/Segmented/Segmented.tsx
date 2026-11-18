import { useId } from 'react';
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

/** Choix exclusif présenté en pastilles ; ce sont de vrais boutons radio, donc accessibles au clavier. */
export const Segmented = <T extends string | number>({
  legend,
  options,
  value,
  onChange,
  className,
  tone = 'card',
}: SegmentedProps<T>) => {
  const name = useId();

  return (
    <fieldset className={cx(styles.fieldset, styles[tone], className)}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.track}>
        {options.map((option) => (
          <label key={String(option.value)} className={styles.option}>
            <input
              type="radio"
              className="visually-hidden"
              name={name}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            <span className={styles.pill}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};
