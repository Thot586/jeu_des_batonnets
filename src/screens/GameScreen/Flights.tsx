import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { Stick } from '../../components/Stick/Stick';
import type { PendingMove } from './useRound';
import { FRAME } from './useRound';
import styles from './Flights.module.css';

/**
 * Le trajet des bâtonnets, mesuré à l'écran pour qu'il soit vraisemblable :
 * - fly : chaque bâtonnet part de SA place sur la table (inclinaison comprise) et arrive
 *   exactement là où il sera dans la main tendue du personnage ; à l'arrivée, celui de la main
 *   prend le relais (même taille, même place, même angle) ;
 * - stow : depuis la main, chacun tombe dans la pile du personnage, à la place qu'il y occupera.
 * Un bâtonnet n'est jamais visible à deux endroits à la fois. Le mouvement avance par images
 * tenues, comme le reste du décor (12 images par seconde).
 */

interface Flight {
  key: string;
  index: number;
  width: number;
  height: number;
  from: DOMMatrix;
  to: DOMMatrix;
  kind: 'fly' | 'stow';
  frames: number;
}

interface FlightsProps {
  pending: PendingMove | null;
  /** Conteneur de la table et des deux places. */
  scope: RefObject<HTMLElement | null>;
  /** Bâtonnets déjà dans la pile de chaque joueur (pour viser la bonne place). */
  collected: readonly [number, number];
  reducedMotion: boolean;
}

const centerOf = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

/** Repère affine déduit de trois points : l'origine, un pas en x, un pas en y. */
const frameFromMarkers = (scope: Element, unitX: number, unitY: number): DOMMatrix | null => {
  const markers = [0, 1, 2].map((i) => scope.querySelector(`[data-marker="${i}"]`));
  if (markers.some((marker) => !marker)) return null;
  const [p0, p1, p2] = markers.map((marker) => centerOf(marker as Element));
  return new DOMMatrix([
    (p1.x - p0.x) / unitX,
    (p1.y - p0.y) / unitX,
    (p2.x - p0.x) / unitY,
    (p2.y - p0.y) / unitY,
    p0.x,
    p0.y,
  ]);
};

