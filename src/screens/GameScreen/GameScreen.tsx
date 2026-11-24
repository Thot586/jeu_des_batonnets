import { useCallback, useEffect, useRef, useState } from 'react';
import type { Gesture, Mood } from '../../components/Character/Character';
import { Button } from '../../components/Button/Button';
import { SoundToggle } from '../../components/SoundToggle/SoundToggle';
import { useFeedback } from '../../feedback/FeedbackContext';
import { useIdleChoreography } from '../../hooks/useIdleChoreography';
import { MovePicker } from '../../components/MovePicker/MovePicker';
import { ResultDialog } from '../../components/ResultDialog/ResultDialog';
import { Seat } from '../../components/Seat/Seat';
import { StickRow } from '../../components/StickRow/StickRow';
import { formatChoices, maxPickable, plural } from '../../game/rules';
import type { MatchConfig, PlayerId, Scores } from '../../game/types';
import { cx } from '../../utils/cx';
import { useRound, type PendingMove } from './useRound';
import styles from './GameScreen.module.css';

interface GameScreenProps {
  config: MatchConfig;
  round: number;
  firstPlayer: PlayerId;
  scores: Scores;
  onRoundEnd: (winner: PlayerId) => void;
  onRematch: () => void;
  onOpenSettings: () => void;
}

const PLAYER_IDS: readonly PlayerId[] = [0, 1];

