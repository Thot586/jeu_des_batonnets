import paperTexture from '../assets/textures/paper.webp';

/**
 * Définitions SVG partagées par tous les dessins de papier, montées une seule fois.
 * - paper-grain : vrai grain de papier Canson (calque transparent) posé sur les aplats ;
 * - paper-lift : ombre d'une découpe posée sur une autre (épaisseur du papier) ;
 * - paper-sticker : liseré blanc d'autocollant autour du gagnant.
 */
export const PaperDefs = () => (
  <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
    <defs>
      {/* Une tuile de 200 unités s'affiche sur 150 à 180 px : la même échelle que le papier des cartes. */}
      <pattern id="paper-grain" patternUnits="userSpaceOnUse" width="200" height="200">
        <image href={paperTexture} width="200" height="200" />
      </pattern>
      {/* Autocollant : la silhouette est bordée de papier blanc, posé un peu au-dessus du fond. */}
      <filter id="paper-sticker" x="-15%" y="-15%" width="130%" height="130%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="4.2" result="grown" />
        <feFlood floodColor="#fbf7ec" result="white" />
        <feComposite in="white" in2="grown" operator="in" result="border" />
        <feOffset in="grown" dx="1.6" dy="2.6" result="offset" />
        <feGaussianBlur in="offset" stdDeviation="1.6" result="blurred" />
        <feFlood floodColor="#2a1f17" floodOpacity="0.32" result="ink" />
        <feComposite in="ink" in2="blurred" operator="in" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="border" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="paper-lift" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="1.1" dy="1.6" stdDeviation="0.5" floodColor="#2a1f17" floodOpacity="0.32" />
      </filter>
    </defs>
  </svg>
);
