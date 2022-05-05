import { persistentMap } from '@nanostores/persistent'

export type SettingsValue = {
  p3: 'show' | 'hide'
  rec2020: 'show' | 'hide'
  charts: 'show' | 'hide'
}

export let settings = persistentMap<SettingsValue>('settings:', {
  p3: 'show',
  rec2020: 'hide',
  charts: 'show'
})
