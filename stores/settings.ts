import { persistentAtom } from '@nanostores/persistent'

let encoder = {
  encode(value: boolean): string {
    return value ? 'show' : 'hide'
  },
  decode(str: string): boolean {
    return str === 'show'
  }
}

export let showCharts = persistentAtom('settings:charts', true, encoder)
export let showP3 = persistentAtom('settings:p3', true, encoder)
export let showRec2020 = persistentAtom('settings:rec2020', false, encoder)
