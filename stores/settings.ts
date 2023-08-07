import { persistentAtom } from '@nanostores/persistent'
import { computed } from 'nanostores'

let encoder = {
  decode(str: string): boolean {
    return str === 'show'
  },
  encode(value: boolean): string {
    return value ? 'show' : 'hide'
  }
}

export let showCharts = persistentAtom('settings:charts', true, encoder)
export let showP3 = persistentAtom('settings:p3', true, encoder)
export let showRec2020 = persistentAtom('settings:rec2020', false, encoder)
export let show3d = persistentAtom('settings:3d', false, encoder)

export type RgbMode = 'p3' | 'rec2020' | 'rgb'

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
  | 'figmaP3'
  | 'hex'
  | 'hex/rgba'
  | 'hsl'
  | 'lab'
  | 'lch'
  | 'numbers'
  | 'oklab'
  | 'p3'
  | 'rgb'

export let outputFormat = persistentAtom<OutputFormats>(
  'settings:output',
  'hex/rgba'
)
