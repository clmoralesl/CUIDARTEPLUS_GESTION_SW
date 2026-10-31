import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['src/**/*.bd.test.ts'],
    globalSetup: ['src/pruebas-bd/preparar-bd.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
