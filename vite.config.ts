
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode`. The third parameter '' loads all env vars.
  // Fix: Property 'cwd' does not exist on type 'Process' - added explicit import of process from node:process.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This is crucial: it makes process.env.API_KEY available in the browser code
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  }
})
