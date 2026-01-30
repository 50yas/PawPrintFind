
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.svg'],
        devOptions: {
          enabled: true
        },
        manifest: {
          name: 'Paw Print - Pet Finder AI',
          short_name: 'Paw Print',
          description: 'AI-powered pet finder and health assistant.',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait',
          screenshots: [
            {
              src: 'screenshot-mobile.jpg',
              sizes: '1190x840',
              type: 'image/jpeg',
              form_factor: 'narrow',
              label: 'Mobile Home Screen'
            },
            {
              src: 'screenshot-desktop.jpg',
              sizes: '1190x840',
              type: 'image/jpeg',
              form_factor: 'wide',
              label: 'Desktop Dashboard'
            }
          ],
          icons: [
            {
              src: 'favicon.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any'
            },
            {
              src: 'favicon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any'
            },
            {
              src: 'favicon.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'maskable'
            },
            {
              src: 'favicon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
           skipWaiting: true,
           clientsClaim: true,
           globPatterns: mode === 'development' ? [] : ['**/*.{js,css,html,ico,png,svg,json}'],
           runtimeCaching: [{
                urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*$/,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'firestore-data',
                    expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 60 * 60 * 24 // 1 day
                    }
                }
           }]
        }
      })
    ],
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
        'Cross-Origin-Embedder-Policy': 'unsafe-none'
      }
    },
    test: { // Vitest configuration
      globals: true,
      environment: 'jsdom',
      setupFiles: './vitest.setup.ts', // A setup file for global mocks
      coverage: {
        provider: 'v8', // or 'istanbul'
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules/', '**/firebase.ts', '**/loggerService.ts', '**/audioService.ts']
      },
    },
  };
});
