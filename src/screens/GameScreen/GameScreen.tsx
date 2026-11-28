import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Gesture, HeldInfo, Mood } from '../../components/Character/Character';
import { Button } from '../../components/Button/Button';
import { SoundToggle } from '../../components/SoundToggle/SoundToggle';
import { useFeedback } from '../../feedback/FeedbackContext';
import { useIdleChoreography } from '../../hooks/useIdleChoreography';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { MovePicker } from '../../components/MovePicker/MovePicker';
import { ResultDialog } from '../../components/ResultDialog/ResultDialog';
import { Seat } from '../../components/Seat/Seat';
import { StickRow } from '../../components/StickRow/StickRow';
import { formatChoices, maxPickable, plural } from '../../game/rules';
import type { MatchConfig, PlayerId, Scores } from '../../game/types';
import { cx } from '../../utils/cx';
import { Flights } from './Flights';
import { useRound, type PendingMove } from './useRound';
import styles from './GameScreen.module.css';

interface GameScreenProps {
  config: MatchConfig;
  round: number;
  firstPlayer: PlayerId;
  scores: Scores;
  /** Victoires d'affilée : à partir de 3, le joueur porte des lunettes de soleil. */
  streaks: Scores;
  onRoundEnd: (winner: PlayerId) => void;
  onRematch: () => void;
  onOpenSettings: () => void;
}

const PLAYER_IDS: readonly PlayerId[] = [0, 1];

/** Le son vient du côté du joueur concerné (stéréo discrète). */
const panFor = (player: PlayerId): number => (player === 0 ? -0.35 : 0.35);

