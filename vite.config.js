import { defineConfig } from 'vite'
import vitePluginPug from 'vite-plugin-pug-transformer'

import config from './config.js'

export default defineConfig({
  define: config,
  build: {
    assetsDir: '.'
  },
  plugins: [
    vitePluginPug({
      pugLocals: config
    })
  ]
})
