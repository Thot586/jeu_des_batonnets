import { useEffect, useRef } from 'react';
import type { LastStickRule, PlayerConfig, PlayerId, Scores } from '../../game/types';
import { Button } from '../Button/Button';
import { Character } from '../Character/Character';
import { Confetti } from '../Confetti/Confetti';
import styles from './ResultDialog.module.css';

interface ResultDialogProps {
  players: [PlayerConfig, PlayerConfig];
  winner: PlayerId;
  lastStick: LastStickRule;
  scores: Scores;
  onRematch: () => void;
  onOpenSettings: () => void;
}

export const ResultDialog = ({
  players,
  winner,
  lastStick,
  scores,
  onRematch,
  onOpenSettings,
}: ResultDialogProps) => {
  const rematchRef = useRef<HTMLButtonElement>(null);
  const champion = players[winner];
  const other = players[winner === 0 ? 1 : 0];
  const humanLost = champion.kind === 'ai' && other.kind === 'human';

  useEffect(() => {
    rematchRef.current?.focus();
  }, []);

  const reason =
    lastStick === 'perd'
      ? `${other.name} a dû prendre le dernier bâtonnet.`
      : `${champion.name} a pris le dernier bâtonnet.`;

  return (
    <div className={styles.backdrop}>
      {!humanLost && <Confetti />}
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
        aria-describedby="result-reason"
      >
        <span className={styles.strings} aria-hidden="true" />
        <div className={styles.podium} aria-hidden="true">
          <Character avatar={champion.avatar} mood="happy" className={styles.champion} />
          <Character avatar={other.avatar} mood="sad" facing="left" className={styles.runnerUp} />
        </div>

        <h2 id="result-title" className={styles.title}>
          {champion.name} remporte la manche
        </h2>
        <p id="result-reason" className={styles.reason}>
          {reason}
        </p>

        <dl className={styles.scores}>
          {players.map((player, index) => (
            <div key={index} className={styles.score}>
              <dt>{player.name}</dt>
              <dd>{scores[index]}</dd>
            </div>
          ))}
        </dl>

        <div className={styles.actions}>
          <Button ref={rematchRef} size="lg" onClick={onRematch}>
            Rejouer
          </Button>
          <Button variant="quiet" onClick={onOpenSettings}>
            Modifier les joueurs et les règles
          </Button>
        </div>
      </div>
    </div>
  );
};
