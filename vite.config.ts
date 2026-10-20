import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import electron from 'vite-plugin-electron/simple';

export default defineConfig({
  vite: {
    base: './',
    plugins: [
      electron({
        main: {
          entry: 'electron/main.ts',
          vite: {
            build: {
              rollupOptions: {
                external: ['better-sqlite3', 'electron', 'exceljs'],
              },
            },
          },
        },
        preload: {
          input: 'electron/preload.ts',
          vite: {
            build: {
              rollupOptions: {
                external: ['electron'],
              },
            },
          },
        },
      }),
    ],
  },
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: 'node-server',
  },
});