import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.js',
      name: 'MainLib',
      formats: ['iife'],
      fileName: () => 'main'        // base name used by Vite
    },
    rollupOptions: {
      output: {
        entryFileNames: 'main.js'   // force final output file name
      }
    }
  }
});