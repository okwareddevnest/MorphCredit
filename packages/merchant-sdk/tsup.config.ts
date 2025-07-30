import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/button.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react'],
  treeshake: true,
  minify: false,
  target: 'es2020',
  outDir: 'dist',
  onSuccess: 'tsc --noEmit'
}); 