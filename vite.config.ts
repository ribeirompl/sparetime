import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

/**
 * Vite Configuration with PWA support and bundle optimization
 *
 * Performance Budget:
 * - Target initial JS bundle: ~200KB gzipped
 * - CI should warn if bundle exceeds 200KB
 *
 * Optimizations:
 * - Lazy loading for route components (see router/index.ts)
 * - Vendor chunking for better caching
 * - Tree-shaking enabled by default
 * - Minification with esbuild
 */
export default defineConfig({
  base: '/sparetime/',
  // server: {
  //   host: "0.0.0.0",
  // },
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Enable PWA behavior during `npm run dev` for local testing on localhost
      devOptions: {
        enabled: true
      },
      includeAssets: ['icons/*.png', 'icons/*.svg', 'robots.txt'],
      manifest: {
        name: 'SpareTime Task Copilot',
        short_name: 'SpareTime',
        description: 'Personal task copilot for managing home chores and projects',
        theme_color: '#4F46E5',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.googleapis\.com\/drive\/v3\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'google-drive-api',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    // Enable source maps for debugging in production (optional)
    sourcemap: false,

    // Target modern browsers for smaller output
    target: 'es2022',

    // Minify with esbuild for faster builds
    minify: 'esbuild',

    // Chunk splitting configuration for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-dexie': ['dexie'],
          'vendor-date': ['date-fns'],
          'vendor-ui': ['@headlessui/vue']
        }
      }
    },

    // Report compressed size to verify bundle budget
    reportCompressedSize: true,

    // Chunk size warning threshold (200KB gzipped target)
    // Note: This is uncompressed; gzipped will be ~3-4x smaller
    chunkSizeWarningLimit: 500
  }
})
