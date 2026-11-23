/**
 * Bruitages synthétisés avec Web Audio : aucun fichier son à charger.
 * Tout vient du papier : tapotement de carton, glissement de bandes, froissement du rideau,
 * et un petit air de kalimba pour la fin de manche.
 */

export type SoundName = 'tap' | 'select' | 'slide' | 'drop' | 'turn' | 'win' | 'lose' | 'curtain';

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;

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

const getContext = (): AudioContext | null => {
  if (!unlocked || typeof window === 'undefined') return null;
  if (context) return context;
  const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  master = context.createGain();
  master.gain.value = 0.55;
  master.connect(context.destination);
  noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return context;
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
const paperNoise = (ctx: AudioContext, o: NoiseOptions): void => {
  if (!noise || !master) return;
  const start = ctx.currentTime + (o.at ?? 0);
  const source = ctx.createBufferSource();
  source.buffer = noise;
  source.playbackRate.value = 0.8 + Math.random() * 0.4;
  const filter = ctx.createBiquadFilter();
  filter.type = o.type;
  filter.Q.value = o.q ?? 1;
  filter.frequency.setValueAtTime(o.from, start);
  if (o.to) filter.frequency.exponentialRampToValueAtTime(o.to, start + o.duration);
  const env = ctx.createGain();
  const attack = o.attack ?? 0.004;
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(o.gain, start + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, start + o.duration);
  source.connect(filter).connect(env).connect(master);
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
const pluck = (ctx: AudioContext, o: ToneOptions): void => {
  if (!master) return;
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
    osc.connect(env).connect(master);
    osc.start(start);
    osc.stop(start + length + 0.02);
  }
};

/** Petit choc sourd : carton posé sur la table. */
const thump = (ctx: AudioContext, at: number, freq: number, gain: number): void => {
  if (!master) return;
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.55, start + 0.07);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.004);
  env.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
  osc.connect(env).connect(master);
  osc.start(start);
  osc.stop(start + 0.12);
};

const NOTES = { C4: 261.63, E4: 329.63, G4: 392, A4: 440, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, C6: 1046.5 };

export const playSound = (name: SoundName, count = 1): void => {
  const ctx = getContext();
  if (!ctx) return;

  switch (name) {
    case 'tap':
      paperNoise(ctx, { duration: 0.035, type: 'bandpass', from: 2400, q: 1.4, gain: 0.22 });
      thump(ctx, 0, 210, 0.12);
      break;
    case 'select':
      paperNoise(ctx, { duration: 0.03, type: 'bandpass', from: 3600, q: 2, gain: 0.16 });
      thump(ctx, 0, 320, 0.08);
      break;
    case 'slide':
      for (let i = 0; i < Math.min(count, 4); i++) {
        paperNoise(ctx, {
          at: i * 0.05,
          duration: 0.32,
          type: 'bandpass',
          from: 700,
          to: 2900,
          q: 0.9,
          gain: 0.2,
          attack: 0.06,
        });
      }
      break;
    case 'drop':
      paperNoise(ctx, { duration: 0.05, type: 'lowpass', from: 1400, q: 0.7, gain: 0.25 });
      thump(ctx, 0, 150, 0.2);
      break;
    case 'turn':
      pluck(ctx, { freq: NOTES.E5, duration: 0.6, gain: 0.12 });
      pluck(ctx, { at: 0.08, freq: NOTES.A4, duration: 0.7, gain: 0.09 });
      break;
    case 'win':
      [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6].forEach((freq, i) =>
        pluck(ctx, { at: i * 0.095, freq, duration: 0.9, gain: 0.16 }),
      );
      pluck(ctx, { at: 0.45, freq: NOTES.G5, duration: 1.2, gain: 0.1 });
      pluck(ctx, { at: 0.45, freq: NOTES.C6, duration: 1.4, gain: 0.1 });
      break;
    case 'lose':
      [NOTES.G4, NOTES.E4, NOTES.C4].forEach((freq, i) =>
        pluck(ctx, { at: i * 0.16, freq, duration: 0.9, gain: 0.13, type: 'triangle' }),
      );
      break;
    case 'curtain':
      paperNoise(ctx, { duration: 0.6, type: 'bandpass', from: 380, to: 1500, q: 0.6, gain: 0.16, attack: 0.18 });
      paperNoise(ctx, { at: 0.08, duration: 0.5, type: 'highpass', from: 3200, q: 0.5, gain: 0.05, attack: 0.12 });
      break;
  }
};
