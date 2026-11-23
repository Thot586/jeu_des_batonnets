/**
 * Définitions SVG partagées par tous les dessins de papier, montées une seule fois.
 * - paper-grain : grain de fibre posé par-dessus les aplats de gouache ;
 * - paper-lift : ombre d'une découpe posée sur une autre (épaisseur du papier).
 */
export const PaperDefs = () => (
  <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
    <defs>
      <filter id="paper-noise" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="4" stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 0.16  0 0 0 0 0.12  0 0 0 0 0.09  0 0 0 0.42 0" />
      </filter>
      <pattern id="paper-grain" patternUnits="userSpaceOnUse" width="90" height="90">
        <rect width="90" height="90" filter="url(#paper-noise)" />
      </pattern>
      <filter id="paper-lift" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="1.1" dy="1.6" stdDeviation="0.5" floodColor="#2a1f17" floodOpacity="0.32" />
      </filter>
    </defs>
  </svg>
);
