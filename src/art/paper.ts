/**
 * Formes « découpées à la main ».
 *
 * Chaque contour est échantillonné puis légèrement déformé à partir d'une graine :
 * les pièces sont un peu irrégulières, comme coupées aux ciseaux, mais toujours identiques
 * d'un affichage à l'autre (aucun tirage au hasard au rendu).
 */

type Point = readonly [number, number];

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
export const seededRandom = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const round = (value: number): number => Math.round(value * 100) / 100;

/**
 * Relie des points par une courbe fermée (Catmull-Rom convertie en Bézier).
 * Une tension inférieure à 1 garde de petits angles, comme une coupe aux ciseaux.
 */
const closedCurve = (points: readonly Point[], tension = 0.75): string => {
  const n = points.length;
  const at = (i: number) => points[(i + n) % n];
  let d = `M${round(at(0)[0])} ${round(at(0)[1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension;
    d += ` C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(p2[0])} ${round(p2[1])}`;
  }
  return `${d} Z`;
};

/** Ellipse découpée : rayon qui varie un peu tout autour. */
export const blobPath = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number,
  wobble = 0.06,
  count = 14,
): string => {
  const random = seededRandom(seed);
  const points: Point[] = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const k = 1 + (random() - 0.5) * 2 * wobble;
    return [cx + Math.cos(angle) * rx * k, cy + Math.sin(angle) * ry * k];
  });
  return closedCurve(points);
};

/**
 * Ligne de collines découpée dans une bande de papier, pour le décor du fond.
 * Les sommets alternent avec des creux, chacun un peu différent ; le bas de la forme
 * descend sous le cadre pour que seule la crête se voie.
 */
export const ridgePath = (
  width: number,
  height: number,
  baseline: number,
  amplitude: number,
  humps: number,
  seed: number,
): string => {
  const random = seededRandom(seed);
  const steps = humps * 2;
  const ridge: Point[] = Array.from({ length: steps + 3 }, (_, i) => {
    const x = ((i - 1) / steps) * width + (random() - 0.5) * (width / steps) * 0.5;
    const peak = i % 2 === 1;
    const lift = peak ? amplitude * (0.55 + random() * 0.45) : amplitude * random() * 0.18;
    return [x, baseline - lift];
  });
  const bottom = height + 40;
  return closedCurve([[ridge[ridge.length - 1][0] + 40, bottom], [ridge[0][0] - 40, bottom], ...ridge], 0.9);
};

/** Rectangle aux coins arrondis, découpé à la main. */
export const roundRectPath = (
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  seed: number,
  jitter = 1.2,
): string => {
  const random = seededRandom(seed);
  const shake = () => (random() - 0.5) * 2 * jitter;
  const radius = Math.min(r, w / 2, h / 2);
  const corners: Array<[number, number, number]> = [
    [x + w - radius, y + radius, -Math.PI / 2],
    [x + w - radius, y + h - radius, 0],
    [x + radius, y + h - radius, Math.PI / 2],
    [x + radius, y + radius, Math.PI],
  ];
  const points: Point[] = [];
  corners.forEach(([cx, cy, start], index) => {
    for (let s = 0; s <= 2; s++) {
      const angle = start + (s / 2) * (Math.PI / 2);
      points.push([cx + Math.cos(angle) * radius + shake(), cy + Math.sin(angle) * radius + shake()]);
    }
    // Un point au milieu de chaque côté, pour que le bord ne soit pas parfaitement droit.
    const [nx, ny] = corners[(index + 1) % 4];
    const nextStart = corners[(index + 1) % 4][2];
    const ex = cx + Math.cos(start + Math.PI / 2) * radius;
    const ey = cy + Math.sin(start + Math.PI / 2) * radius;
    const sx = nx + Math.cos(nextStart) * radius;
    const sy = ny + Math.sin(nextStart) * radius;
    points.push([(ex + sx) / 2 + shake(), (ey + sy) / 2 + shake()]);
  });
  return closedCurve(points, 0.7);
};

/** Bande allongée (bras, tige), centrée sur l'axe vertical, de 0 à length. */
export const stripPath = (width: number, length: number, seed: number): string =>
  roundRectPath(-width / 2, -width / 2, width, length + width, width / 2, seed, 0.6);

const stickCache = new Map<number, { clip: string; head: string; tone: number }>();

/**
 * Découpe d'un bâtonnet de carton (élément HTML) : un polygone irrégulier pour la bande,
 * un arrondi irrégulier pour la tête, une nuance de carton.
 */
export const stickCut = (index: number) => {
  const cached = stickCache.get(index);
  if (cached) return cached;

  const random = seededRandom(1000 + index * 7919);
  const edge = () => round(random() * 14);
  const steps = 5;
  const left = Array.from({ length: steps + 1 }, (_, i) => `${edge()}% ${round((i / steps) * 100)}%`);
  const right = Array.from(
    { length: steps + 1 },
    (_, i) => `${round(100 - edge())}% ${round(100 - (i / steps) * 100)}%`,
  );
  const r = () => Math.round(42 + random() * 16);
  const value = {
    clip: `polygon(${[...left, ...right].join(', ')})`,
    head: `${r()}% ${r()}% ${r()}% ${r()}% / ${r() + 6}% ${r() + 6}% ${r() - 6}% ${r() - 6}%`,
    tone: round((random() - 0.5) * 0.12),
  };
  stickCache.set(index, value);
  return value;
};

/** Petite rotation stable pour donner du jeu à un élément posé à la main. */
export const handTilt = (seed: number, max = 3): number => {
  const random = seededRandom(seed * 104729 + 17);
  return round((random() - 0.5) * 2 * max);
};
