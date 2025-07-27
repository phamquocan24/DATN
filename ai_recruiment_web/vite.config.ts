import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy for general API calls
      '/api/v1': {
        target: 'https://topcv.click',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/v1/, '/api/v1'),
      },
      // Separate proxy specifically for the health check
      '/health': {
        target: 'https://topcv.click',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
