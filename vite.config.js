import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  base: '/better-burger-week-map/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  css: {
    postcss: './postcss.config.js',
  }
})
