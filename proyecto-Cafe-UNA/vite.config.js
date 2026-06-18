import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { normalizeBackendUrl } from './scripts/normalizeBackendUrl.mjs'

function backendOrigin(apiUrl) {
  return apiUrl.replace(/\/api\/?$/, '')
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const fullBackendUrl = normalizeBackendUrl(
    process.env.BACKEND_URL || env.BACKEND_URL || 'http://localhost:5220/api',
  )
  const useDevProxy = mode === 'development' && !process.env.NETLIFY

  // Netlify y desarrollo local: el navegador llama a /api (mismo origen).
  // Vite reenvía /api al backend real definido en BACKEND_URL.
  const clientBackendUrl = process.env.NETLIFY || useDevProxy ? '/api' : fullBackendUrl

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
    server: useDevProxy
      ? {
          proxy: {
            '/api': {
              target: backendOrigin(fullBackendUrl),
              changeOrigin: true,
            },
          },
        }
      : undefined,
    plugins: [
      react(),
      tailwindcss(),
    ],
  }
})
