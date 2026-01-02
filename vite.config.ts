import { defineConfig } from 'vite';

export default defineConfig({
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.bin'],
  publicDir: 'assets',
  server: {
    open: true
  }
});
