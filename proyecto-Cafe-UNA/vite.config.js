import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

function isLocalBackend(url) {
  return /localhost|127\.0\.0\.1/i.test(url)
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const fullBackendUrl = (process.env.BACKEND_URL || env.BACKEND_URL || 'http://cafeunaof.runasp.net/api').replace(/\/$/, '')
  const backendOrigin = fullBackendUrl.replace(/\/api$/, '')
  const useDevProxy = mode === 'development' && !process.env.NETLIFY && !isLocalBackend(fullBackendUrl)

  // En dev con MonsterASP: el browser llama a /api y Vite hace proxy (evita CORS/ERR_NETWORK).
  const clientBackendUrl = process.env.NETLIFY
    ? '/api'
    : useDevProxy
      ? '/api'
      : fullBackendUrl

  return {
    envPrefix: 'BACKEND',
    define: {
      'import.meta.env.BACKEND_URL': JSON.stringify(clientBackendUrl),
    },
    server: useDevProxy
      ? {
          proxy: {
            '/api': {
              target: backendOrigin,
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
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
