import { persistentAtom } from '@nanostores/persistent'
import { computed } from 'nanostores'

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
export let show3d = persistentAtom('settings:3d', false, encoder)

export type RgbMode = 'rgb' | 'rec2020' | 'p3'

export let biggestRgb = computed([showP3, showRec2020], (p3, rec2020) => {
  if (rec2020) {
    return 'rec2020'
  } else if (p3) {
    return 'p3'
  } else {
    return 'rgb'
  }
})

export type OutputFormats =
  | 'hex/rgba'
  | 'hex'
  | 'rgb'
  | 'hsl'
  | 'p3'
  | 'lch'
  | 'lab'
  | 'oklab'
  | 'numbers'

export let outputFormat = persistentAtom<OutputFormats>(
  'settings:output',
  'hex/rgba'
)
