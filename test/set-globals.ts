import { setPersistentEngine } from '@nanostores/persistent'
import { Window } from 'happy-dom'

import config from '../config.ts'

setPersistentEngine({}, { addEventListener() {}, removeEventListener() {} })

let keys = Object.keys(config) as (keyof typeof config)[]
for (let key of keys) {
  let value = config[key]
  if (
    typeof value === 'string' &&
    value.startsWith('"') &&
    value.endsWith('"')
  ) {
    Object.defineProperty(globalThis, key, { value: value.slice(1, -1) })
  } else {
    Object.defineProperty(globalThis, key, { value })
  }
}

let win = new Window({ url: 'https://localhost:8080' })
Object.defineProperty(globalThis, 'window', { value: win })
Object.defineProperty(globalThis, 'document', { value: win.document })
Object.defineProperty(globalThis, 'location', { value: win.location })
Object.defineProperty(globalThis, 'history', { value: win.history })
Object.defineProperty(globalThis, 'CSS', { value: win.CSS })
