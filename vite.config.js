import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'QR Roster',
        short_name: 'QR Roster',
        description: 'Queensland Rail Mayne Roster',
        theme_color: '#0A0E1A',
        background_color: '#0A0E1A',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/qr-roster/',
        start_url: '/qr-roster/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
      }
    })
  ]
})
