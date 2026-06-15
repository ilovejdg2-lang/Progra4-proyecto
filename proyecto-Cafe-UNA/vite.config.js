import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const fullBackendUrl = (process.env.BACKEND_URL || env.BACKEND_URL || '').replace(/\/$/, '')
  // En Netlify el proxy usa BACKEND_URL completa; el browser llama a /api (mismo origen).
  const clientBackendUrl = process.env.NETLIFY
    ? '/api'
    : (fullBackendUrl || 'http://localhost:5220/api')

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
