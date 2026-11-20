import type { CSSProperties } from 'react';
import { getAvatar } from '../../game/avatars';
import type { AvatarId } from '../../game/types';
import { cx } from '../../utils/cx';
import styles from './Character.module.css';

export type Mood = 'idle' | 'thinking' | 'reaching' | 'pulling' | 'happy' | 'sad';

interface CharacterProps {
  avatar: AvatarId;
  mood?: Mood;
  /** Côté vers lequel le personnage regarde (et tend le bras). */
  facing?: 'right' | 'left';
  /** Nombre de bâtonnets tenus en main. */
  holding?: number;
  /** Texte alternatif ; sans lui le dessin est décoratif. */
  label?: string;
  className?: string;
}

/**
 * Personnage dessiné en SVG. Chaque partie (corps, yeux, bras) est un groupe
 * animé en CSS selon l'humeur : attendre, réfléchir, tendre le bras, tirer, gagner, perdre.
 */
export const Character = ({
  avatar,
  mood = 'idle',
  facing = 'right',
  holding = 0,
  label,
  className,
}: CharacterProps) => {
  const look = getAvatar(avatar);
  const colors = {
    '--body': look.color,
    '--shade': look.shade,
    '--belly': look.belly,
  } as CSSProperties;

  return (
    <div className={cx(styles.wrap, styles[mood], className)} style={colors}>
      <svg
        viewBox="0 0 160 200"
        className={cx(styles.svg, facing === 'left' && styles.flip)}
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
      >
        <ellipse className={styles.shadow} cx="80" cy="193" rx="46" ry="6" />
        <g className={styles.figure}>
          <path className={styles.limb} d="M40 118 Q26 132 26 152" />
          <rect className={styles.torso} x="30" y="40" width="100" height="142" rx="50" />
          <ellipse className={styles.belly} cx="80" cy="142" rx="34" ry="28" />
          <ellipse className={styles.foot} cx="60" cy="184" rx="15" ry="9" />
          <ellipse className={styles.foot} cx="100" cy="184" rx="15" ry="9" />

          <g className={styles.eyes}>
            <circle className={styles.eyeWhite} cx="64" cy="92" r="13" />
            <circle className={styles.eyeWhite} cx="98" cy="92" r="13" />
            <g className={styles.pupils}>
              <circle cx="68" cy="93" r="6.5" />
              <circle cx="102" cy="93" r="6.5" />
              <circle className={styles.glint} cx="70" cy="90" r="2" />
              <circle className={styles.glint} cx="104" cy="90" r="2" />
            </g>
          </g>
          <circle className={styles.cheek} cx="49" cy="114" r="7" />
          <circle className={styles.cheek} cx="113" cy="114" r="7" />
          <Mouth mood={mood} />
          <Accessory avatar={avatar} />

          <g className={styles.arm}>
            {holding > 0 && <HeldSticks count={holding} />}
            <path className={styles.limb} d="M124 116 Q138 130 140 150" />
            <circle className={styles.hand} cx="140" cy="152" r="9.5" />
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

const Mouth = ({ mood }: { mood: Mood }) => {
  switch (mood) {
    case 'thinking':
      return <ellipse className={styles.mouthFill} cx="86" cy="120" rx="4" ry="5" />;
    case 'reaching':
      return <path className={styles.mouth} d="M72 120 Q82 117 93 119" />;
    case 'pulling':
      return (
        <g>
          <rect className={styles.mouthFill} x="69" y="112" width="26" height="12" rx="6" />
          <path className={styles.teeth} d="M72 118 H92" />
        </g>
      );
    case 'happy':
      return (
        <g>
          <path className={styles.mouthFill} d="M66 112 Q82 138 98 112 Z" />
          <ellipse className={styles.tongue} cx="82" cy="124" rx="7" ry="4" />
        </g>
      );
    case 'sad':
      return <path className={styles.mouth} d="M70 125 Q82 114 94 125" />;
    case 'idle':
      return <path className={styles.mouth} d="M70 116 Q82 127 94 116" />;
  }
};

const Accessory = ({ avatar }: { avatar: AvatarId }) => {
  switch (avatar) {
    case 'pepin':
      return (
        <g>
          <path className={styles.hat} d="M36 62 C36 30 56 17 80 17 C104 17 124 30 124 62 Z" />
          <rect className={styles.hatBand} x="33" y="54" width="94" height="15" rx="7.5" />
          <circle className={styles.hatBand} cx="80" cy="15" r="9" />
        </g>
      );
    case 'mousse':
      return (
        <g className={styles.antenna}>
          <path className={styles.antennaStem} d="M80 42 Q78 26 84 14" />
          <circle className={styles.antennaBall} cx="84" cy="12" r="7.5" />
        </g>
      );
    case 'zeste':
      return (
        <path
          className={styles.hair}
          d="M42 60 L48 30 L62 46 L72 16 L86 42 L100 20 L106 46 L122 32 L120 62 Q80 44 42 60 Z"
        />
      );
    case 'bleuet':
      return (
        <g>
          <path className={styles.curl} d="M68 44 Q74 24 92 30 Q84 34 86 42" />
          <circle className={styles.glasses} cx="64" cy="92" r="17" />
          <circle className={styles.glasses} cx="98" cy="92" r="17" />
          <path className={styles.glasses} d="M78 86 Q81 82 84 86" />
        </g>
      );
    case 'praline':
      return (
        <g>
          <path className={styles.bow} d="M98 38 L80 27 Q75 38 80 49 Z" />
          <path className={styles.bow} d="M98 38 L116 27 Q121 38 116 49 Z" />
          <circle className={styles.bowKnot} cx="98" cy="38" r="6.5" />
        </g>
      );
  }
};

/** Petits bâtonnets tenus dans la main pendant le tirage. */
const HeldSticks = ({ count }: { count: number }) => (
  <g>
    {Array.from({ length: count }, (_, i) => (
      <g key={i} transform={`translate(${138 + i * 3} ${150 - i * 2}) rotate(${48 + i * 14})`}>
        <rect className={styles.heldWood} x="-2.6" y="-50" width="5.2" height="54" rx="2.6" />
        <ellipse className={styles.heldHead} cx="0" cy="-50" rx="4.6" ry="7" />
      </g>
    ))}
  </g>
);
