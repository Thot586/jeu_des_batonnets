import type { AvatarId } from '../game/types';

/**
 * Bruitages synthétisés avec Web Audio : aucun fichier son à charger.
 * Tout vient du papier : tapotement de carton, glissement de bandes, froissement du rideau,
 * cartes qu'on distribue, et un petit air de kalimba pour la fin de manche.
 *
 * Pour qu'on ne se lasse pas, aucun son n'est jamais rejoué à l'identique :
 * - chaque bruitage existe en plusieurs variantes, et la même ne sort jamais deux fois de suite ;
 * - à l'intérieur d'une variante, hauteur, durée, volume et départ varient un peu ;
 * - chaque personnage tire à sa façon (Mousse frotte lentement, Zeste arrache d'un coup sec) ;
 * - le son vient du côté du joueur qui tire (stéréo) ;
 * - quand les bâtonnets tombent dans la pile, une note de bois monte d'un cran à chaque tirage :
 *   la manche se joue comme une petite mélodie qui grimpe vers la fin ;
 * - un son répété souvent se fait un peu plus discret (on s'y habitue, il s'efface).
 *
 * Chaque son est décrit par renderSound(), qui écrit dans n'importe quel contexte audio :
 * le jeu l'envoie aux haut-parleurs, et les tests le rendent hors ligne pour mesurer les niveaux.
 */

export type SoundName = 'tap' | 'select' | 'slide' | 'drop' | 'deal' | 'turn' | 'win' | 'lose' | 'curtain';

export interface SoundOptions {
  /** Nombre de bâtonnets concernés. */
  count?: number;
  /** Le personnage qui tire : chacun a sa manière de faire glisser le papier. */
  voice?: AvatarId;
  /** Position dans l'espace, de -1 (gauche) à 1 (droite). */
  pan?: number;
  /** Avancement de la manche, de 0 (tas plein) à 1 (dernier bâtonnet pris). */
  progress?: number;
  /** Victoires d'affilée du gagnant. */
  streak?: number;
}

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

/** Volume général : laisse de la marge sous 0 dBFS même quand plusieurs sons se chevauchent. */
const MASTER_GAIN = 0.5;
/** Part de la petite réverbération de pièce (chaleur, moins de sécheresse à la longue). */
const ROOM_GAIN = 0.14;

let context: AudioContext | null = null;
let master: GainNode | null = null;

/**
 * Le contexte audio n'est créé qu'après un premier geste de l'utilisateur
 * (règle des navigateurs) : avant cela, les sons sont simplement ignorés.
 */
let unlocked = false;

export const unlockAudio = (): void => {
  unlocked = true;
  const ctx = getContext();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
};

/** Réponse d'une petite pièce : un souffle stéréo qui s'éteint en 0,45 s, adouci dans les aigus. */
const roomImpulse = (ctx: BaseAudioContext): AudioBuffer => {
  const length = Math.round(ctx.sampleRate * 0.45);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let smooth = 0;
    for (let i = 0; i < length; i++) {
      smooth += (Math.random() * 2 - 1 - smooth) * 0.35;
      data[i] = smooth * (1 - i / length) ** 3;
    }
  }
  return buffer;
};

const getContext = (): AudioContext | null => {
  if (!unlocked || typeof window === 'undefined') return null;
  if (context) return context;
  const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  master = context.createGain();
  master.gain.value = MASTER_GAIN;
  master.connect(context.destination);
  const room = context.createConvolver();
  room.buffer = roomImpulse(context);
  const wet = context.createGain();
  wet.gain.value = ROOM_GAIN;
  master.connect(room).connect(wet).connect(context.destination);
  return context;
};

/* ------------------------------------------------------------------------------------------ */
/* Hasard maîtrisé                                                                            */
/* ------------------------------------------------------------------------------------------ */

/** Une valeur qui varie de plus ou moins `amount` (0,1 = ±10 %). */
const vary = (value: number, amount: number): number => value * (1 + (Math.random() * 2 - 1) * amount);
/** Un écart de volume aléatoire, en décibels. */
const varyDb = (db: number): number => 10 ** (((Math.random() * 2 - 1) * db) / 20);

/**
 * Sac de variantes : on tire au hasard, mais jamais la même que la fois précédente
 * (pour un même son et une même voix).
 */
