import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// A separate, private output. The public build has no import path to the editor.
export default defineConfig({
  plugins: [react()],
  build: { outDir: '.build/editor', emptyOutDir: true, rollupOptions: { input: resolve('editor/index.html') } }
});