/** Position, angle et échelle d'un bâtonnet, à partir de sa matrice (centre du bâtonnet). */
const pose = (matrix: DOMMatrix, width: number, height: number) => {
  const center = matrix.transformPoint(new DOMPoint(width / 2, height / 2));
  return { x: center.x, y: center.y, angle: Math.atan2(matrix.b, matrix.a), scale: Math.hypot(matrix.a, matrix.b) };
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const shortestAngle = (from: number, to: number) => {
  let delta = to - from;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  return from + delta;
};

const keyframesFor = (flight: Flight): Keyframe[] => {
  const a = pose(flight.from, flight.width, flight.height);
  const b = pose(flight.to, flight.width, flight.height);
  const angleTo = shortestAngle(a.angle, b.angle);
  const distance = Math.hypot(b.x - a.x, b.y - a.y);
  return Array.from({ length: flight.frames + 1 }, (_, step) => {
    const t = step / flight.frames;
    let x: number;
    let y: number;
    if (flight.kind === 'fly') {
      // Il décolle doucement, file, puis se pose dans la main : en cloche, avec un arc vers le haut.
      const e = t * t * (3 - 2 * t);
      x = lerp(a.x, b.x, e);
      y = lerp(a.y, b.y, e) - Math.sin(Math.PI * t) * Math.min(70, distance * 0.18);
    } else {
      // Lâché : il part vers la pile et tombe de plus en plus vite.
      x = lerp(a.x, b.x, 1 - (1 - t) * (1 - t));
      y = lerp(a.y, b.y, t * t) - Math.sin(Math.PI * t) * Math.min(30, distance * 0.12);
    }
    const angle = lerp(a.angle, angleTo, flight.kind === 'fly' ? t * t * (3 - 2 * t) : t);
    const scale = lerp(a.scale, b.scale, flight.kind === 'fly' ? t : t * t);
    return {
      transform: `translate(${x}px, ${y}px) rotate(${angle}rad) scale(${scale}) translate(${-flight.width / 2}px, ${-flight.height / 2}px)`,
      easing: 'steps(1, end)',
    };
  });
};

export const Flights = ({ pending, scope, collected, reducedMotion }: FlightsProps) => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const stage = pending?.stage ?? null;
  const player = pending?.player ?? null;
  const count = pending?.count ?? 0;

  useLayoutEffect(() => {
    if (reducedMotion || stage === null || player === null || (stage !== 'fly' && stage !== 'stow')) {
      setFlights([]);
      return;
    }
    const root = scope.current;
    if (!root) return;
    const seat = root.querySelector(`[data-seat="${player}"]`);
    if (!seat) return;

    const next: Flight[] = [];
    for (let k = 0; k < count; k++) {
      // Le k-ième bâtonnet pris, en partant du côté du joueur (1 = le plus proche de lui).
      const slot = root.querySelector(`[data-take="${k + 1}"]`);
      const stick = slot?.firstElementChild as HTMLElement | null;
      const held = seat.querySelector(`[data-held="${count - 1 - k}"]`);
      if (!stick || !held) continue;
      const width = stick.offsetWidth;
      const height = stick.offsetHeight;
      const onTable = frameFromMarkers(stick, width, height);
      const heldFrame = frameFromMarkers(held, 10, 10);
      if (!onTable || !heldFrame) continue;

      // Passage du repère du bâtonnet (pixels) à celui de la main (unités du dessin) :
      // même axe, même centre, à l'échelle du dessin. Si le personnage est retourné, on retourne
      // aussi le bâtonnet sur son axe : il reste à la même place, sans effet miroir.
      const unitsPerPx = Number(held.getAttribute('data-length')) / height;
      if (!Number.isFinite(unitsPerPx) || unitsPerPx <= 0) continue;
      let inHand = heldFrame.multiply(new DOMMatrix().scale(unitsPerPx)).multiply(new DOMMatrix().translate(-width / 2, 0));
      if (heldFrame.a * heldFrame.d - heldFrame.b * heldFrame.c < 0) {
        inHand = heldFrame
          .multiply(new DOMMatrix().scale(-1, 1))
          .multiply(new DOMMatrix().scale(unitsPerPx))
          .multiply(new DOMMatrix().translate(-width / 2, 0));
      }

      const index = Number(slot?.getAttribute('data-index'));
      if (stage === 'fly') {
        next.push({ key: `fly-${index}`, index, width, height, from: onTable, to: inHand, kind: 'fly', frames: 5 });
        continue;
      }

      // Rangement : vers la place qu'il occupera dans la pile (repère caché, déjà en place).
      const target = seat.querySelector(`[data-slot="${collected[player] + k}"]`) ?? seat.querySelector('[data-slot-last]');
      if (!target) continue;
      const box = target.getBoundingClientRect();
      const scale = box.height / height;
      const inPile = new DOMMatrix()
        .translate(box.left + box.width / 2 - (width * scale) / 2, box.top)
        .multiply(new DOMMatrix().scale(scale));
      next.push({ key: `stow-${index}`, index, width, height, from: inHand, to: inPile, kind: 'stow', frames: 4 });
    }
    setFlights(next);
  }, [stage, player, count, collected, scope, reducedMotion]);

  return (
    <div className={styles.layer} aria-hidden="true">
      {flights.map((flight) => (
        <FlightStick key={flight.key} flight={flight} />
      ))}
    </div>
  );
};

const FlightStick = ({ flight }: { flight: Flight }) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const animation = element.animate(keyframesFor(flight), {
      duration: flight.frames * FRAME,
      fill: 'forwards',
    });
    return () => animation.cancel();
  }, [flight]);

  const style = {
    width: flight.width,
    height: flight.height,
    '--stick-w': `${flight.width}px`,
    '--stick-h': `${flight.height}px`,
    transform: `matrix(${flight.from.a}, ${flight.from.b}, ${flight.from.c}, ${flight.from.d}, ${flight.from.e}, ${flight.from.f})`,
  } as CSSProperties;

  return (
    <div ref={ref} className={styles.flight} style={style}>
      <Stick index={flight.index} state="idle" direction={1} inFlight />
    </div>
  );
};
