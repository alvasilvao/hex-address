import { defineConfig } from 'tsup';

export default defineConfig([
  // Node.js build (CJS + ESM)
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
    bundle: true,
    external: ['h3-js'],
  },
  // Browser build (IIFE + minified)
  {
    entry: ['src/browser.ts'],
    format: ['iife'],
    globalName: 'HexAddress',
    dts: false,
    sourcemap: true,
    clean: false,
    splitting: false,
    minify: true,
    target: 'es2015', // Better browser support
    outDir: 'dist',
    outExtension: () => ({ js: '.browser.js' }),
    bundle: true,
    external: [], // Bundle everything for browser
    esbuildOptions: (options) => {
      options.define = {
        'process.env.NODE_ENV': '"production"',
      };
      options.treeShaking = true;
    },
  },
]);