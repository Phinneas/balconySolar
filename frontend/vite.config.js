import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      writeBundle() {
        copyFileSync(
          resolve(__dirname, '_redirects'),
          resolve(__dirname, 'dist', '_redirects')
        )
      }
    }
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild'
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8787',
        changeOrigin: true
      }
    }
  }
})
