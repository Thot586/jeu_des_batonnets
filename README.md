# Le jeu des bâtonnets

Le jeu des allumettes, en React et TypeScript. Deux personnages s'affrontent autour d'une table :
chacun son tour, on tire de 1 à 3 bâtonnets, et celui qui prend le dernier a perdu.

## Fonctionnalités

- Deux joueurs sur le même écran, ou une partie contre l'ordinateur (trois niveaux : Tranquille, Malin, Expert).
- Choix du pseudo et du personnage pour chaque joueur, mémorisés dans le navigateur.
- Règles réglables : nombre de bâtonnets (7 à 31), prise maximale (2, 3 ou 4), dernier bâtonnet perdant ou gagnant, joueur qui commence.
- Personnages animés en SVG : ils tendent le bras, tirent les bâtonnets vers eux, réfléchissent, sautent de joie ou boudent.
- Score cumulé sur plusieurs manches, avec alternance du joueur qui commence.
- Jouable à la souris (survol puis clic sur les derniers bâtonnets ou sur « Prendre 1, 2, 3 »), au clavier (touches 1 à 4) et au doigt.
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

Le workflow `.github/workflows/deploy.yml` construit le jeu à chaque push sur `main` et publie le dossier `dist/` sur la branche `gh-pages`. Dans **Settings**, puis **Pages**, la source doit être **Deploy from a branch**, branche `gh-pages`, dossier `/ (root)`.

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
    Character/             personnage SVG et ses humeurs
    Stick/, StickRow/      bâtonnets et rangée interactive
    Seat/                  place d'un joueur : personnage, pseudo, pile, victoires
    MovePicker/            boutons « Prendre 1, 2, 3 »
    ResultDialog/          fin de manche
    AvatarPicker/, Segmented/, Button/, Confetti/
  hooks/                   localStorage, préférence de mouvement réduit
  styles/                  jetons de design (couleurs, typographie, formes) et styles globaux
```

Chaque composant a son propre fichier de styles (CSS Modules). La logique du jeu (`src/game`) ne dépend pas de React : on peut la tester ou la réutiliser telle quelle.

## Choix techniques

- **Personnages en SVG** : formes complexes dont chaque partie (bras, yeux, bouche, accessoire) s'anime séparément avec des transformations CSS.
- **Bâtonnets en CSS** : un élément avec un dégradé et une tête en pseudo-élément. C'est plus léger qu'un SVG par bâtonnet quand il y en a une trentaine, et toutes les animations passent par `transform` et `opacity`, que le navigateur accélère.
- **Aucune bibliothèque d'animation** : les seules dépendances sont React et ReactDOM.
- **Un coup se joue en trois temps** : le personnage tend le bras (les bâtonnets se soulèvent), puis tire (ils s'envolent vers lui et apparaissent dans sa main), puis le coup est appliqué à l'état du jeu.

## La stratégie de l'ordinateur

Quand on peut prendre de 1 à k bâtonnets et que le dernier fait perdre, les positions perdantes pour celui qui doit jouer sont celles où il reste 1, k + 2, 2k + 3... bâtonnets. Le bon coup consiste à y laisser l'adversaire. Avec 20 bâtonnets et une prise de 1 à 3, le premier joueur gagne à coup sûr en prenant 3, puis en complétant toujours à 4 le coup de l'adversaire.

Le niveau Expert joue toujours ce coup quand il existe, Malin le joue 7 fois sur 10, Tranquille 1 fois sur 4.

Le jeu utilise la police Bricolage Grotesque (Google Fonts) ; sans connexion, il bascule sur la police système.
