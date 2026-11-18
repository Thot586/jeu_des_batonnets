import { useEffect, useState } from 'react';

/** État React synchronisé avec localStorage, avec vérification de la valeur relue. */
export const useLocalStorage = <T,>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw);
        if (isValid(parsed)) return parsed;
      }
    } catch {
      // Stockage indisponible (navigation privée) ou valeur corrompue : on repart des valeurs par défaut.
    }
    return fallback;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Le jeu reste jouable sans mémoriser les réglages.
    }
  }, [key, value]);

  return [value, setValue] as const;
};
