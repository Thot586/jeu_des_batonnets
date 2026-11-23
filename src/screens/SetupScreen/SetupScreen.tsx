import { useEffect, useState, type FormEvent } from 'react';
import { AvatarPicker } from '../../components/AvatarPicker/AvatarPicker';
import { Button } from '../../components/Button/Button';
import { Character } from '../../components/Character/Character';
import { CutoutTitle } from '../../components/CutoutTitle/CutoutTitle';
import { Segmented } from '../../components/Segmented/Segmented';
import { StickRow } from '../../components/StickRow/StickRow';
import { NAME_MAX_LENGTH, validateNames } from '../../game/config';
import { describeRules, STICKS_MAX, STICKS_MIN, TAKE_OPTIONS } from '../../game/rules';
import type {
  Difficulty,
  GameSettings,
  LastStickRule,
  MatchConfig,
  PlayerConfig,
  PlayerId,
  PlayerKind,
  Starter,
} from '../../game/types';
import { cx } from '../../utils/cx';
import styles from './SetupScreen.module.css';

/** Le rideau met environ 0,75 s à s'ouvrir : le titre commence à se poser juste après. */
const INTRO_MS = 750;

interface SetupScreenProps {
  initial: MatchConfig;
  onStart: (config: MatchConfig) => void;
}

const KIND_OPTIONS = [
  { value: 'human', label: 'Une personne' },
  { value: 'ai', label: "L'ordinateur" },
] as const satisfies readonly { value: PlayerKind; label: string }[];

const DIFFICULTY_OPTIONS = [
  { value: 'facile', label: 'Tranquille' },
  { value: 'malin', label: 'Malin' },
  { value: 'expert', label: 'Expert' },
] as const satisfies readonly { value: Difficulty; label: string }[];

const LAST_STICK_OPTIONS = [
  { value: 'perd', label: 'fait perdre' },
  { value: 'gagne', label: 'fait gagner' },
] as const satisfies readonly { value: LastStickRule; label: string }[];

const TAKE_CHOICES = TAKE_OPTIONS.map((n) => ({ value: n as number, label: `1 à ${n}` }));

