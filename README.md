# Le jeu des bâtonnets

Le jeu des allumettes, en React et TypeScript. Deux personnages s'affrontent autour d'une table :
chacun son tour, on tire de 1 à 3 bâtonnets, et celui qui prend le dernier a perdu.

## Fonctionnalités

- Deux joueurs sur le même écran, ou une partie contre l'ordinateur (trois niveaux : Tranquille, Malin, Expert).
- Choix du pseudo et du personnage pour chaque joueur, mémorisés dans le navigateur.
- Règles réglables : nombre de bâtonnets (7 à 31), prise maximale (2, 3 ou 4), dernier bâtonnet perdant ou gagnant, joueur qui commence.
- Direction artistique « papier découpé » : un petit théâtre de papier sur du kraft, animé en stop motion (voir plus bas).
- Marionnettes de papier articulées : elles tendent le bras, tirent les bâtonnets vers elles, réfléchissent, sautent de joie ou boudent.
- Son et vibrations : bruitages de papier synthétisés en direct, vibrations sur Android, un bouton pour tout couper.
- Score cumulé sur plusieurs manches, avec alternance du joueur qui commence.
- Jouable à la souris (survol puis clic sur les derniers bâtonnets ou sur « Prendre 1, 2, 3 »), au clavier (touches 1 à 4) et au doigt.
- Responsive mobile first : pensé d'abord pour le téléphone (portrait et paysage), puis la tablette et l'ordinateur, et il s'agrandit en proportion sur les écrans géants (2K, 4K).
- Accessible : vrais boutons et boutons radio, annonces de tour pour les lecteurs d'écran, focus visible, animations réduites si le système le demande.

## Démarrer

Il faut Node.js 20 ou plus récent.

```bash
npm install
npm run dev
```

Puis ouvrir l'adresse affichée (en général http://localhost:5173).

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur de développement avec rechargement à chaud |
| `npm run build` | vérification des types puis build de production dans `dist/` |
| `npm run preview` | sert le build de production en local |
| `npm run typecheck` | vérification des types seule |

## Mise en ligne sur GitHub Pages

Le jeu est en ligne : https://thot586.github.io/jeu_des_batonnets/

Le workflow `.github/workflows/deploy.yml` construit le jeu et le publie à chaque push sur `main`. Dans **Settings**, puis **Pages**, la source doit être **GitHub Actions**.

## Organisation du code

```
src/
  main.tsx                 point d'entrée
  App.tsx                  enchaînement des écrans, score de la série
  game/                    logique pure, sans React
    types.ts               types du domaine
    rules.ts               règles : créer une manche, jouer un coup, désigner le gagnant
    ai.ts                  stratégie de l'ordinateur
    avatars.ts             catalogue des personnages
    config.ts              réglages par défaut, validation des pseudos et du stockage
  screens/
    SetupScreen/           choix des joueurs et des règles
    GameScreen/            la table de jeu
      useRound.ts          déroulé d'une manche : animation des coups, tour de l'ordinateur
  components/
    Character/             marionnette de papier (SVG) et ses humeurs
    Curtain/               rideau de théâtre entre les écrans
    CutoutTitle/           titre en lettres découpées
    SoundToggle/           bouton son et vibrations
    Stick/, StickRow/      bâtonnets et rangée interactive
    Seat/                  place d'un joueur : personnage, pseudo, pile, victoires
    MovePicker/            boutons « Prendre 1, 2, 3 »
    ResultDialog/          fin de manche
    AvatarPicker/, Segmented/, Button/, Confetti/
  art/                     formes découpées à la main (générées), définitions SVG partagées
  feedback/                son (Web Audio) et vibrations
  assets/fonts/            polices hébergées avec le jeu (licence SIL OFL)
  hooks/                   localStorage, préférence de mouvement réduit
  styles/                  jetons de design (couleurs, typographie, formes) et styles globaux
```

Chaque composant a son propre fichier de styles (CSS Modules). La logique du jeu (`src/game`) ne dépend pas de React : on peut la tester ou la réutiliser telle quelle.