const lastVariant = new Map<string, number>();
const pickVariant = (key: string, count: number): number => {
  if (count <= 1) return 0;
  const previous = lastVariant.get(key);
  let next = Math.floor(Math.random() * (previous === undefined ? count : count - 1));
  if (previous !== undefined && next >= previous) next += 1;
  lastVariant.set(key, next);
  return next;
};

/* ------------------------------------------------------------------------------------------ */
/* Matières                                                                                   */
/* ------------------------------------------------------------------------------------------ */

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

const noiseFor = (ctx: BaseAudioContext): AudioBuffer => {
  const cached = noiseBuffers.get(ctx);
  if (cached) return cached;
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffers.set(ctx, buffer);
  return buffer;
};

interface NoiseOptions {
  at?: number;
  duration: number;
  type: BiquadFilterType;
  from: number;
  to?: number;
  q?: number;
  gain: number;
  attack?: number;
}

/** Souffle filtré : le bruit du papier. */
const paperNoise = (ctx: BaseAudioContext, out: AudioNode, o: NoiseOptions): void => {
  const start = ctx.currentTime + (o.at ?? 0);
  const source = ctx.createBufferSource();
  source.buffer = noiseFor(ctx);
  source.playbackRate.value = 0.8 + Math.random() * 0.4;
  const filter = ctx.createBiquadFilter();
  filter.type = o.type;
  filter.Q.value = o.q ?? 1;
  filter.frequency.setValueAtTime(o.from, start);
  if (o.to) filter.frequency.exponentialRampToValueAtTime(o.to, start + o.duration);
  const env = ctx.createGain();
  const attack = Math.min(o.attack ?? 0.004, o.duration * 0.6);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(o.gain, start + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, start + o.duration);
  source.connect(filter).connect(env).connect(out);
  source.start(start, Math.random() * 0.5);
  source.stop(start + o.duration + 0.02);
};

interface ToneOptions {
  at?: number;
  freq: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
}

/** Note pincée, façon kalimba : fondamentale douce et un partiel aigu qui s'éteint vite. */
const pluck = (ctx: BaseAudioContext, out: AudioNode, o: ToneOptions): void => {
  const start = ctx.currentTime + (o.at ?? 0);
  const partials: Array<[number, number, number]> = [
    [1, 1, o.duration],
    [2.76, 0.28, o.duration * 0.35],
    [5.4, 0.08, o.duration * 0.12],
  ];
  for (const [ratio, level, length] of partials) {
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.value = o.freq * ratio;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(o.gain * level, start + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(env).connect(out);
    osc.start(start);
    osc.stop(start + length + 0.02);
  }
};

/** Note de bois, façon petit xylophone : très courte, sans résonance. */
const tock = (ctx: BaseAudioContext, out: AudioNode, at: number, freq: number, gain: number): void => {
  const start = ctx.currentTime + at;
  const partials: Array<[number, number, number]> = [
    [1, 1, 0.22],
    [3.93, 0.22, 0.05],
  ];
  for (const [ratio, level, length] of partials) {
    const osc = ctx.createOscillator();
    osc.frequency.value = freq * ratio;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(gain * level, start + 0.003);
    env.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(env).connect(out);
    osc.start(start);
    osc.stop(start + length + 0.02);
  }
};

/** Petit choc sourd : carton posé sur la table. */
const thump = (ctx: BaseAudioContext, out: AudioNode, at: number, freq: number, gain: number): void => {
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  const pitch = vary(freq, 0.07);
  osc.frequency.setValueAtTime(pitch, start);
  osc.frequency.exponentialRampToValueAtTime(pitch * vary(0.55, 0.08), start + 0.07);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.004);
  env.gain.exponentialRampToValueAtTime(0.0001, start + vary(0.09, 0.15));
  osc.connect(env).connect(out);
  osc.start(start);
  osc.stop(start + 0.14);
};

/* ------------------------------------------------------------------------------------------ */
/* Voix des personnages et gammes                                                             */
/* ------------------------------------------------------------------------------------------ */

