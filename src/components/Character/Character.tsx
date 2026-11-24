import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { blobPath, roundRectPath, stripPath } from '../../art/paper';
import { subscribePointer } from '../../art/pointer';
import { getAvatar } from '../../game/avatars';
import { getPersonality, type Personality } from '../../game/personalities';
import type { AvatarId } from '../../game/types';
import { cx } from '../../utils/cx';
import styles from './Character.module.css';

export type Mood = 'idle' | 'aiming' | 'thinking' | 'reaching' | 'pulling' | 'happy' | 'sad';

/**
 * Gestes ponctuels, joués par-dessus l'humeur :
 * bâiller (longue attente), s'occuper (tic propre au personnage), encaisser (les bâtonnets arrivent).
 */
export type Gesture = 'yawn' | 'fidget' | 'catch';

interface CharacterProps {
  avatar: AvatarId;
  mood?: Mood;
  /** Côté vers lequel le personnage regarde (et tend le bras). */
  facing?: 'right' | 'left';
  /** Nombre de bâtonnets tenus en main. */
  holding?: number;
  /** Geste ponctuel en cours. */
  gesture?: Gesture | null;
  /** Regarde vers ce côté de l'écran (l'adversaire qui joue). */
  lookAt?: 'left' | 'right' | null;
  /** Fin de partie serrée : respiration et clignements un peu plus rapides. */
  tense?: boolean;
  /** Suit le curseur du regard quand il ne fait rien d'autre. */
  followPointer?: boolean;
  /** Texte alternatif ; sans lui le dessin est décoratif. */
  label?: string;
  className?: string;
}

/**
 * Rythme propre à chaque marionnette affichée : clignements, respiration et coups d'œil
 * ne tombent jamais en même temps d'un personnage à l'autre (ni d'une vignette à l'autre).
 */
const drawRhythm = (personality: Personality) => ({
  blinkCycle: personality.blink * (0.88 + Math.random() * 0.24),
  blinkDelay: -Math.random() * 6,
  doubleBlink: Math.random() < 0.35,
  breathDelay: -Math.random() * 3,
  glanceCycle: 7 + Math.random() * 6,
  glanceDelay: -Math.random() * 12,
});

/** Les pièces découpées d'une marionnette, calculées une fois par personnage. */
const cutPieces = (seed: number) => ({
  ground: blobPath(80, 193, 46, 5.5, seed, 0.05),
  torso: roundRectPath(30, 40, 100, 140, 46, seed + 1, 1.6),
  belly: blobPath(80, 143, 32, 25, seed + 2, 0.07),
  footLeft: blobPath(60, 184, 15, 8.5, seed + 3, 0.09),
  footRight: blobPath(100, 184, 15, 8.5, seed + 4, 0.09),
  eyeLeft: blobPath(64, 92, 13.5, 14.2, seed + 5, 0.06),
  eyeRight: blobPath(98, 92, 13.5, 14.2, seed + 6, 0.06),
  cheekLeft: blobPath(48, 114, 7, 6.2, seed + 7, 0.1),
  cheekRight: blobPath(114, 114, 7, 6.2, seed + 8, 0.1),
  arm: stripPath(13, 36, seed + 9),
  backArm: stripPath(12, 30, seed + 10),
  hand: blobPath(0, 40, 9.5, 9.2, seed + 11, 0.08),
  backHand: blobPath(0, 34, 8.4, 8.2, seed + 12, 0.08),
});

/**
 * Marionnette de papier découpé, en SVG. Chaque pièce (corps, ventre, yeux, bras, accessoire)
 * est une découpe posée sur la précédente, avec son ombre ; les bras pivotent sur une
 * attache parisienne. Les humeurs (attendre, réfléchir, tendre le bras, tirer, gagner, perdre)
 * sont jouées en CSS, image par image.
 */
