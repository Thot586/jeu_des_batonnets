import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relative : le site fonctionne aussi bien à la racine
// qu'à l'adresse https://<pseudo>.github.io/<depot>/ de GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: './',
});
