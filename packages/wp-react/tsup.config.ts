import { defineConfig } from 'tsup';

export default defineConfig({
  // Two entry points — keeps component tree-shaking clean while
  // letting agents import manifest types from a separate subpath.
  entry: {
    index:   'src/index.ts',
    runtime: 'src/runtime/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['react', 'react-dom'],
  treeshake: true,
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.js' : '.cjs'
    };
  }
});
