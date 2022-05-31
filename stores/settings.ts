import { persistentMap } from '@nanostores/persistent'

export type SettingsValue = {
  p3: boolean
  rec2020: boolean
  charts: boolean
}

export let settings = persistentMap<SettingsValue>(
  'settings:',
  {
    p3: true,
    rec2020: false,
    charts: true
  },
  {
    encode(value) {
      return value ? 'show' : 'hide'
    },
    decode(str) {
      return str === 'show'
    }
  }
)