/** Manière de faire glisser le papier : grave et lente, ou vive et claire. */
interface Voice {
  /** Fréquences de départ et d'arrivée du frottement. */
  low: number;
  high: number;
  /** Durée du glissement, en secondes. */
  length: number;
  /** Montée du son : un geste lent commence doucement. */
  attack: number;
  /** Écart entre deux bandes quand on en tire plusieurs. */
  spread: number;
  /** Petit grain aigu par-dessus (papier plus ou moins sec). */
  grain: number;
}

const VOICES: Record<AvatarId, Voice> = {
  pepin: { low: 850, high: 3100, length: 0.26, attack: 0.03, spread: 0.045, grain: 0.05 },
  mousse: { low: 520, high: 1900, length: 0.44, attack: 0.11, spread: 0.08, grain: 0.02 },
  zeste: { low: 1200, high: 4300, length: 0.19, attack: 0.015, spread: 0.03, grain: 0.07 },
  bleuet: { low: 680, high: 2400, length: 0.36, attack: 0.07, spread: 0.07, grain: 0.03 },
  praline: { low: 1000, high: 3600, length: 0.3, attack: 0.04, spread: 0.055, grain: 0.07 },
};

const NOTES = {
  G3: 196,
  A3: 220,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G4: 392,
  A4: 440,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880,
  C6: 1046.5,
  D6: 1174.66,
  E6: 1318.51,
  G6: 1567.98,
};

/** Gamme pentatonique : quelles que soient les notes tirées, elles vont bien ensemble. */
const CLIMB = [NOTES.G3, NOTES.A3, NOTES.C4, NOTES.D4, NOTES.E4, NOTES.G4, NOTES.A4, NOTES.C5, NOTES.D5, NOTES.E5];

/* ------------------------------------------------------------------------------------------ */
/* Bruitages                                                                                  */
/* ------------------------------------------------------------------------------------------ */

/** Une bande de papier qu'on tire : quatre gestes possibles, colorés par la voix du personnage. */
const pullStrip = (ctx: BaseAudioContext, out: AudioNode, voice: Voice, variant: number, at: number, gain: number) => {
  const low = vary(voice.low, 0.1);
  const high = vary(voice.high, 0.1);
  const length = vary(voice.length, 0.15);
  const common = { type: 'bandpass' as BiquadFilterType, q: vary(0.9, 0.2) };
  switch (variant) {
    case 0: // glissé : un seul geste régulier
      paperNoise(ctx, out, { ...common, at, duration: length, from: low, to: high, gain, attack: voice.attack });
      break;
    case 1: // en deux temps : la bande accroche, puis part
      paperNoise(ctx, out, { ...common, at, duration: 0.06, from: low * 0.9, gain: gain * 0.55, attack: 0.01 });
      paperNoise(ctx, out, { ...common, at: at + vary(0.08, 0.2), duration: length * 0.85, from: low, to: high, gain, attack: voice.attack * 0.7 });
      break;
    case 2: // frotté : ça monte, puis ça retombe en fin de course
      paperNoise(ctx, out, { ...common, at, duration: length * 0.6, from: low, to: high, gain, attack: voice.attack });
      paperNoise(ctx, out, { ...common, at: at + length * 0.5, duration: length * 0.5, from: high, to: low * 1.4, gain: gain * 0.6, attack: 0.02 });
      break;
    default: // sec : un petit clic d'ongle, puis un geste rapide
      paperNoise(ctx, out, { type: 'highpass', at, duration: 0.018, from: 3800, gain: gain * 0.7, q: 0.7 });
      paperNoise(ctx, out, { ...common, at: at + 0.012, duration: length * 0.7, from: low * 1.1, to: high * 1.1, gain, attack: 0.012 });
  }
  // Le grain du papier : un souffle très aigu, plus ou moins présent selon le personnage.
  if (voice.grain > 0.03) {
    paperNoise(ctx, out, { type: 'highpass', at: at + 0.02, duration: length * 0.8, from: 5200, gain: gain * voice.grain * 4, q: 0.5, attack: voice.attack });
  }
};

/**
 * Niveau de chaque son (gain linéaire), réglé par mesure hors ligne pour une hiérarchie claire,
 * crêtes visées : victoire -6 dBFS, défaite -8, impact -10, actions -12, distribution et clic -14,
 * sélection -16. Voir README, section Son.
 */
const LEVELS: Record<SoundName, number> = {
  tap: 3,
  select: 2.95,
  slide: 6,
  drop: 2.8,
  deal: 5.1,
  turn: 3.2,
  win: 3.27,
  lose: 4.4,
  curtain: 5.8,
};

