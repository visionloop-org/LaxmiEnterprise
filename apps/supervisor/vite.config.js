import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: './', // Ensures relative assets resolution for GitHub Pages
  plugins: [react()],
  resolve: {
    alias: {
      '@laxmi/shared': path.resolve(__dirname, '../../packages/shared/index.mjs')
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
})
