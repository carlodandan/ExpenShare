import { defineConfig } from 'vite';

// Main process build. node:sqlite is a Node built-in (no native compile
// step, unlike better-sqlite3) but still needs to stay external and be
// loaded via require() at runtime rather than bundled.
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['node:sqlite', 'electron'],
    },
  },
  resolve: {
    // Keep CJS interop simple for the main process.
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
});
