import styles from './Footer.module.css';

/** Pied de page : crédit de l'auteur et origine du jeu. */
export const Footer = () => (
  <footer className={styles.footer}>
    <p className={styles.credit}>
      Développé par <strong>Dr FENOHASINA T.J. Félicien</strong>, psychiatre, développeur
      d'applications web
    </p>

    <details className={styles.origin}>
      <summary className={styles.summary}>Qui a inventé ce jeu ?</summary>
      <div className={styles.body}>
        <p>
          Personne en particulier : le jeu des bâtonnets appartient à la famille des jeux de Nim,
          des jeux de prise d'objets pratiqués depuis des siècles, dont l'origine exacte reste
          inconnue. Les premières mentions européennes datent du début du XVIe siècle.
        </p>
        <p>
          Le mathématicien Charles L. Bouton, de l'université Harvard, leur a donné le nom de
          « Nim » et en a publié la théorie complète en 1901. En France, une variante à plusieurs
          rangées a été rendue célèbre par le film <cite>L'Année dernière à Marienbad</cite> (1961),
          et la version à un seul tas, où l'on prend 1, 2 ou 3 bâtonnets, par l'émission{' '}
          <cite>Fort Boyard</cite>.
        </p>
      </div>
    </details>
  </footer>
);
