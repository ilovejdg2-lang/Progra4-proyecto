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
  const useDevProxy = mode === 'development' && !process.env.NETLIFY
  const localBackendUrl = 'http://localhost:5220/api'
  // En `npm run dev` el proxy va al Nest local. BACKEND_URL del .env es para Netlify/producción.
  const fullBackendUrl = normalizeBackendUrl(
    useDevProxy
      ? (env.DEV_BACKEND_URL || localBackendUrl)
      : (process.env.BACKEND_URL || env.BACKEND_URL || localBackendUrl),
  )

  const clientBackendUrl = useDevProxy ? '/api' : fullBackendUrl

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
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      clearMocks: true,
      restoreMocks: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('@tanstack')) return 'vendor-react';
              if (id.includes('lucide-react')) return 'vendor-icons';
              return 'vendor';
            }
          },
        },
      },
    },
  }
})
