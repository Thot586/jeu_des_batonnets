import { useEffect, useRef, useState, type KeyboardEvent, type SyntheticEvent } from 'react';
import { useFeedback } from '../../feedback/FeedbackContext';
import { COOL_STREAK } from '../../game/rules';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { cx } from '../../utils/cx';
import type { LastStickRule, PlayerConfig, PlayerId, Scores } from '../../game/types';
import { Button } from '../Button/Button';
import { Character } from '../Character/Character';
import { Confetti } from '../Confetti/Confetti';
import styles from './ResultDialog.module.css';

const FRAME = 1000 / 12;
/** La pancarte met 2 + 14 images à descendre et à s'arrêter. */
const SETTLE_MS = 16 * FRAME;
/** Elle remonte en 4 images quand on la ferme. */
const LEAVE_MS = 4 * FRAME;

interface ResultDialogProps {
  players: [PlayerConfig, PlayerConfig];
  winner: PlayerId;
  lastStick: LastStickRule;
  scores: Scores;
  streaks: Scores;
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
  streaks,
  onRematch,
  onOpenSettings,
  onClose,
  onLeave,
}: ResultDialogProps) => {
  const rematchRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const { play } = useFeedback();

  // Une fois la pancarte arrêtée : le liseré d'autocollant se pose et le point du gagnant s'ajoute.
  const [settled, setSettled] = useState(reducedMotion);
  useEffect(() => {
    if (settled) return;
    const id = window.setTimeout(() => {
      setSettled(true);
      play('select');
    }, SETTLE_MS);
    return () => window.clearTimeout(id);
  }, [settled, play]);

  // Échap : la pancarte remonte au bout de ses ficelles, puis se ferme.
  const [leaving, setLeaving] = useState(false);
  const leaveTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);
  const streak = streaks[winner];
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

  /** La pancarte remonte (4 images), puis se ferme ; directement si le mouvement est réduit. */
  const requestLeave = () => {
    if (leaving) return;
    if (reducedMotion) {
      onClose();
      return;
    }
    setLeaving(true);
    leaveTimer.current = window.setTimeout(onClose, LEAVE_MS);
  };

  // Échap est intercepté avant que le navigateur ne ferme le dialogue lui-même :
  // sinon la pancarte disparaîtrait d'un coup, sans remonter.
  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    requestLeave();
  };

  // Autres demandes de fermeture (geste retour d'Android...) : même sortie.
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    requestLeave();
  };

  // Si le navigateur ferme malgré tout le dialogue, l'écran se met à jour aussitôt.
  const handleNativeClose = () => {
    window.clearTimeout(leaveTimer.current);
    onClose();
  };

  const reason =
    lastStick === 'perd'
      ? `${other.name} a dû prendre le dernier bâtonnet.`
      : `${champion.name} a pris le dernier bâtonnet.`;

  return (
    <dialog
      ref={dialogRef}
      className={cx(styles.backdrop, leaving && styles.leaving)}
      aria-labelledby="result-title"
      aria-describedby="result-reason"
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}
      onClose={handleNativeClose}
    >
      {!humanLost && <Confetti />}
      <div className={styles.dialog}>
        <span className={styles.strings} aria-hidden="true" />
        <div className={styles.podium} aria-hidden="true">
          <Character
            avatar={champion.avatar}
            mood="happy"
            shades={streak >= COOL_STREAK}
            sticker={settled}
            className={styles.champion}
          />
          <Character avatar={other.avatar} mood="sad" facing="left" className={styles.runnerUp} />
        </div>

        <h2 id="result-title" className={styles.title}>
          {champion.name} remporte la manche
        </h2>
        <p id="result-reason" className={styles.reason}>
          {reason}
        </p>
        {streak >= COOL_STREAK && (
          <p className={styles.streak}>
            {streak} victoires d'affilée{streak === COOL_STREAK ? ' : les lunettes de soleil sont méritées.' : '.'}
          </p>
        )}

        <dl className={styles.scores}>
          {players.map((player, index) => {
            const isWinner = index === winner;
            // Le point du gagnant s'ajoute sous nos yeux quand la pancarte s'arrête.
            const shown = isWinner && !settled ? scores[index] - 1 : scores[index];
            return (
              <div key={index} className={cx(styles.score, isWinner && styles.winnerScore)}>
                <dt>{player.name}</dt>
                <dd>
                  <span key={shown} className={cx(isWinner && settled && styles.bump)} aria-hidden="true">
                    {shown}
                  </span>
                  <span className="visually-hidden">{scores[index]}</span>
                </dd>
              </div>
            );
          })}
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
