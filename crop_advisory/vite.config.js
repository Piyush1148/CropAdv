import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Allow external connections
    strictPort: true, // Fail if port is already in use
    hmr: {
      overlay: false, // Disable error overlay to reduce interruptions
    },
    // Increase timeout for WebSocket connections
    ws: true,
  },
  // Optimize dependency handling
  optimizeDeps: {
    exclude: [], // Add any problematic dependencies here
  },
  build: {
    // Improve build performance
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
