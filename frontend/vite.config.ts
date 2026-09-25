import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// NOTE: base './' keeps asset URLs relative so the built app works from any
// subpath deluge-web serves it at (e.g. /themes/modern/).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/json': { target: 'http://localhost:8112', changeOrigin: true },
      '/upload': { target: 'http://localhost:8112', changeOrigin: true }
    }
  },
  build: { outDir: '../deluge_modern_web/data/dist', emptyOutDir: true }
})
