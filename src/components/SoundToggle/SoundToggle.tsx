import { useFeedback } from '../../feedback/FeedbackContext';
import { cx } from '../../utils/cx';
import styles from './SoundToggle.module.css';

/**
 * Bouton son et vibrations. Son nom (et son infobulle) dit ce que fait le clic, en commençant par le verbe.
 * Les deux icônes restent dans le DOM et se croisent en fondu
 * (échelle 0,25 vers 1, flou 4 px vers 0) : l'état change sans saut.
 */
export const SoundToggle = ({ className }: { className?: string }) => {
  const { enabled, toggle } = useFeedback();
  const label = enabled ? 'Couper le son et les vibrations' : 'Activer le son et les vibrations';

  return (
    <button
      type="button"
      className={cx(styles.toggle, className)}
      aria-label={label}
      data-on={enabled}
      onClick={toggle}
    >
      <svg className={cx(styles.icon, styles.on)} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.4 9.2 L7.6 9 L12.6 4.6 L13.1 19.6 L7.8 15.2 L3.2 15 Z" />
        <path className={styles.wave} d="M15.6 9.2 Q17.6 12.1 15.7 14.9" />
        <path className={styles.wave} d="M18 6.6 Q21.9 12 18.1 17.5" />
      </svg>
      <svg className={cx(styles.icon, styles.off)} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.4 9.2 L7.6 9 L12.6 4.6 L13.1 19.6 L7.8 15.2 L3.2 15 Z" />
        <path className={styles.wave} d="M16.2 9.4 L21.2 14.6 M21.1 9.3 L16.3 14.7" />
      </svg>
      <span className={styles.tooltip} aria-hidden="true">
        {label}
      </span>
    </button>
  );
};
