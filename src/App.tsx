import { useCallback, useState } from 'react';
import { DEFAULT_CONFIG, isMatchConfig } from './game/config';
import type { MatchConfig, PlayerId, Scores } from './game/types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { GameScreen } from './screens/GameScreen/GameScreen';
import { SetupScreen } from './screens/SetupScreen/SetupScreen';
import styles from './App.module.css';

type Screen = 'setup' | 'game';

const pickStarter = (config: MatchConfig): PlayerId => {
  const { starter } = config.settings;
  if (starter !== 'hasard') return starter;
  return Math.random() < 0.5 ? 0 : 1;
};

/** Enchaîne les écrans et garde le score de la série de manches. */
export const App = () => {
  const [config, setConfig] = useLocalStorage<MatchConfig>('batonnets:config', DEFAULT_CONFIG, isMatchConfig);
  const [screen, setScreen] = useState<Screen>('setup');
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState<Scores>([0, 0]);
  const [firstStarter, setFirstStarter] = useState<PlayerId>(0);

  const start = (next: MatchConfig) => {
    setConfig(next);
    setScores([0, 0]);
    setRound(0);
    setFirstStarter(pickStarter(next));
    setScreen('game');
  };

  const handleRoundEnd = useCallback((winner: PlayerId) => {
    setScores(([left, right]) => (winner === 0 ? [left + 1, right] : [left, right + 1]));
  }, []);

  // Chaque nouvelle manche, on change de joueur qui commence.
  const starterOfRound = ((firstStarter + round) % 2) as PlayerId;

  return (
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
          onRoundEnd={handleRoundEnd}
          onRematch={() => setRound((r) => r + 1)}
          onOpenSettings={() => setScreen('setup')}
        />
      )}
    </div>
  );
};
