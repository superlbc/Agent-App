import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // everything under /api → https://interact.interpublic.com
      '/api': {
        target: 'https://interact.interpublic.com',
        changeOrigin: true,
        secure: true, // false only if your corp proxy uses a self-signed cert
        // Remove browser Origin header so the upstream WAF treats it like a server-to-server call
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin')
          })
        },
      },
    },
  },
})