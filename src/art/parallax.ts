import { subscribePointer } from './pointer';

/**
 * Parallaxe du théâtre de papier.
 *
 * La position de la souris est ramenée entre -1 et 1 sur chaque axe et publiée dans
 * deux variables CSS de la page (--px, --py). Chaque plan du décor se décale d'autant
 * de pixels que sa distance à la scène : le fond suit la souris, le premier plan s'y oppose.
 *
 * Comme le reste du décor, le mouvement avance à 12 images par seconde : à chaque image,
 * la caméra parcourt la moitié du chemin qui reste (approche douce, sans à-coup brutal).
 * Souris seulement, et rien du tout si l'utilisateur demande moins de mouvement.
 */
const FRAME_MS = 1000 / 12;
const EASE = 0.5;

export const startParallax = (): (() => void) => {
  const root = document.documentElement;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!finePointer.matches || reduced.matches) return () => undefined;

  let targetX = 0;
  let targetY = 0;
  let x = 0;
  let y = 0;
  let timer = 0;

  const write = () => {
    root.style.setProperty('--px', x.toFixed(3));
    root.style.setProperty('--py', y.toFixed(3));
  };

  const step = () => {
    x += (targetX - x) * EASE;
    y += (targetY - y) * EASE;
    const settled = Math.abs(targetX - x) < 0.004 && Math.abs(targetY - y) < 0.004;
    if (settled) {
      x = targetX;
      y = targetY;
    }
    write();
    timer = settled ? 0 : window.setTimeout(step, FRAME_MS);
  };

  const unsubscribe = subscribePointer((px, py) => {
    targetX = Math.max(-1, Math.min(1, (px / window.innerWidth) * 2 - 1));
    targetY = Math.max(-1, Math.min(1, (py / window.innerHeight) * 2 - 1));
    if (!timer) timer = window.setTimeout(step, FRAME_MS);
  });

  // Si la préférence change en cours de route, la caméra revient au centre et s'arrête.
  const onReduce = () => {
    if (!reduced.matches) return;
    targetX = targetY = x = y = 0;
    write();
  };
  reduced.addEventListener('change', onReduce);

  return () => {
    unsubscribe();
    reduced.removeEventListener('change', onReduce);
    window.clearTimeout(timer);
    root.style.removeProperty('--px');
    root.style.removeProperty('--py');
  };
};
