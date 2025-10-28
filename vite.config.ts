import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    // Expose environment variables to the client (Vite automatically handles VITE_ prefixed vars)
    // These are fallback overrides for non-VITE_ prefixed vars (legacy support)
    define: {
      'import.meta.env.CLIENT_ID': JSON.stringify(env.VITE_CLIENT_ID || env.CLIENT_ID),
      'import.meta.env.CLIENT_SECRET': JSON.stringify(env.VITE_CLIENT_SECRET || env.CLIENT_SECRET),
      'import.meta.env.VITE_CLIENT_ID': JSON.stringify(env.VITE_CLIENT_ID),
      'import.meta.env.VITE_CLIENT_SECRET': JSON.stringify(env.VITE_CLIENT_SECRET),
      'import.meta.env.VITE_DEFAULT_NOTES_AGENT_ID': JSON.stringify(env.VITE_DEFAULT_NOTES_AGENT_ID),
      'import.meta.env.VITE_DEFAULT_INTERROGATION_AGENT_ID': JSON.stringify(env.VITE_DEFAULT_INTERROGATION_AGENT_ID),
    },
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
  }
})