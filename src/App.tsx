import { useCallback, useEffect, useRef, useState } from 'react';
import { PaperDefs } from './art/PaperDefs';
import { startParallax } from './art/parallax';
import { Backdrop } from './components/Backdrop/Backdrop';
import { Curtain } from './components/Curtain/Curtain';
import { Footer } from './components/Footer/Footer';
import { Proscenium } from './components/Proscenium/Proscenium';
import { FeedbackProvider, useFeedback } from './feedback/FeedbackContext';
import { DEFAULT_CONFIG, isMatchConfig } from './game/config';
import type { MatchConfig, PlayerId, Scores } from './game/types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import { GameScreen } from './screens/GameScreen/GameScreen';
import { SetupScreen } from './screens/SetupScreen/SetupScreen';
import styles from './App.module.css';

type Screen = 'setup' | 'game';

const FRAME = 1000 / 12;
/** Le rideau se ferme en 8 images, reste fermé 2 images, puis se rouvre. */
const CURTAIN_CLOSE_MS = 10 * FRAME;
const CURTAIN_HOLD_MS = 2 * FRAME;

const pickStarter = (config: MatchConfig): PlayerId => {
  const { starter } = config.settings;
  if (starter !== 'hasard') return starter;
  return Math.random() < 0.5 ? 0 : 1;
};

/**
 * Point d'entrée : définitions de papier partagées, son et vibrations, puis le théâtre
 * en trois profondeurs : le décor du fond, la scène (le jeu), le cadre de scène devant.
 */
export const App = () => {
  useEffect(() => startParallax(), []);

  return (
    <FeedbackProvider>
      <PaperDefs />
      <Backdrop />
      <Theatre />
      <Proscenium />
    </FeedbackProvider>
  );
};

/** Enchaîne les écrans derrière le rideau et garde le score de la série de manches. */
const Theatre = () => {
  const [config, setConfig] = useLocalStorage<MatchConfig>('batonnets:config', DEFAULT_CONFIG, isMatchConfig);
  const [screen, setScreen] = useState<Screen>('setup');
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState<Scores>([0, 0]);
  /** Victoires d'affilée de chaque joueur (remises à zéro à la première défaite). */
  const [streaks, setStreaks] = useState<Scores>([0, 0]);
  const [firstStarter, setFirstStarter] = useState<PlayerId>(0);
  const [curtainClosed, setCurtainClosed] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const { play } = useFeedback();
  const timers = useRef<number[]>([]);

  // Lever de rideau à l'arrivée sur la page.
  useEffect(() => {
    const id = window.setTimeout(() => setCurtainClosed(false), 120);
    const pending = timers.current;
    return () => {
      window.clearTimeout(id);
      pending.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  /** Change d'écran derrière le rideau : il se ferme, l'écran change, il se rouvre. */
  const changeScene = useCallback(
    (apply: () => void) => {
      if (reducedMotion) {
        apply();
        return;
      }
      play('curtain');
      setCurtainClosed(true);
      timers.current.push(
        window.setTimeout(() => {
          apply();
          window.scrollTo(0, 0);
          timers.current.push(window.setTimeout(() => setCurtainClosed(false), CURTAIN_HOLD_MS));
        }, CURTAIN_CLOSE_MS),
      );
    },
    [reducedMotion, play],
  );

  const start = (next: MatchConfig) => {
    changeScene(() => {
      setConfig(next);
      setScores([0, 0]);
      setStreaks([0, 0]);
      setRound(0);
      setFirstStarter(pickStarter(next));
      setScreen('game');
    });
  };

  const handleRoundEnd = useCallback((winner: PlayerId) => {
    setScores(([left, right]) => (winner === 0 ? [left + 1, right] : [left, right + 1]));
    setStreaks(([left, right]) => (winner === 0 ? [left + 1, 0] : [0, right + 1]));
  }, []);

  // Chaque écran s'ouvre en haut de page, quel que soit le défilement de l'écran précédent.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen, round]);

  // Chaque nouvelle manche, on change de joueur qui commence.
  const starterOfRound = ((firstStarter + round) % 2) as PlayerId;

  return (
    <div className={styles.app}>
      <div key={screen} className={styles.screen}>
        {screen === 'setup' ? (
          <SetupScreen initial={config} onStart={start} />
        ) : (
          <GameScreen
            key={round}
            config={config}
            round={round}
            firstPlayer={starterOfRound}
            scores={scores}
            streaks={streaks}
            onRoundEnd={handleRoundEnd}
            onRematch={() => setRound((r) => r + 1)}
            onOpenSettings={() => changeScene(() => setScreen('setup'))}
          />
        )}
      </div>
      <Footer />
      <Curtain closed={curtainClosed} />
    </div>
  );
};
