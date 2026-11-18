import styles from './MovePicker.module.css';

interface MovePickerProps {
  maxTake: number;
  /** Combien on peut prendre en ce moment ; 0 désactive tout. */
  available: number;
  onPick: (count: number) => void;
  onPreview: (count: number) => void;
}

/** Boutons « Prendre 1, 2, 3 » ; le survol montre sur la table les bâtonnets concernés. */
export const MovePicker = ({ maxTake, available, onPick, onPreview }: MovePickerProps) => (
  <div className={styles.picker} role="group" aria-label="Combien de bâtonnets prendre">
    {Array.from({ length: maxTake }, (_, i) => {
      const count = i + 1;
      const disabled = count > available;
      return (
        <button
          key={count}
          type="button"
          className={styles.choice}
          disabled={disabled}
          aria-keyshortcuts={String(count)}
          onClick={() => onPick(count)}
          onMouseEnter={() => onPreview(disabled ? 0 : count)}
          onMouseLeave={() => onPreview(0)}
          onFocus={() => onPreview(disabled ? 0 : count)}
          onBlur={() => onPreview(0)}
        >
          <span className={styles.icons} aria-hidden="true">
            {Array.from({ length: count }, (_, k) => (
              <span key={k} className={styles.icon} />
            ))}
          </span>
          <span>Prendre {count}</span>
        </button>
      );
    })}
  </div>
);