/** Écrit un son dans un contexte audio (en direct ou hors ligne). */
export const renderSound = (
  ctx: BaseAudioContext,
  destination: AudioNode,
  name: SoundName,
  options: SoundOptions = {},
): void => {
  const count = options.count ?? 1;
  const voiceName = options.voice ?? 'pepin';
  const voice = VOICES[voiceName];

  const out = ctx.createGain();
  // Jamais deux fois exactement le même volume (± 1,5 dB).
  out.gain.value = LEVELS[name] * varyDb(1.5);
  if (options.pan && typeof ctx.createStereoPanner === 'function') {
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, options.pan));
    out.connect(panner).connect(destination);
  } else {
    out.connect(destination);
  }

  switch (name) {
    case 'tap': {
      const variant = pickVariant('tap', 3);
      const color = [2400, 2050, 2850][variant];
      paperNoise(ctx, out, { duration: vary(0.035, 0.2), type: 'bandpass', from: vary(color, 0.06), q: 1.4, gain: 0.22 });
      thump(ctx, out, 0, [210, 190, 235][variant], 0.12);
      break;
    }
    case 'select': {
      const variant = pickVariant('select', 3);
      paperNoise(ctx, out, { duration: vary(0.03, 0.2), type: 'bandpass', from: vary([3600, 3100, 4100][variant], 0.05), q: 2, gain: 0.16 });
      thump(ctx, out, 0, [320, 290, 350][variant], 0.08);
      break;
    }
    case 'slide': {
      const variant = pickVariant(`slide-${voiceName}`, 4);
      const strips = Math.min(count, 4);
      let at = 0;
      for (let i = 0; i < strips; i++) {
        // Chaque bande suivante part un peu après, un peu moins fort.
        pullStrip(ctx, out, voice, variant, at, 0.2 * 0.86 ** i);
        at += vary(voice.spread, 0.35);
      }
      break;
    }
    case 'drop': {
      const variant = pickVariant(`drop-${voiceName}`, 3);
      const strips = Math.min(count, 4);
      // Les bandes se posent l'une après l'autre : petits tapotements avant le choc.
      for (let i = 1; i < strips; i++) {
        paperNoise(ctx, out, { at: i * vary(0.028, 0.3), duration: 0.025, type: 'bandpass', from: vary(1900, 0.2), q: 1.6, gain: 0.08 });
      }
      const land = (strips - 1) * 0.028;
      paperNoise(ctx, out, { at: land, duration: vary(0.05, 0.2), type: 'lowpass', from: vary(1400, 0.15), q: 0.7, gain: 0.25 });
      thump(ctx, out, land, 150, 0.2);
      if (variant === 1) thump(ctx, out, land + vary(0.06, 0.2), 175, 0.06); // petit rebond
      if (variant === 2) paperNoise(ctx, out, { at: land + 0.02, duration: 0.09, type: 'bandpass', from: 1100, to: 700, q: 0.9, gain: 0.07 }); // la pile se tasse
      // La note de bois monte avec l'avancement de la manche.
      if (options.progress !== undefined) {
        const step = Math.round(Math.max(0, Math.min(1, options.progress)) * (CLIMB.length - 1));
        tock(ctx, out, land + 0.01, CLIMB[step], 0.05);
      }
      break;
    }
    case 'deal':
      // Les bâtonnets tombent sur la table : une pluie de petits tapotements qui s'espacent.
      for (let i = 0; i < Math.min(count, 12); i++) {
        const at = i * vary(0.045, 0.15) + Math.random() * 0.02;
        paperNoise(ctx, out, { at, duration: 0.03, type: 'bandpass', from: 1800 + Math.random() * 1400, q: 1.6, gain: 0.09 });
        if (i % 3 === 0) thump(ctx, out, at, 180 + Math.random() * 60, 0.05);
      }
      break;
    case 'turn': {
      // Deux notes, choisies parmi plusieurs motifs ; le joueur de droite sonne un peu plus haut.
      const motifs: Array<[number, number]> = [
        [NOTES.E5, NOTES.A4],
        [NOTES.D5, NOTES.G4],
        [NOTES.A4, NOTES.D5],
        [NOTES.G4, NOTES.C5],
        [NOTES.C5, NOTES.E5],
      ];
      const [first, second] = motifs[pickVariant('turn', motifs.length)];
      const octave = (options.pan ?? 0) > 0 ? 1.122 : 1; // un ton plus haut à droite
      pluck(ctx, out, { freq: first * octave, duration: 0.6, gain: 0.12 });
      pluck(ctx, out, { at: vary(0.085, 0.15), freq: second * octave, duration: 0.7, gain: 0.09 });
      break;
    }
    case 'win': {
      const variants: number[][] = [
        [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6],
        [NOTES.G4, NOTES.C5, NOTES.E5, NOTES.G5],
        [NOTES.E5, NOTES.G5, NOTES.C6, NOTES.E6],
      ];
      const variant = pickVariant('win', variants.length);
      const notes = variants[variant];
      const pace = vary(0.095, 0.1);
      notes.forEach((freq, i) => pluck(ctx, out, { at: i * pace, freq, duration: 0.9, gain: 0.16 }));
      const top = notes[notes.length - 1];
      pluck(ctx, out, { at: pace * 4.7, freq: top / 1.335, duration: 1.2, gain: 0.1 });
      pluck(ctx, out, { at: pace * 4.7, freq: top, duration: 1.4, gain: 0.1 });
      // Série de victoires : une petite pluie d'étincelles en plus, de plus en plus longue.
      if ((options.streak ?? 0) >= 3) {
        const sparkle = [NOTES.C6, NOTES.D6, NOTES.E6, NOTES.G6, NOTES.E6, NOTES.G6];
        const length = Math.min(sparkle.length, 2 + (options.streak ?? 0));
        sparkle.slice(0, length).forEach((freq, i) => pluck(ctx, out, { at: 0.75 + i * 0.06, freq, duration: 0.35, gain: 0.05 }));
      }
      break;
    }
    case 'lose': {
      // Trois notes qui descendent, douces : on accompagne la défaite, on ne la souligne pas.
      const variants: number[][] = [
        [NOTES.G4, NOTES.E4, NOTES.C4],
        [NOTES.A4, NOTES.G4, NOTES.E4],
        [NOTES.E4, NOTES.D4, NOTES.C4],
      ];
      const pace = vary(0.16, 0.12);
      variants[pickVariant('lose', variants.length)].forEach((freq, i) =>
        pluck(ctx, out, { at: i * pace, freq, duration: 0.9, gain: 0.13, type: 'triangle' }),
      );
      break;
    }
    case 'curtain':
      paperNoise(ctx, out, { duration: vary(0.6, 0.1), type: 'bandpass', from: vary(380, 0.1), to: vary(1500, 0.1), q: 0.6, gain: 0.16, attack: 0.18 });
      paperNoise(ctx, out, { at: 0.08, duration: 0.5, type: 'highpass', from: 3200, q: 0.5, gain: 0.05, attack: 0.12 });
      break;
  }
};


