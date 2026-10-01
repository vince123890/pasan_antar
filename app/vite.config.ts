/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Pesan Antar',
        short_name: 'Pesan Antar',
        description: 'Pesan antar dari warung & toko terdekat',
        lang: 'id',
        start_url: '/',
        display: 'standalone',
        background_color: '#fafaf9',
        theme_color: '#e8590c',
        categories: ['shopping', 'food', 'business'],
        shortcuts: [
          { name: 'Pesanan masuk (penjual)', short_name: 'Penjual', url: '/seller', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
          { name: 'Pesanan saya (pembeli)', short_name: 'Pesanan saya', url: '/pesanan', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
        ],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/storage/v1/object/public/'),
            handler: 'CacheFirst',
            options: { cacheName: 'images', expiration: { maxEntries: 300, maxAgeSeconds: 30 * 86400 } },
          },
          {
            urlPattern: /^https:\/\/[abc]?\.?tile\.openstreetmap\.org\//,
            handler: 'CacheFirst',
            options: { cacheName: 'tiles', expiration: { maxEntries: 200, maxAgeSeconds: 7 * 86400 } },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
