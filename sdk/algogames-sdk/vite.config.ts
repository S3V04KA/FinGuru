import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  server: {
    port: 3001,
    host: '0.0.0.0'
  },
  preview: {
    allowedHosts: [
      'algogames.gr34ka.ru'
    ]
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'dist/index.js'),
      name: 'AlgoGamesSDK',
      fileName: (format) => `algogames-sdk.${format}.js`,
      formats: ['umd']
    },
    outDir: 'dist-web',
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})