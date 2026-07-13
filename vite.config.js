import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@":         fileURLToPath(new URL('./src',       import.meta.url)),
      "@recursos": fileURLToPath(new URL('./recursos',  import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
    // Redirige /api/* y /health al backend FastAPI — elimina CORS en dev
    proxy: {
      '/api':    { target: 'http://127.0.0.1:8000', changeOrigin: false },
      '/health': { target: 'http://127.0.0.1:8000', changeOrigin: false },
    },
  },
  // Tauri espera que los assets estén en dist/ al hacer build
  build: {
    outDir: 'dist',
  },
})
