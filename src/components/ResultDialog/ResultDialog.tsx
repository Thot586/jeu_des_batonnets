import { useEffect, useRef, type SyntheticEvent } from 'react';
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
  /** Échap : la pancarte se ferme, on peut regarder la table finale. */
  onClose: () => void;
  /** Appelé juste avant de quitter l'écran (le rideau doit pouvoir passer devant). */
  onLeave: () => void;
}

export const ResultDialog = ({
  players,
  winner,
  lastStick,
  scores,
  onRematch,
  onOpenSettings,
  onClose,
  onLeave,
}: ResultDialogProps) => {
  const rematchRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const champion = players[winner];
  const other = players[winner === 0 ? 1 : 0];
  const humanLost = champion.kind === 'ai' && other.kind === 'human';

  // Dialogue natif et modal : le reste de la page devient inerte, le focus reste dans la pancarte.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    rematchRef.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  // Échap : on ferme la pancarte nous-mêmes (le navigateur ne doit pas la retirer seul du DOM).
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };

  const reason =
    lastStick === 'perd'
      ? `${other.name} a dû prendre le dernier bâtonnet.`
      : `${champion.name} a pris le dernier bâtonnet.`;

  return (
    <dialog
      ref={dialogRef}
      className={styles.backdrop}
      aria-labelledby="result-title"
      aria-describedby="result-reason"
      onCancel={handleCancel}
    >
      {!humanLost && <Confetti />}
      <div className={styles.dialog}>
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
          <Button
            variant="quiet"
            onClick={() => {
              onLeave();
              onOpenSettings();
            }}
          >
            Modifier les joueurs et les règles
          </Button>
        </div>
      </div>
    </dialog>
  );
};