export const SetupScreen = ({ initial, onStart }: SetupScreenProps) => {
  const [players, setPlayers] = useState<[PlayerConfig, PlayerConfig]>(initial.players);
  const [settings, setSettings] = useState<GameSettings>(initial.settings);
  const [submitted, setSubmitted] = useState(false);
  // Pendant l'ouverture du rideau, les bâtonnets d'aperçu attendent avant de tomber.
  const [intro, setIntro] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setIntro(false), INTRO_MS + 600);
    return () => window.clearTimeout(id);
  }, []);

  const errors = validateNames(players);
  // Validation : un champ intact n'affiche rien ; l'erreur apparaît quand on le quitte (ou à l'envoi)
  // et disparaît dès qu'on revient le corriger.
  const [touched, setTouched] = useState<[boolean, boolean]>([false, false]);
  const [editing, setEditing] = useState<number | null>(null);
  const shownErrors = errors.map((error, id) =>
    (submitted || touched[id]) && editing !== id ? error : null,
  );
  const leaveField = (id: PlayerId) => {
    setEditing(null);
    setTouched((current) => {
      const next: [boolean, boolean] = [...current];
      next[id] = true;
      return next;
    });
  };

  const updatePlayer = (id: PlayerId, patch: Partial<PlayerConfig>) =>
    setPlayers((current) => {
      const next: [PlayerConfig, PlayerConfig] = [...current];
      next[id] = { ...next[id], ...patch };
      return next;
    });

  const updateSettings = (patch: Partial<GameSettings>) =>
    setSettings((current) => ({ ...current, ...patch }));

  const changeKind = (kind: PlayerKind) => {
    const name = players[1].name.trim();
    // Pseudo par défaut quand on passe de l'ordinateur à une personne, et inversement.
    if (kind === 'ai' && (name === '' || name === 'Joueur 2')) updatePlayer(1, { kind, name: 'Ordi' });
    else if (kind === 'human' && (name === '' || name === 'Ordi')) updatePlayer(1, { kind, name: 'Joueur 2' });
    else updatePlayer(1, { kind });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (errors.some(Boolean)) {
      const firstInvalid = errors.findIndex(Boolean);
      document.getElementById(`pseudo-${firstInvalid}`)?.focus();
      // Le champ reçoit le focus pour être corrigé, mais son erreur reste lisible.
      setEditing(null);
      return;
    }
    onStart({
      players: [
        { ...players[0], name: players[0].name.trim() },
        { ...players[1], name: players[1].name.trim() },
      ],
      settings,
    });
  };

  const starterOptions: { value: string; label: string }[] = [
    { value: '0', label: players[0].name.trim() || 'Joueur 1' },
    { value: '1', label: players[1].name.trim() || 'Joueur 2' },
    { value: 'hasard', label: 'Au hasard' },
  ];

  return (
    <main className={styles.screen}>
      <header className={cx(styles.hero, intro && styles.intro)}>
        <CutoutTitle kicker="Le jeu des" word="bâtonnets" delay={INTRO_MS} />
        <p className={styles.lead}>{describeRules(settings)}</p>
        <StickRow remaining={settings.totalSticks} size="compact" />
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.players}>
          {([0, 1] as const).map((id) => {
            const player = players[id];
            const error = shownErrors[id];
            const otherAvatar = players[id === 0 ? 1 : 0].avatar;
            return (
              <section key={id} className={styles.card} aria-labelledby={`player-${id}-title`}>
                <div className={styles.cardHead}>
                  <div className={styles.portrait}>
                    <Character
                      key={player.avatar}
                      avatar={player.avatar}
                      facing={id === 0 ? 'right' : 'left'}
                      className={styles.portraitFigure}
                    />
                  </div>
                  <h2 id={`player-${id}-title`} className={styles.cardTitle}>
                    {id === 0 ? 'Joueur de gauche' : 'Joueur de droite'}
                  </h2>
                </div>

                {id === 1 && (
                  <Segmented
                    legend="Qui joue ?"
                    options={KIND_OPTIONS}
                    value={player.kind}
                    onChange={changeKind}
                  />
                )}

                <div className={styles.field}>
                  <label htmlFor={`pseudo-${id}`} className={styles.label}>
                    Pseudo
                  </label>
                  <input
                    id={`pseudo-${id}`}
                    className={cx(styles.input, error && styles.invalid)}
                    value={player.name}
                    maxLength={NAME_MAX_LENGTH}
                    autoComplete={id === 0 ? 'nickname' : 'off'}
                    spellCheck={false}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `pseudo-${id}-error` : undefined}
                    onChange={(event) => updatePlayer(id, { name: event.target.value })}
                    onFocus={() => setEditing(id)}
                    onBlur={() => leaveField(id)}
                  />
                  {error && (
                    <p id={`pseudo-${id}-error`} className={styles.error}>
                      {error}
                    </p>
                  )}
                </div>

                <AvatarPicker
                  value={player.avatar}
                  taken={otherAvatar}
                  onChange={(avatar) => updatePlayer(id, { avatar })}
                />

                {id === 1 && player.kind === 'ai' && (
                  <Segmented
                    legend="Niveau de l'ordinateur"
                    options={DIFFICULTY_OPTIONS}
                    value={settings.difficulty}
                    onChange={(difficulty) => updateSettings({ difficulty })}
                  />
                )}
              </section>
            );
          })}
        </div>

        <section className={styles.rules} aria-labelledby="rules-title">
          <h2 id="rules-title" className={styles.rulesTitle}>
            Règles de la partie
          </h2>

          <div className={styles.rulesGrid}>
            <div className={styles.field}>
              <label htmlFor="total-sticks" className={styles.label}>
                Nombre de bâtonnets : <output htmlFor="total-sticks">{settings.totalSticks}</output>
              </label>
              <input
                id="total-sticks"
                type="range"
                className={styles.range}
                min={STICKS_MIN}
                max={STICKS_MAX}
                value={settings.totalSticks}
                onChange={(event) => updateSettings({ totalSticks: Number(event.target.value) })}
              />
            </div>

            <Segmented
              tone="light"
              legend="On en prend à chaque tour"
              options={TAKE_CHOICES}
              value={settings.maxTake}
              onChange={(maxTake) => updateSettings({ maxTake })}
            />

            <Segmented
              tone="light"
              legend="Le dernier bâtonnet"
              options={LAST_STICK_OPTIONS}
              value={settings.lastStick}
              onChange={(lastStick) => updateSettings({ lastStick })}
            />

            <Segmented
              tone="light"
              legend="Qui commence ?"
              options={starterOptions}
              value={String(settings.starter)}
              onChange={(value) =>
                updateSettings({ starter: (value === 'hasard' ? 'hasard' : Number(value)) as Starter })
              }
            />
          </div>
        </section>

        <div className={styles.submit}>
          <Button type="submit" size="lg">
            Lancer la partie
          </Button>
        </div>
      </form>
    </main>
  );
};
