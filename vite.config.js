import { defineConfig } from 'vite'

export default defineConfig({
  worker: {
    format: 'module'
  },
  build: {
    assetsDir: '.'
  }
})
