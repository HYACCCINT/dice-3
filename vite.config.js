import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', 
      manifest: {
        name: 'AI Photo Sorter',
        short_name: 'PhotoSorter',
        description: 'An app to sort photos using AI.',
        theme_color: '#a78bfa',
        icons: [
          {
            src: "firebase.png",
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: "firebase.png",
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})