export const Character = ({
  avatar,
  mood = 'idle',
  facing = 'right',
  holding = 0,
  gesture = null,
  lookAt = null,
  tense = false,
  followPointer = true,
  label,
  className,
}: CharacterProps) => {
  const look = getAvatar(avatar);
  const personality = getPersonality(avatar);
  const pieces = useMemo(() => cutPieces(look.seed), [look.seed]);
  const [rhythm] = useState(() => drawRhythm(personality));
  const wrapRef = useRef<HTMLDivElement>(null);

  // Le regard suit le curseur (souris), par petites poses : 2,6 px au plus, jamais en continu.
  useEffect(() => {
    if (!followPointer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    return subscribePointer((x, y) => {
      const el = wrapRef.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      const dx = clamp((x - (box.left + box.width / 2)) / (box.width * 2.5));
      const dy = clamp((y - (box.top + box.height * 0.46)) / (box.height * 2.5));
      el.style.setProperty('--gaze-x', `${((facing === 'left' ? -dx : dx) * 2.6).toFixed(2)}px`);
      el.style.setProperty('--gaze-y', `${(dy * 1.8).toFixed(2)}px`);
    });
  }, [facing, followPointer]);

  // Côté de l'écran converti dans le repère du dessin (retourné quand il regarde à gauche).
  const lookSign = lookAt ? (lookAt === 'left' ? -1 : 1) * (facing === 'left' ? -1 : 1) : 0;
  const colors = {
    '--body': look.color,
    '--shade': look.shade,
    '--belly': look.belly,
    '--accent': look.accent,
    '--idle-delay': `${rhythm.breathDelay.toFixed(2)}s`,
    '--blink-cycle': `${rhythm.blinkCycle.toFixed(2)}s`,
    '--blink-delay': `${rhythm.blinkDelay.toFixed(2)}s`,
    '--glance-cycle': `${rhythm.glanceCycle.toFixed(2)}s`,
    '--glance-delay': `${rhythm.glanceDelay.toFixed(2)}s`,
    '--breath-cycle': `${personality.breath}s`,
    '--look': lookSign,
  } as CSSProperties;

  return (
    <div
      ref={wrapRef}
      data-avatar={avatar}
      className={cx(
        styles.wrap,
        styles[mood],
        gesture && styles[gesture],
        lookAt && styles.looking,
        tense && styles.tense,
        rhythm.doubleBlink && styles.doubleBlink,
        className,
      )}
      style={colors}
    >
      <svg
        viewBox="0 0 160 200"
        className={cx(styles.svg, facing === 'left' && styles.flip)}
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
      >
        <path className={styles.ground} d={pieces.ground} />
        <g className={styles.figure}>
          <g className={styles.backArm}>
            <g transform="translate(38 116) rotate(22)">
              <path className={styles.limb} d={pieces.backArm} />
              <path className={styles.hand} d={pieces.backHand} />
            </g>
          </g>

          <path className={styles.foot} d={pieces.footLeft} />
          <path className={cx(styles.foot, styles.footTap)} d={pieces.footRight} />
          <path className={styles.torso} d={pieces.torso} />
          <path className={styles.grain} d={pieces.torso} />
          <path className={styles.belly} d={pieces.belly} filter="url(#paper-lift)" />

          <g className={styles.eyes} filter="url(#paper-lift)">
            <path className={styles.eyeWhite} d={pieces.eyeLeft} />
            <path className={styles.eyeWhite} d={pieces.eyeRight} />
            <g className={styles.gaze}>
              <g className={styles.pupils}>
                <circle cx="68" cy="93" r="6.4" />
                <circle cx="102" cy="93" r="6.4" />
                <circle className={styles.glint} cx="70.2" cy="90.4" r="1.9" />
                <circle className={styles.glint} cx="104.2" cy="90.4" r="1.9" />
              </g>
            </g>
          </g>
          <path className={styles.cheek} d={pieces.cheekLeft} />
          <path className={styles.cheek} d={pieces.cheekRight} />
          {gesture === 'yawn' ? (
            <g className={styles.yawnMouth}>
              <ellipse className={styles.mouth} cx="82" cy="121" rx="8.6" ry="11" />
              <ellipse className={styles.tongue} cx="82" cy="127.5" rx="5" ry="3.2" />
            </g>
          ) : (
            <Mouth mood={mood} />
          )}
          <Accessory avatar={avatar} seed={look.seed} />
          <Fastener x={38} y={116} />

          <g className={styles.arm}>
            <g transform="translate(122 116) rotate(-22)" filter="url(#paper-lift)">
              {holding > 0 && <HeldSticks count={holding} />}
              <path className={styles.limb} d={pieces.arm} />
              <path className={styles.hand} d={pieces.hand} />
            </g>
            <Fastener x={122} y={116} />
          </g>
        </g>
      </svg>
      {mood === 'thinking' && (
        <span className={cx(styles.bubble, facing === 'left' && styles.bubbleLeft)} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}
    </div>
  );
};

/** Attache parisienne en laiton : le pivot visible d'un bras de marionnette. */
const Fastener = ({ x, y }: { x: number; y: number }) => (
  <g className={styles.fastener}>
    <circle cx={x} cy={y} r="3.6" />
    <circle className={styles.fastenerShine} cx={x - 1} cy={y - 1.1} r="1.2" />
  </g>
);

const Mouth = ({ mood }: { mood: Mood }) => {
  switch (mood) {
    case 'thinking':
      return <ellipse className={styles.mouth} cx="86" cy="120" rx="3.6" ry="4.6" />;
    case 'aiming':
    case 'reaching':
      return <path className={styles.mouth} d="M70.5 118.4 Q82 115 93.5 117.2 Q82 121.6 70.5 118.4 Z" />;
    case 'pulling':
      return (
        <g>
          <path className={styles.mouth} d="M68.8 112.6 Q82 110.6 95.2 112.8 Q96.4 124 82 124.6 Q67.6 124.2 68.8 112.6 Z" />
          <path className={styles.teeth} d="M71.4 116.2 Q82 114.6 92.6 116.4 L92.2 119.2 Q82 117.8 71.8 119.4 Z" />
        </g>
      );
    case 'happy':
      return (
        <g>
          <path className={styles.mouth} d="M65.6 111.2 Q82 108.6 98.4 111.4 Q96.4 133.6 82 134 Q67.4 133.4 65.6 111.2 Z" />
          <path className={styles.tongue} d="M74.4 127.2 Q82 121.6 89.8 127.4 Q86.4 132.4 82 132.4 Q77.4 132.2 74.4 127.2 Z" />
        </g>
      );
    case 'sad':
      return <path className={styles.mouth} d="M69.4 125.6 Q82 112.8 94.6 125.4 Q82 119.6 69.4 125.6 Z" />;
    case 'idle':
      return <path className={styles.mouth} d="M69.6 114.4 Q82 129.2 94.4 114.6 Q82 121.6 69.6 114.4 Z" />;
  }
};

const Accessory = ({ avatar, seed }: { avatar: AvatarId; seed: number }) => {
  const shapes = useMemo(
    () => ({
      pompom: blobPath(80, 15, 9.5, 9, seed + 20, 0.12),
      ball: blobPath(85, 12, 7.8, 7.6, seed + 21, 0.1),
      knot: blobPath(98, 38, 6.6, 6.2, seed + 22, 0.1),
      band: roundRectPath(32, 53, 96, 16, 7, seed + 23, 0.9),
    }),
    [seed],
  );

  switch (avatar) {
    case 'pepin':
      return (
        <g filter="url(#paper-lift)">
          <path className={styles.accent} d="M36.4 62.4 C35.2 31.6 55.8 17.2 80.6 17.6 C105.4 18 125.8 31.4 124.2 62.8 Z" />
          <path className={styles.grain} d="M36.4 62.4 C35.2 31.6 55.8 17.2 80.6 17.6 C105.4 18 125.8 31.4 124.2 62.8 Z" />
          <path className={styles.accentBand} d={shapes.band} />
          <path className={cx(styles.accentBand, styles.pompom)} d={shapes.pompom} />
        </g>
      );
    case 'mousse':
      return (
        <g className={styles.antenna} filter="url(#paper-lift)">
          <path className={styles.stem} d="M78.6 44 L77.4 28 Q78.6 18.4 83.4 13 L86 14.8 Q81.6 20 81.2 28.6 L82.4 44 Z" />
          <path className={styles.accent} d={shapes.ball} />
        </g>
      );
    case 'zeste':
      return (
        <g filter="url(#paper-lift)">
          <path
            className={styles.hair}
            d="M40.6 61.4 L46.2 29.6 L60.8 45.6 L71.2 14.6 L85.6 41.8 L100.4 18.8 L106.8 45.4 L123.4 30.8 L120.6 62.6 Q80 46.8 40.6 61.4 Z"
          />
        </g>
      );
    case 'bleuet':
      return (
        <g filter="url(#paper-lift)">
          <path className={styles.hair} d="M66.4 45.2 Q70.6 24.2 91.4 28.4 Q96.4 29.8 93.8 33.2 Q84.2 31.4 86.6 43.6 Z" />
          <path
            className={styles.glasses}
            fillRule="evenodd"
            d="M64 74 A18 18 0 1 0 64.01 74 Z M64 79 A13 13 0 1 1 63.99 79 Z M98 74 A18 18 0 1 0 98.01 74 Z M98 79 A13 13 0 1 1 97.99 79 Z M78.6 88.6 Q81 84.6 83.4 88.6 L83.4 91 Q81 88.4 78.6 91 Z"
          />
        </g>
      );
    case 'praline':
      return (
        <g filter="url(#paper-lift)">
          <path className={cx(styles.accent, styles.bowWing)} d="M98 38 L79.4 26.4 Q73.8 38.6 79.6 50.2 Z" />
          <path className={cx(styles.accent, styles.bowWing, styles.bowWingRight)} d="M98 38 L116.6 26.2 Q122.4 38.4 116.4 50 Z" />
          <path className={styles.accentBand} d={shapes.knot} />
        </g>
      );
  }
};

/** Bâtonnets de carton tenus dans la main pendant le tirage. */
const HeldSticks = ({ count }: { count: number }) => (
  <g>
    {Array.from({ length: count }, (_, i) => (
      <g key={i} transform={`translate(${-2 + i * 3} ${40 - i * 2}) rotate(${-100 + i * 12})`}>
        <path className={styles.heldWood} d="M-2.6 0 L2.4 -0.4 L2.9 52 L-2.2 52.4 Z" />
        <ellipse className={styles.heldHead} cx="0.2" cy="53" rx="4.6" ry="6.6" />
      </g>
    ))}
  </g>
);