/**
 * Accoutumance : un son déjà entendu plusieurs fois dans les dernières secondes
 * se fait un peu plus discret (0,6 dB par répétition, 3 dB au plus), puis retrouve son niveau.
 * Les moments rares (fin de manche, rideau, distribution) gardent toute leur force.
 */
const HABITUATION_WINDOW = 8000;
const recentPlays = new Map<SoundName, number[]>();
const habituation = (name: SoundName): number => {
  if (name === 'win' || name === 'lose' || name === 'curtain' || name === 'deal') return 1;
  const now = performance.now();
  const recent = (recentPlays.get(name) ?? []).filter((time) => now - time < HABITUATION_WINDOW);
  recent.push(now);
  recentPlays.set(name, recent);
  return 10 ** (-Math.min(3, (recent.length - 1) * 0.6) / 20);
};

export const SOUND_NAMES: readonly SoundName[] = ['tap', 'select', 'slide', 'drop', 'deal', 'turn', 'win', 'lose', 'curtain'];
export { MASTER_GAIN };

export const playSound = (name: SoundName, options?: SoundOptions): void => {
  const ctx = getContext();
  if (!ctx || !master) return;
  const bus = ctx.createGain();
  bus.gain.value = habituation(name);
  bus.connect(master);
  renderSound(ctx, bus, name, options);
};
