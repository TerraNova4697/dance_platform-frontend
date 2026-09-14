import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/frontend',
  build: {
    outDir: '../my_app/public/frontend',
    emptyOutDir: true,
    manifest: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5180,        // Назначаем порт 3000 (или 5180)
    strictPort: true,
    hmr: {
        host: 'dance.frappe', // Хост, через который вы заходите из браузера
        clientPort: 80,       // Порт Nginx (или 9001/8000, если используете другой)
      },
    proxy: {
      '/api': {
        target: 'http://dance.frappe',
        changeOrigin: true,
        headers: {
          // Гарантирует, что Frappe поймет, для какого сайта выполняется запрос
          Host: 'dance.localhost',
        },
      },
      '/socket.io': {
        target: 'http://dance.frappe',
        ws: true,
        changeOrigin: true,
        headers: {
          Host: 'library.localhost', // Заголовок Host, ожидаемый Nginx в /socket.io/
        },
      },
      '/files': {
        target: 'http://dance.frappe',
        changeOrigin: true,
        headers: {
          Host: 'dance.localhost',
        },
      },
      '/assets': {
        target: 'http://dance.frappe',
        changeOrigin: true,
        headers: {
          Host: 'dance.localhost',
        },
      },
    },
  },
});
