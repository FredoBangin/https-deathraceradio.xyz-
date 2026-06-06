import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      // Proxy /proxy-audio/* → https://juicewrldapi.com/files/*
      // This bypasses CORS since the request is made server-side
      '/proxy-audio': {
        target: 'https://juicewrldapi.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/proxy-audio/, '/files'),
      },
    },
  },
})
