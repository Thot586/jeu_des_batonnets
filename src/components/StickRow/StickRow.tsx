import { useLayoutEffect, useRef, useState } from 'react';
import { Stick, type StickState } from '../Stick/Stick';
import { cx } from '../../utils/cx';
import styles from './StickRow.module.css';

/** Côté de la table d'où l'on prend : le début de la rangée (joueur de gauche) ou la fin (joueur de droite). */
export type TableSide = 'start' | 'end';

export interface PendingPull {
  count: number;
  /** reach : les bâtonnets choisis quittent la table ; ensuite ils sont partis (en vol, en main, rangés). */
  stage: 'reach' | 'fly' | 'pull' | 'stow';
  /** Côté du joueur qui prend. */
  side: TableSide;
}

interface StickRowProps {
  /** Nombre de bâtonnets en début de manche : chacun garde sa place sur la table toute la manche. */
  total: number;
  /** Bâtonnets déjà pris de chaque côté (par le joueur de gauche, par celui de droite). */
  takenStart?: number;
  takenEnd?: number;
  pending?: PendingPull | null;
  /** Côté depuis lequel on vise et on prend (celui du joueur dont c'est le tour). */
  side?: TableSide;
  /** Nombre de bâtonnets mis en évidence, comptés depuis ce côté. */
  preview?: number;
  /** Combien on peut en prendre en cliquant ; 0 rend la rangée non interactive. */
  maxPick?: number;
  onPreview?: (count: number) => void;
  onPick?: (count: number) => void;
  size?: 'normal' | 'compact';
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
 * Rangée de bâtonnets. Chaque joueur prend de son côté de la table, comme autour d'une vraie table :
 * celui de gauche commence par le début de la rangée, celui de droite par la fin.
 * Un bâtonnet pris laisse sa place vide : les autres ne bougent pas.
 * Survoler ou cliquer un bâtonnet de son côté choisit combien on en prend (jusqu'à lui).
 */
export const StickRow = ({
  total,
  takenStart = 0,
  takenEnd = 0,
  pending = null,
  side = 'end',
  preview = 0,
  maxPick = 0,
  onPreview,
  onPick,
  size = 'normal',
}: StickRowProps) => {
  const interactive = maxPick > 0 && !pending;
  const { ref, maxWidth } = useBalancedWidth(total);
  const first = takenStart;
  const last = total - takenEnd - 1;
  const remaining = Math.max(0, last - first + 1);
  const actingSide = pending?.side ?? side;
  /** Rang d'un bâtonnet depuis le côté de celui qui prend (1 = le plus proche de lui). */
  const rankFrom = (index: number, from: TableSide) => (from === 'start' ? index - first + 1 : last - index + 1);

  return (
    <div
      ref={ref}
      className={cx(styles.row, styles[size])}
      style={maxWidth ? { maxWidth, marginInline: 'auto' } : undefined}
      role="img"
      aria-label={`${remaining} bâtonnet${remaining > 1 ? 's' : ''}`}
      onMouseLeave={interactive ? () => onPreview?.(0) : undefined}
    >
      {Array.from({ length: total }, (_, index) => {
        const onTable = index >= first && index <= last;
        const rank = onTable ? rankFrom(index, actingSide) : 0;
        const pickable = interactive && onTable && rank <= maxPick;

        let state: StickState = onTable ? 'idle' : 'gone';
        if (onTable && pending && rank <= pending.count) {
          state = pending.stage === 'reach' ? 'grabbed' : 'gone';
        } else if (onTable && preview > 0 && rank <= preview) {
          state = 'preview';
        }

        return (
          <span
            key={index}
            data-index={index}
            data-take={onTable ? rank : undefined}
            className={cx(styles.slot, pickable && styles.pickable)}
            onMouseEnter={interactive ? () => onPreview?.(pickable ? rank : 0) : undefined}
            onClick={pickable ? () => onPick?.(rank) : undefined}
          >
            <Stick index={index} state={state} direction={actingSide === 'start' ? -1 : 1} />
          </span>
        );
      })}
    </div>
  );
};
