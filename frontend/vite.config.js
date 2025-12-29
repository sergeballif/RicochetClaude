import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for science.mom/ricochet
  base: '/ricochet/',
  server: {
    port: 3000
  }
})
