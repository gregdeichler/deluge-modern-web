import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from './package.json' with { type: 'json' }

// NOTE: base './' keeps asset URLs relative so the built app works from any
// subpath deluge-web serves it at (e.g. /themes/modern/).
export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_SHA__: JSON.stringify(process.env.BUILD_SHA || process.env.GITHUB_SHA || 'dev'),
  },
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
