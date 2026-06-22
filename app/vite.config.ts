import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  build: {
      minify: 'esbuild', // Use esbuild for faster minification
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor'; // Bundle all node_modules into a single vendor chunk
            }
          },
        },
      },
    },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // Automatically updates the app when new code is deployed
      manifest: {
        name: 'LinkNear',
        short_name: 'LinkNear',
        description: 'Turn your debts into monsters and slay them.',
        theme_color: '#010a13',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable', // Essential for Android circles/squares
          },
        ],
      },
    }),
  ],
});
