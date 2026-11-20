import { useLayoutEffect, useRef, useState } from 'react';
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
  /**
   * Nombre de bâtonnets en début de manche. Sert à répartir les rangées de façon équilibrée
   * (16 + 15 plutôt que 28 + 3) et à garder cette disposition stable pendant la partie.
   */
  layoutCount?: number;
}

/**
 * Largeur maximale de la rangée pour que les bâtonnets se répartissent en rangées égales.
 * Mesure la largeur disponible et celle d'un emplacement, et suit les changements de taille.
 */
const useBalancedWidth = (count: number) => {
  const ref = useRef<HTMLDivElement>(null);
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const row = ref.current;
    if (!row) return;

    const measure = () => {
      const slot = row.firstElementChild as HTMLElement | null;
      const parent = row.parentElement ?? row;
      const style = getComputedStyle(parent);
      const available =
        parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const slotWidth = slot?.getBoundingClientRect().width ?? 0;
      if (slotWidth === 0 || available === 0) return;
      const perRow = Math.max(1, Math.floor((available + 0.5) / slotWidth));
      const rows = Math.ceil(count / perRow);
      const balanced = Math.ceil(count / rows);
      setMaxWidth(rows > 1 ? Math.ceil(balanced * slotWidth) + 1 : undefined);
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (row.parentElement) observer.observe(row.parentElement);
    return () => observer.disconnect();
  }, [count]);

  return { ref, maxWidth };
};

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
  layoutCount,
}: StickRowProps) => {
  const interactive = maxPick > 0 && !pending;
  const { ref, maxWidth } = useBalancedWidth(layoutCount ?? remaining);

  return (
    <div
      ref={ref}
      className={cx(styles.row, styles[size])}
      style={maxWidth ? { maxWidth, marginInline: 'auto' } : undefined}
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
