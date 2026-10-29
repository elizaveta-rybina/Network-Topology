import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { topologyApiPlugin } from './server/topologyApi'
import { mockTopology } from './src/mocks/topologyData'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), topologyApiPlugin(mockTopology)],
  server: {
    proxy: {
       '/api': {
        target: 'http://impulse.yadro.msk.ru',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => path.replace(/^\/api/, ''),
      },
    },
  },
})
