import { Features } from 'lightningcss'
import { defineConfig } from 'vite'
import vitePluginPug from 'vite-plugin-pug-transformer'

import config from './config.js'

let allFeatures = 0
for (let feature in Features) {
  allFeatures |= Features[feature as keyof typeof Features]
}

export default defineConfig({
  build: {
    assetsDir: '.',
    rollupOptions: {
      output: {
        chunkFileNames: 'model-[hash].js'
      }
    }
  },
  css: {
    lightningcss: {
      exclude: allFeatures,
      targets: {}
    },
    transformer: 'postcss'
  },
  define: config,
  plugins: [
    vitePluginPug({
      pugLocals: config
    })
  ]
})
