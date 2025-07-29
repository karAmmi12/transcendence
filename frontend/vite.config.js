import { defineConfig } from 'vite'
import { resolve } from 'path'

// installer node path, et virer tout ce qui est dirname
// mettre juste un alias @ si non vous allez trop vous perdre
// ne pas mettre tout le build context par defaut vite build dans dist
// pas de vite en prod (interdit) donc pas de vite preview
// proxy vers localhost:(port-du-backend) pour le dev et pour la prod osef



export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        // striper /api/ 
        target: 'http://backend:8000', //localhost
        changeOrigin: true,
        secure: false
      },
      '/socket.io': { //mettre ws ou socket pas de point
        target: 'http://backend:8000',
        changeOrigin: true,
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types')
    }
  }
})