## Responsive

Les styles de base visent le téléphone ; chaque palier (`min-width`) élargit ensuite la mise en page : 30em, 40em, 48em (tablette), 64em (bureau, personnages de part et d'autre de la table) et 100em (écrans géants). Un palier dédié traite le téléphone tenu à l'horizontale.

Toutes les mesures sont en `rem`, et la taille de base grandit avec l'écran au-delà de 1700 px environ (18 px en Full HD, 24 px en 2560 x 1440, 36 px en 4K, voir `src/styles/global.css`). Un écran 4K affiche ainsi la même composition qu'un écran Full HD, en plus grand.

## Direction artistique

**Papier découpé.** Un petit théâtre de papier posé sur du kraft : aplats de gouache (tomate, safran, vert d'eau, outremer, rose), bords coupés à la main, ombres de papier superposé, grain de la fibre. Les titres et les chiffres sont en pochoir (Saira Stencil One), le texte dans une linéale ronde (Fredoka).

**Deux vitesses.**
- Le décor vit en **stop motion, à 12 images par seconde** : marionnettes, bâtonnets, rideau, pancarte de fin, confettis. Chaque mouvement suit une courbe d'accélération échantillonnée image par image, chaque image étant tenue, comme une marionnette déplacée à la main entre deux prises. Ces courbes sont des jetons CSS (`--stop-out-4`, `--stop-back-6`...) écrits avec la fonction `linear()`, dans `src/styles/tokens.css`.
- L'interface (boutons, onglets, champs) répond **immédiatement**, en douceur et sans rebond : elle se soulève au survol et s'aplatit sous le doigt.

**Moments-clés.** Le rideau se lève à l'arrivée et se ferme puis se rouvre entre deux écrans ; les lettres du titre sont posées une à une ; chaque coup se joue en trois temps (tendre le bras, tirer, ramasser) ; la fin de manche descend au bout de deux ficelles et se balance.

**Formes générées.** Chaque contour (corps, yeux, bâtonnets, étiquettes) est calculé à partir d'une graine (`src/art/paper.ts`) : légèrement irrégulier, mais identique à chaque affichage.

**Son.** Tout vient du papier : tapotement de carton, glissement de bandes, froissement du rideau, et un petit air de kalimba en fin de manche. Les sons sont synthétisés avec Web Audio (aucun fichier audio) et ne démarrent qu'après un premier geste, comme l'exigent les navigateurs.

**Mouvement réduit.** Si le système le demande, aucune animation de décor : tout s'affiche directement dans son état final.

## Choix techniques

- **Marionnettes en SVG** : chaque pièce est une découpe séparée ; les bras pivotent sur une attache parisienne et s'animent en CSS.
- **Bâtonnets en HTML** : une bande découpée par `clip-path` et une tête de papier ; plus léger qu'un SVG par bâtonnet quand il y en a une trentaine. Seuls `transform` et `opacity` sont animés.
- **Aucune bibliothèque d'animation ni de son** : les seules dépendances sont React et ReactDOM.
- **Polices hébergées avec le jeu** : aucun appel à un service tiers (pas de Google Fonts), le jeu s'affiche correctement hors ligne.

## La stratégie de l'ordinateur

Quand on peut prendre de 1 à k bâtonnets et que le dernier fait perdre, les positions perdantes pour celui qui doit jouer sont celles où il reste 1, k + 2, 2k + 3... bâtonnets. Le bon coup consiste à y laisser l'adversaire. Avec 20 bâtonnets et une prise de 1 à 3, le premier joueur gagne à coup sûr en prenant 3, puis en complétant toujours à 4 le coup de l'adversaire.

Le niveau Expert joue toujours ce coup quand il existe, Malin le joue 7 fois sur 10, Tranquille 1 fois sur 4.

## Auteur

Développé par Dr FENOHASINA T.J. Félicien, psychiatre, développeur d'applications web.

Polices : Saira Stencil One et Fredoka, sous licence SIL Open Font License (textes de licence dans `src/assets/fonts`).
