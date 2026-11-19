import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base './' — чтобы собранный dist/index.html можно было открыть даже с диска.
// viteSingleFile вшивает JS и CSS в index.html: сборка остаётся одним файлом + папки с медиа.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
