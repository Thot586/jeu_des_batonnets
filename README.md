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
- Score cumulé sur plusieurs manches, avec alternance du joueur qui commence. Après 3 victoires d'affilée, le joueur met des lunettes de soleil, jusqu'à sa prochaine défaite.
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
  App.tsx                  enchaînement des écrans, score et séries de victoires
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
    Backdrop/              décor du fond : collines de papier et soleil
    Proscenium/            draperies du cadre de scène (grands écrans)
    CutoutTitle/           titre en lettres découpées
    SoundToggle/           bouton son et vibrations
    Stick/, StickRow/      bâtonnets et rangée interactive
    Seat/                  place d'un joueur : personnage, pseudo, pile, victoires
    MovePicker/            boutons « Prendre 1, 2, 3 »
    ResultDialog/          fin de manche
    AvatarPicker/, Segmented/, Button/, Confetti/
  art/                     formes découpées à la main (générées), définitions SVG partagées,
                           regard qui suit la souris, parallaxe du décor
  feedback/                son (Web Audio) et vibrations
  assets/fonts/            polices hébergées avec le jeu (licence SIL OFL)
  assets/textures/         vraies matières : kraft, papier Canson, papier aquarelle, bois, planche peinte
  hooks/                   localStorage, préférence de mouvement réduit
  styles/                  jetons de design (couleurs, typographie, formes) et styles globaux
scripts/textures.py        fabrique les textures de matières (Python, numpy et Pillow)
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

**Profondeur.** Le jeu est construit comme un diorama, en trois plans :
- au fond, devant le mur de kraft, deux rangées de collines découpées et un soleil qui dépasse entre elles (à partir de la tablette) ;
- au milieu, la scène : un bloc de carton épais (on voit sa tranche), posé sur une feuille safran ;
- devant, sur les grands écrans, deux draperies retenues par une embrasse.

Chaque plan pose une ombre floue sur celui de derrière. Les découpes ont une vraie épaisseur : leur ombre empile la tranche du carton, une ombre de contact et une ombre ambiante, et les lettres du titre ont leur tranche d'un ton plus sombre. Les marionnettes ont un liseré d'épaisseur et projettent leur ombre sur le mur. À la souris, la caméra bouge un peu (parallaxe à 12 images par seconde) : le fond suit le curseur, les draperies partent dans l'autre sens, la scène reste immobile pour ne jamais gêner le jeu. Aucune parallaxe au doigt ni en mouvement réduit.

**Vraies matières.** Chaque surface a la matière qu'elle aurait dans un vrai théâtre de papier :
- le mur du fond est en **papier kraft** : fibres longues couchées dans le sens de fabrication, petits amas de pâte, éclats de bois ;
- les personnages, les boutons, les étiquettes et le décor sont en **papier Canson** de couleur, avec ses fibres feutrées ;
- les cartes, la pancarte de fin et les boutons « Prendre » sont en **papier aquarelle** épais, avec les bosses du grain à froid éclairées en rasant ;
- la scène est une **planche peinte** en bleu : le veinage du bois ressort en relief sous la peinture, avec les traces du pinceau ;
- les bâtonnets sont en **bois clair** (veines, fibres, pores), chacun avec son morceau de veinage et sa teinte, et leur tête est une pâte rugueuse et mate.

Les textures sont fabriquées par `scripts/textures.py` à partir de la structure physique de chaque matière, sans couture, pour un écran de densité 2. Les papiers et la planche sont des calques transparents : ils se posent sur n'importe quelle couleur de la palette sans la changer, ce qui garde les contrastes du texte. Elles suivent la taille de l'interface (en rem), si bien qu'une fibre garde la même taille par rapport à l'objet sur un téléphone comme sur un écran 4K. Poids total : environ 300 ko. Pour remplacer une matière par une photo (par exemple un scan de Poly Haven ou d'ambientCG, sous licence CC0), il suffit de déposer une image raccordable du même nom dans `src/assets/textures`.

**Formes générées.** Chaque contour (corps, yeux, bâtonnets, étiquettes) est calculé à partir d'une graine (`src/art/paper.ts`) : légèrement irrégulier, mais identique à chaque affichage.

**Son.** Tout vient du papier : tapotement de carton, glissement de bandes, froissement du rideau, et un petit air de kalimba en fin de manche. Les sons sont synthétisés avec Web Audio (aucun fichier audio) et ne démarrent qu'après un premier geste, comme l'exigent les navigateurs.

Pour qu'on ne s'en lasse pas, aucun son n'est rejoué à l'identique :
- **variantes sans répétition** : chaque bruitage existe en plusieurs versions (4 façons de tirer une bande, 3 de la poser, 5 petits motifs de tour, 3 airs de victoire...), et la même ne sort jamais deux fois de suite ;
- **petites variations** dans chaque version : hauteur, durée, départ et volume (± 1,5 dB) bougent un peu ;
- **une voix par personnage** : Mousse frotte lentement un papier sourd, Zeste arrache d'un coup sec et clair, Bleuet tire avec précaution, Praline a un papier léger et soyeux, Pépin est vif ;
- **le nombre compte** : tirer 3 bâtonnets fait entendre 3 bandes, décalées, de moins en moins fortes ;
- **la stéréo** : le son vient du côté du joueur qui tire ; le son de fin, du côté du gagnant ;
- **une mélodie qui monte** : à chaque tirage, une note de bois sonne dans la pile, un cran plus haut que la précédente, sur une gamme pentatonique (toutes les notes vont ensemble). La manche grimpe ainsi vers sa fin, et on entend où on en est ;
- **l'accoutumance** : un son entendu souvent dans les dernières secondes se fait un peu plus discret (jusqu'à -3 dB), puis retrouve son niveau ;
- **une petite pièce** : une réverbération très légère réchauffe l'ensemble et évite la sécheresse qui fatigue l'oreille ;
- **la série** : après 3 victoires d'affilée, l'air de victoire se termine par une pluie d'étincelles, un peu plus longue à chaque victoire.

