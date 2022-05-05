import { defineConfig } from 'vite'
import vitePluginPug from 'vite-plugin-pug-transformer'

import config from './config.js'

config.LCH = config.COLOR_FN !== '"oklch"'

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
