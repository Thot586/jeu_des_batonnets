/**
 * Position de la souris, diffusée aux marionnettes qui la suivent du regard.
 * Un seul écouteur pour toute la page, et au plus 12 mises à jour par seconde :
 * le regard bouge par petites poses tenues, comme le reste du décor.
 * Ignoré au toucher (pas de curseur à suivre).
 */
type Listener = (x: number, y: number) => void;

const FRAME_MS = 1000 / 12;
const listeners = new Set<Listener>();
let timer = 0;
let lastX = 0;
let lastY = 0;

const flush = () => {
  timer = 0;
  listeners.forEach((listener) => listener(lastX, lastY));
};

const onMove = (event: PointerEvent) => {
  if (event.pointerType !== 'mouse') return;
  lastX = event.clientX;
  lastY = event.clientY;
  if (!timer) timer = window.setTimeout(flush, FRAME_MS);
};

export const subscribePointer = (listener: Listener): (() => void) => {
  if (listeners.size === 0) window.addEventListener('pointermove', onMove, { passive: true });
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener('pointermove', onMove);
      window.clearTimeout(timer);
      timer = 0;
    }
  };
};
