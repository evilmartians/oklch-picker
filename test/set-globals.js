import { Window } from 'happy-dom'

import config from '../config.js'

for (let key in config) {
  if (
    typeof config[key] === 'string' &&
    config[key].startsWith('"') &&
    config[key].endsWith('"')
  ) {
    globalThis[key] = config[key].slice(1, -1)
  } else {
    globalThis[key] = config[key]
  }
}

globalThis.window = new Window({ url: 'https://localhost:8080' })
globalThis.document = window.document
globalThis.location = window.location
globalThis.history = window.history
globalThis.CSS = window.CSS