export const GameScreen = ({
  config,
  round,
  firstPlayer,
  scores,
  streaks,
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
      sound('tap', { pan: panFor(game.current) });
      buzz('pick', count);
      playMove(count);
    },
    [canHumanPlay, sound, buzz, playMove, game.current],
  );

  // Bruitages du décor : les bâtonnets glissent hors de la table, à la manière de celui qui les prend.
  useEffect(() => {
    if (pending?.stage !== 'fly') return;
    sound('slide', { count: pending.count, voice: players[pending.player].avatar, pan: panFor(pending.player) });
  }, [pending?.stage, pending?.count, pending?.player, players, sound]);

  // Les bâtonnets arrivent dans la pile : bruit sourd, et le joueur se tasse une image (impact).
  const [catcher, setCatcher] = useState<PlayerId | null>(null);
  const movesRef = useRef(moves);
  useEffect(() => {
    if (moves > movesRef.current) {
      const last = game.history[moves - 1];
      if (last) {
        // La note de bois de la pile monte à chaque tirage : la manche grimpe vers sa fin.
        sound('drop', {
          count: last.count,
          voice: players[last.player].avatar,
          pan: panFor(last.player),
          progress: 1 - game.remaining / settings.totalSticks,
        });
      }
      const mover = last?.player;
      if (mover !== undefined) {
        setCatcher(mover);
        window.setTimeout(() => setCatcher(null), 3 * (1000 / 12) + 20);
      }
    }
    movesRef.current = moves;
  }, [moves, sound, game.history, game.remaining, players, settings.totalSticks]);

  // Petit signal quand c'est de nouveau au tour d'une personne.
  useEffect(() => {
    if (canHumanPlay && moves > 0) sound('turn', { pan: panFor(game.current) * 0.6 });
  }, [canHumanPlay, moves, sound, game.current]);

  // Fin de manche : air de victoire, ou trois notes qui descendent si l'ordinateur a gagné.
  useEffect(() => {
    if (!showResult || winner === null) return;
    const loser = players[winner === 0 ? 1 : 0];
    const humanLost = players[winner].kind === 'ai' && loser.kind === 'human';
    // Le son de fin vient du côté du gagnant, comme la fête sur la pancarte.
    sound(humanLost ? 'lose' : 'win', { streak: streaks[winner], pan: panFor(winner) * 0.5 });
    buzz(humanLost ? 'lose' : 'win');
  }, [showResult, winner, players, sound, buzz, streaks]);

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
  const idleGestures = useIdleChoreography(canHumanPlay && preview === 0, game.current, [
    players[0].avatar,
    players[1].avatar,
  ]);

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

  // Taille des bâtonnets tenus : mesurée au moment où le personnage tend le bras, pour qu'en main
  // ils aient à l'écran la taille de ceux de la table (dans la limite de ce qu'il peut porter).
  const arenaRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [heldSize, setHeldSize] = useState<{ length: number; width: number; woodTile: number } | null>(null);
  useLayoutEffect(() => {
    if (pending?.stage !== 'reach') return;
    const root = arenaRef.current;
    const stick = root?.querySelector('[data-take="1"]')?.firstElementChild as HTMLElement | null | undefined;
    const svg = root?.querySelector(`[data-seat="${pending.player}"] svg`);
    if (!stick || !svg) return;
    const unitPx = svg.getBoundingClientRect().width / 160;
    if (unitPx <= 0) return;
    const length = Math.min(stick.offsetHeight / unitPx, 118);
    const unitsPerPx = length / stick.offsetHeight;
    const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    setHeldSize({ length, width: stick.offsetWidth * unitsPerPx, woodTile: 24 * rootFont * unitsPerPx });
  }, [pending?.stage, pending?.player]);

  const heldFor = (id: PlayerId): HeldInfo | null => {
    if (!pending || pending.player !== id || !heldSize) return null;
    // Dans la main seulement une fois arrivés (vol terminé), et jusqu'à ce qu'ils partent vers la pile.
    // Avant et après, ils restent dessinés mais invisibles : c'est d'eux que partent et vers eux que vont les vols.
    return { count: pending.count, ...heldSize, visible: pending.stage === 'pull' };
  };

  // Sur la table, on compte ce qui y est vraiment : dès qu'ils s'envolent, les bâtonnets n'y sont plus.
  const onTable = game.remaining - (pending && pending.stage !== 'reach' ? pending.count : 0);

  const moodFor = (id: PlayerId): Mood => {
    if (winner !== null) return id === winner ? 'happy' : 'sad';
    // Bras tendu tant que les bâtonnets n'ont pas rejoint la main, puis ramené vers soi.
    if (pending?.player === id) return pending.stage === 'reach' || pending.stage === 'fly' ? 'reaching' : 'pulling';
    if (canHumanPlay && game.current === id && preview > 0) return 'aiming';
    if (isAiThinking && game.current === id) return 'thinking';
    return 'idle';
  };

  // Distribution : les bâtonnets tombent sur la table au début de la manche (après le rideau la première fois).
  useEffect(() => {
    const id = window.setTimeout(() => sound('deal', { count: settings.totalSticks }), round === 0 ? 760 : 60);
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
          Prise de 1 à {settings.maxTake}, le dernier bâtonnet {settings.lastStick === 'perd' ? 'fait perdre' : 'fait gagner'}
        </p>
        <div className={styles.actions}>
          <SoundToggle />
          <Button variant="secondary" onClick={onOpenSettings}>
            Modifier<span className="visually-hidden"> les joueurs et les règles</span>
          </Button>
        </div>
      </header>

      <Flights
        pending={pending}
        scope={arenaRef}
        collected={game.taken}
        reducedMotion={reducedMotion}
      />

      <div ref={arenaRef} className={styles.arena}>
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
            streak={streaks[id]}
            sticker={winner === id}
            seatId={id}
            held={heldFor(id)}
            incoming={pending?.player === id && pending.stage === 'stow' ? pending.count : 0}
            gesture={gestureFor(id)}
            lookAt={lookAtFor(id)}
            tense={tense}
          />
        ))}

        <section className={styles.center} aria-label="Table de jeu">
          <div className={cx(styles.table, intro && styles.intro)}>
            <span className={styles.festoon} aria-hidden="true" />
            <p className={styles.count}>
              <strong key={onTable} className={styles.number}>
                {onTable}
              </strong>
              {onTable > 1 ? 'bâtonnets restants' : 'bâtonnet restant'}
            </p>
            {game.remaining > 0 && <StickRow
              total={settings.totalSticks}
              takenStart={game.taken[0]}
              takenEnd={game.taken[1]}
              side={game.current === 0 ? 'start' : 'end'}
              pending={
                pending
                  ? { count: pending.count, stage: pending.stage, side: pending.player === 0 ? 'start' : 'end' }
                  : null
              }
              preview={preview}
              maxPick={available}
              onPreview={setPreview}
              onPick={play}
            />}
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
                  Touches {formatChoices(Math.min(settings.maxTake, Math.max(game.remaining, 1)))} du clavier, ou clic sur les bâtonnets de ton côté.
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
          streaks={streaks}
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
  if (available === 1) return `À toi, ${players[current].name}. Il ne reste qu'un bâtonnet : il est pour toi.`;
  return `À toi, ${players[current].name}. Prends ${formatChoices(available)} bâtonnets.`;
};
