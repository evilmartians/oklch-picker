import { computed } from 'nanostores'

import {
  getSpace,
  type Lch,
  Space,
  toNativeString,
  toRgbString
} from '../lib/colors.ts'
import { current, valueToColor } from './current.ts'
import { support } from './support.ts'

export interface VisibleValue {
  color: Lch
  fallback: string
  fallbackBrowsers: string
  real: false | string
  space: 'out' | 'p3' | 'rec2020' | 'srgb'
}

const SPACE_NAME = {
  [Space.Out]: 'out',
  [Space.P3]: 'p3',
  [Space.Rec2020]: 'rec2020',
  [Space.sRGB]: 'srgb'
} as const

export let visible = computed(
  [current, support],
  (value, { p3, rec2020 }): VisibleValue => {
    let color = valueToColor(value)
    let space = getSpace(color)
    let name = SPACE_NAME[space]

    if (space === Space.sRGB) {
      let css = toRgbString(color)
      return { color, fallback: css, real: css, space: name }
    }

    let fallback = toRgbString(color)
    let canShow =
      (space === Space.P3 && p3) || (space === Space.Rec2020 && rec2020)
    return {
      color,
      fallback,
      real: canShow ? toNativeString(color) : false,
      space: name
    }
  }
)