export const GameScreen = ({
  config,
  round,
  firstPlayer,
  scores,
  onRoundEnd,
  onRematch,
  onOpenSettings,
}: GameScreenProps) => {
  const { players, settings } = config;
  const { game, pending, isAiThinking, canHumanPlay, play: playMove, timing } = useRound(config, firstPlayer);
  const { play: sound, buzz } = useFeedback();
  const [preview, setPreview] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultClosed, setResultClosed] = useState(false);
  const replayRef = useRef<HTMLButtonElement>(null);
  const reportedRef = useRef(false);
  // Première manche : on arrive par le rideau, les bâtonnets attendent qu'il soit ouvert pour tomber.
  const [intro, setIntro] = useState(round === 0);
  useEffect(() => {
    const id = window.setTimeout(() => setIntro(false), 1500);
    return () => window.clearTimeout(id);
  }, []);

  const available = canHumanPlay ? maxPickable(game, settings.maxTake) : 0;
  const winner = game.winner;
  const moves = game.history.length;

  const play = useCallback(
    (count: number) => {
      if (!canHumanPlay) return;
      sound('tap');
      buzz('pick');
      playMove(count);
    },
    [canHumanPlay, sound, buzz, playMove],
  );

  // Bruitages du décor : les bandes glissent, puis retombent dans la pile du joueur.
  useEffect(() => {
    if (pending?.stage === 'pull') sound('slide', pending.count);
  }, [pending?.stage, pending?.count, sound]);

  // Les bâtonnets arrivent dans la pile : bruit sourd, et le joueur se tasse une image (impact).
  const [catcher, setCatcher] = useState<PlayerId | null>(null);
  const movesRef = useRef(moves);
  useEffect(() => {
    if (moves > movesRef.current) {
      sound('drop');
      const mover = game.history[moves - 1]?.player;
      if (mover !== undefined) {
        setCatcher(mover);
        window.setTimeout(() => setCatcher(null), 3 * (1000 / 12) + 20);
      }
    }
    movesRef.current = moves;
  }, [moves, sound, game.history]);

  // Petit signal quand c'est de nouveau au tour d'une personne.
  useEffect(() => {
    if (canHumanPlay && moves > 0) sound('turn');
  }, [canHumanPlay, moves, sound]);

  // Fin de manche : air de victoire, ou trois notes qui descendent si l'ordinateur a gagné.
  useEffect(() => {
    if (!showResult || winner === null) return;
    const loser = players[winner === 0 ? 1 : 0];
    const humanLost = players[winner].kind === 'ai' && loser.kind === 'human';
    sound(humanLost ? 'lose' : 'win');
    buzz(humanLost ? 'lose' : 'win');
  }, [showResult, winner, players, sound, buzz]);

  // La manche est comptée une seule fois, puis le résultat s'affiche après la dernière animation.
  useEffect(() => {
    if (winner === null) return;
    if (!reportedRef.current) {
      reportedRef.current = true;
      onRoundEnd(winner);
    }
    const id = window.setTimeout(() => setShowResult(true), timing.result);
    return () => window.clearTimeout(id);
  }, [winner, onRoundEnd, timing.result]);

  useEffect(() => {
    if (!canHumanPlay) setPreview(0);
  }, [canHumanPlay]);

  // Raccourcis clavier : touches 1 à 4.
  useEffect(() => {
    if (!canHumanPlay) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const count = Number(event.key);
      if (Number.isInteger(count) && count >= 1 && count <= available) play(count);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canHumanPlay, available, play]);

  // Pendant l'attente d'une personne : tic, puis bâillement (parfois contagieux).
  const idleGestures = useIdleChoreography(canHumanPlay && preview === 0, game.current);

  const gestureFor = (id: PlayerId): Gesture | null =>
    idleGestures[id] ?? (catcher === id ? 'catch' : null);

  // L'autre suit des yeux celui qui joue ou réfléchit.
  const lookAtFor = (id: PlayerId): 'left' | 'right' | null => {
    if (winner !== null) return null;
    const actor = pending ? pending.player : isAiThinking ? game.current : null;
    if (actor === null || actor === id) return null;
    return actor === 0 ? 'left' : 'right';
  };

  // Fin de partie serrée : il reste au plus de quoi faire un dernier coup décisif.
  const tense = winner === null && game.remaining > 0 && game.remaining <= settings.maxTake + 1;

  const moodFor = (id: PlayerId): Mood => {
    if (winner !== null) return id === winner ? 'happy' : 'sad';
    if (pending?.player === id) return pending.stage === 'reach' ? 'reaching' : 'pulling';
    if (canHumanPlay && game.current === id && preview > 0) return 'aiming';
    if (isAiThinking && game.current === id) return 'thinking';
    return 'idle';
  };

  // Distribution : les bâtonnets tombent sur la table au début de la manche (après le rideau la première fois).
  useEffect(() => {
    const id = window.setTimeout(() => sound('deal', settings.totalSticks), round === 0 ? 760 : 60);
    return () => window.clearTimeout(id);
    // Une seule fois par manche : la manche suivante remonte ce composant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pancarte fermée (Échap) : on regarde la table finale, et « Rejouer » reçoit le focus.
  useEffect(() => {
    if (resultClosed) replayRef.current?.focus();
  }, [resultClosed]);

  const dialogOpen = showResult && winner !== null && !resultClosed;

  // Les boutons restent affichés (désactivés) pendant le tour de l'ordinateur : l'écran ne saute pas.
  const hasHuman = players.some((player) => player.kind === 'human');
  const status = describeStatus({ pending, isAiThinking, winner, available, players, current: game.current });

  return (
    <main className={styles.screen}>
      <header className={styles.topbar}>
        <h1 className={styles.round}>Manche {round + 1}</h1>
        <p className={styles.rule}>
          Prise de 1 à {settings.maxTake}, le dernier bâtonnet {settings.lastStick === 'perd' ? 'fait perdre' : 'fait gagner'}
        </p>
        <div className={styles.actions}>
          <SoundToggle />
          <Button variant="secondary" onClick={onOpenSettings}>
            Modifier<span className="visually-hidden"> les joueurs et les règles</span>
          </Button>
        </div>
      </header>

      <div className={styles.arena}>
        {PLAYER_IDS.map((id) => (
          <Seat
            key={id}
            className={id === 0 ? styles.left : styles.right}
            player={players[id]}
            side={id === 0 ? 'left' : 'right'}
            mood={moodFor(id)}
            isTurn={winner === null && game.current === id}
            collected={game.taken[id]}
            wins={scores[id]}
            holding={pending?.player === id && pending.stage === 'pull' ? pending.count : 0}
            gesture={gestureFor(id)}
            lookAt={lookAtFor(id)}
            tense={tense}
          />
        ))}

        <section className={styles.center} aria-label="Table de jeu">
          <div className={cx(styles.table, intro && styles.intro)}>
            <span className={styles.festoon} aria-hidden="true" />
            <p className={styles.count}>
              <strong key={game.remaining} className={styles.number}>
                {game.remaining}
              </strong>
              {game.remaining > 1 ? 'bâtonnets restants' : 'bâtonnet restant'}
            </p>
            <StickRow
              remaining={game.remaining}
              layoutCount={settings.totalSticks}
              pending={
                pending
                  ? { count: pending.count, stage: pending.stage, direction: pending.player === 0 ? -1 : 1 }
                  : null
              }
              preview={preview}
              maxPick={available}
              onPreview={setPreview}
              onPick={play}
            />
            {game.remaining === 0 && (
              <div className={styles.emptyNote}>
                <p className={styles.emptyTitle}>La table est vide.</p>
                <p>
                  {players[0].name} a ramassé {plural(game.taken[0], 'bâtonnet')}, {players[1].name}{' '}
                  {plural(game.taken[1], 'bâtonnet')}.
                </p>
              </div>
            )}
          </div>

          {/* Le message du tour fait partie de la barre d'action : sur téléphone, il reste toujours visible. */}
          <div className={styles.controls}>
            <p className={styles.status} aria-live="polite">
              {status}
            </p>
            {hasHuman && winner === null ? (
              <>
                <MovePicker
                  maxTake={settings.maxTake}
                  available={available}
                  onPick={play}
                  onPreview={setPreview}
                />
                <p className={styles.hint}>
                  Touches {formatChoices(Math.min(settings.maxTake, Math.max(game.remaining, 1)))} du clavier, ou clic sur les derniers bâtonnets.
                </p>
              </>
            ) : null}
            {winner !== null && resultClosed && (
              <div className={styles.endBar}>
                <Button ref={replayRef} size="lg" onClick={onRematch}>
                  Rejouer
                </Button>
                <Button variant="quiet" onClick={onOpenSettings}>
                  Modifier les joueurs et les règles
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>

      {dialogOpen && (
        <ResultDialog
          onClose={() => setResultClosed(true)}
          onLeave={() => setResultClosed(true)}
          players={players}
          winner={winner}
          lastStick={settings.lastStick}
          scores={scores}
          onRematch={onRematch}
          onOpenSettings={onOpenSettings}
        />
      )}
    </main>
  );
};

interface StatusInput {
  pending: PendingMove | null;
  isAiThinking: boolean;
  winner: PlayerId | null;
  available: number;
  players: MatchConfig['players'];
  current: PlayerId;
}

const describeStatus = ({ pending, isAiThinking, winner, available, players, current }: StatusInput): string => {
  if (winner !== null) return `${players[winner].name} remporte la manche.`;
  if (pending) return `${players[pending.player].name} prend ${plural(pending.count, 'bâtonnet')}.`;
  if (isAiThinking) return `${players[current].name} réfléchit…`;
  if (available === 1) return `À toi, ${players[current].name}. Il ne reste qu'un bâtonnet : il est pour toi.`;
  return `À toi, ${players[current].name}. Prends ${formatChoices(available)} bâtonnets.`;
};
