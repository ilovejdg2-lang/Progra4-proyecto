import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { normalizeBackendUrl } from './scripts/normalizeBackendUrl.mjs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const fullBackendUrl = normalizeBackendUrl(
    process.env.BACKEND_URL || env.BACKEND_URL || 'http://localhost:5220/api',
  )

  // Netlify: /api/* → proxy en _redirects.
  // Desarrollo: llamada directa al backend (CORS ya habilitado). Evita timeouts del proxy de Vite.
  const clientBackendUrl = process.env.NETLIFY ? '/api' : fullBackendUrl

  return {
    envPrefix: 'BACKEND',
    define: {
      'import.meta.env.BACKEND_URL': JSON.stringify(clientBackendUrl),
    },
    resolve: {
      alias: {
        tslib: fileURLToPath(new URL('./src/lib/tslib-shim.js', import.meta.url)),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
  }
})
