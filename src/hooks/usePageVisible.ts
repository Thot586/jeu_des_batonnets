import { useEffect, useState } from 'react';

/** Vrai tant que l'onglet est affiché : l'ordinateur attend qu'on revienne pour jouer. */
export const usePageVisible = (): boolean => {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden);

  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return visible;
};
