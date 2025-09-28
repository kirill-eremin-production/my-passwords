import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'local.passwords.keremin.ru',
    port: 3000,
    https: {
      key: fs.readFileSync('ssl/local.passwords.keremin.ru.key'),
      cert: fs.readFileSync('ssl/local.passwords.keremin.ru.crt')
    },
    proxy: {
      '/api': {
        target: 'http://localhost:60125',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          crypto: ['crypto-js']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})