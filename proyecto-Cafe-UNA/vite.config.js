import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      tslib: fileURLToPath(new URL('./src/lib/tslib-shim.js', import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})
