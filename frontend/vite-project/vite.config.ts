import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // potreba v kontajneri
    port: 80,          // vo vnútri kontajnera počúvaj na 80
    strictPort: true,
    watch: {
      usePolling: true, // dôležité na Windows/Docker
      interval: 300
    }
  }
})