Les niveaux ont été mesurés hors ligne sur toutes les variantes et toutes les voix pour garder une hiérarchie claire : victoire en crête vers -7 dBFS, défaite vers -8, impacts et glissements vers -11, actions et clics vers -12, distribution et sélection vers -15, jamais au-dessus de -5.

**Vibrations.** Une seule par action validée : une impulsion par bâtonnet pris (on sent combien on en a tiré), un motif joyeux pour la victoire, et une seule impulsion courte pour la défaite, jamais plus forte qu'une victoire.

**Mouvement réduit.** Si le système le demande, aucune animation de décor ni parallaxe : tout s'affiche directement dans son état final. Les informations ne passent jamais par le mouvement seul : la série de victoires est aussi écrite en toutes lettres.

## Les personnages

Chacun a son caractère, joué par de petits détails plutôt que par des exagérations (`src/game/personalities.ts` pour le tempo, `Character.module.css` pour les gestes).

| | Caractère | Pour tirer | Pour réfléchir | En attendant | Victoire | Défaite |
| --- | --- | --- | --- | --- | --- | --- |
| Pépin | vif, sûr de lui | geste sec, se penche franchement | tapote du pied | tapote du pied, s'étire en bâillant | saute, le pompon rebondit | donne un coup de pied dans le sol |
| Mousse | calme, rêveur | lentement ; l'antenne suit avec retard | l'antenne tourne doucement | l'antenne se balance | petits sauts lents | l'antenne tombe |
| Zeste | nerveux, aux aguets | coup d'œil de côté, se hérisse | regarde partout | regarde à droite, à gauche | sauts rapides, deux bras levés | les cheveux s'aplatissent |
| Bleuet | posé, réfléchi | remonte ses lunettes, hésite un instant | main au menton | remonte ses lunettes | hoche la tête, bras levé | les lunettes glissent |
| Praline | élégante, malicieuse | penche la tête, le nœud frémit | lève les yeux, tête penchée | penche la tête, agite son nœud | fait un tour sur elle-même | le nœud tombe, regard ailleurs |

## Les petits détails

- Chaque personnage cligne des yeux, respire et jette des coups d'œil à son propre rythme ; certains clignent deux fois de suite.
- Au repos, ils suivent le curseur du regard (souris uniquement, par petites poses).
- Celui qui ne joue pas suit des yeux celui qui joue ou réfléchit.
- Au survol d'un coup, votre personnage regarde les bâtonnets et prépare son bras (anticipation).
- Quand les bâtonnets arrivent dans la pile, le personnage se tasse une image (impact).
- Quand on le fait attendre, il s'occupe (son tic) vers 8 à 10 secondes, puis bâille vers 15 à 19 secondes. Rien n'arrive à heure fixe, l'autre a parfois son propre tic à un autre moment, et ce n'est pas toujours le même qui commence.
- Chacun bâille à son rythme : Mousse s'étire longuement, Zeste expédie. Le bâillement est parfois contagieux, mais l'autre ne bâille qu'après avoir vu le premier finir, jamais en même temps.
- En fin de partie serrée, tout le monde respire et cligne un peu plus vite.
- L'ombre au sol rétrécit quand un personnage saute et s'élargit à l'atterrissage.
- L'ordinateur ne joue pas tant que l'onglet est caché : on ne rate jamais son coup.
- Chaque bruit répété change légèrement de hauteur : deux coups de suite ne sonnent jamais pareil.
- La fête suit le gagnant : sur la pancarte, chacun garde sa place à table (le gagnant de droite fête sa victoire à droite, le perdant le regarde), et les confettis tombent surtout de son côté.
- Sur la pancarte de fin, le point du gagnant s'ajoute sous nos yeux quand elle s'arrête de se balancer. Fermée avec Échap, elle remonte au bout de ses ficelles au lieu de disparaître.
- Typographie française : espaces insécables avant les deux-points et les points d'interrogation, et dans les guillemets ; « 1 à 3 » ne se coupe jamais en fin de ligne.
- On peut taper vite sur les boutons et les bâtonnets : ni zoom par double appui, ni sélection de texte, ni menu d'appui long.
- Le gagnant de la manche est bordé d'un liseré blanc, comme un autocollant, sur la scène et sur la pancarte de fin.
- Trois victoires d'affilée : les lunettes de soleil tombent sur le nez en quelques images, avec un petit rebond, et un reflet traverse les verres de temps en temps. À la première défaite, elles glissent puis tombent. Bleuet range ses lunettes rondes pendant ce temps.

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
