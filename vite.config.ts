
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This creates a global process.env object in the browser with your keys
      // This is critical for the app to work after deployment
      'process.env': JSON.stringify(env)
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    server: {
      port: 3000,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'require-corp'
      }
    },
    test: { // Vitest configuration
      globals: true,
      environment: 'jsdom',
      setupFiles: './vitest.setup.ts', // A setup file for global mocks
      coverage: {
        provider: 'v8', // or 'istanbul'
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules/', '**/types.ts', '**/firebase.ts', '**/loggerService.ts']
      },
    },
  };
});
