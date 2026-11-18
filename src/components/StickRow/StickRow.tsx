import { Stick, type StickState } from '../Stick/Stick';
import { cx } from '../../utils/cx';
import styles from './StickRow.module.css';

export interface PendingPull {
  count: number;
  stage: 'reach' | 'pull';
  direction: -1 | 1;
}

interface StickRowProps {
  remaining: number;
  pending?: PendingPull | null;
  /** Nombre de bâtonnets mis en évidence en fin de rangée. */
  preview?: number;
  /** Combien on peut en prendre en cliquant ; 0 rend la rangée non interactive. */
  maxPick?: number;
  onPreview?: (count: number) => void;
  onPick?: (count: number) => void;
  size?: 'normal' | 'compact';
  /** Sens d'envol par défaut (aperçu). */
  direction?: -1 | 1;
}

/**
 * Rangée de bâtonnets. On prend toujours en fin de rangée :
 * survoler ou cliquer un des derniers bâtonnets choisit combien on en tire.
 */
export const StickRow = ({
  remaining,
  pending = null,
  preview = 0,
  maxPick = 0,
  onPreview,
  onPick,
  size = 'normal',
  direction = 1,
}: StickRowProps) => {
  const interactive = maxPick > 0 && !pending;

  return (
    <div
      className={cx(styles.row, styles[size])}
      role="img"
      aria-label={`${remaining} bâtonnet${remaining > 1 ? 's' : ''}`}
      onMouseLeave={interactive ? () => onPreview?.(0) : undefined}
    >
      {Array.from({ length: remaining }, (_, index) => {
        const fromEnd = remaining - index;
        const pickable = interactive && fromEnd <= maxPick;

        let state: StickState = 'idle';
        if (pending && fromEnd <= pending.count) {
          state = pending.stage === 'reach' ? 'grabbed' : 'flying';
        } else if (preview > 0 && fromEnd <= preview) {
          state = 'preview';
        }

        return (
          <span
            key={index}
            className={cx(styles.slot, pickable && styles.pickable)}
            onMouseEnter={interactive ? () => onPreview?.(pickable ? fromEnd : 0) : undefined}
            onClick={pickable ? () => onPick?.(fromEnd) : undefined}
          >
            <Stick index={index} state={state} direction={pending?.direction ?? direction} />
          </span>
        );
      })}
    </div>
  );
};
