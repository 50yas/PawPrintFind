
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
          name: 'PawPrintFind - AI Pet Locator',
          short_name: 'PawPrintFind',
          description: 'PawPrintFind: The AI-powered global network for reuniting lost pets.',
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
          // In development, don't force SW updates to prevent unexpected reloads
          skipWaiting: mode !== 'development',
          clientsClaim: mode !== 'development',
          globPatterns: mode === 'development' ? [] : ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
          runtimeCaching: [
            // Firestore API - Network first with timeout
            {
              urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firestore-data',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 // 1 day
                }
              }
            },
            // Firebase Auth API
            {
              urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'auth-data',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 5 // 5 minutes
                }
              }
            },
            // Firebase Storage - StaleWhileRevalidate for images
            {
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'firebase-storage',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Images - CacheFirst for better performance
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Fonts - CacheFirst
            {
              urlPattern: /\.(?:woff|woff2|ttf|otf)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'font-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            },
            // Google APIs (Maps, GenAI, etc)
            {
              urlPattern: /^https:\/\/.*\.googleapis\.com\/.*$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'google-apis',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 // 1 hour
                }
              }
            }
          ]
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
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Split React and React DOM
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'react-vendor';
            }
            // Split Firebase into separate chunk
            if (id.includes('node_modules/firebase/') || id.includes('node_modules/@firebase/')) {
              return 'firebase-vendor';
            }
            // Split i18next into separate chunk
            if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
              return 'i18n-vendor';
            }
            // Split Three.js and related 3D libraries (heavy, lazy-loaded)
            if (id.includes('node_modules/three') ||
                id.includes('node_modules/@react-three') ||
                id.includes('node_modules/maath')) {
              return 'three-vendor';
            }
            // Split Leaflet maps (lazy-loaded)
            if (id.includes('node_modules/leaflet')) {
              return 'leaflet-vendor';
            }
            // Split Framer Motion
            if (id.includes('node_modules/framer-motion')) {
              return 'framer-vendor';
            }
            // Split Google GenAI
            if (id.includes('node_modules/@google/genai')) {
              return 'genai-vendor';
            }
            // Split DOMPurify and Zod
            if (id.includes('node_modules/dompurify') || id.includes('node_modules/zod')) {
              return 'utils-vendor';
            }
            // All other node_modules
            if (id.includes('node_modules/')) {
              return 'vendor';
            }
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
          pure_funcs: mode === 'production' ? ['console.log', 'console.debug'] : [],
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
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
