import { computed } from 'nanostores'

import {
  hasP3Support,
  mapToRgb,
  format,
  inRGB,
  inP3,
  oklch
} from '../../lib/colors.js'
import { current } from './current.js'

interface VisibleValue {
  type: 'rgb' | 'p3' | 'out'
  supported: boolean
  rgb: string
  p3: string
}

export let visible = computed<VisibleValue, typeof current>(
  current,
  ({ l, c, h, alpha }) => {
    let color = oklch(l, c, h, alpha)
    if (inRGB(color)) {
      let rgb = format(color)
      return {
        type: 'rgb',
        supported: true,
        rgb,
        p3: rgb
      }
    } else if (inP3(color)) {
      return {
        type: 'p3',
        supported: hasP3Support,
        rgb: mapToRgb(color),
        p3: format(color)
      }
    } else {
      return {
        type: 'out',
        supported: false,
        rgb: mapToRgb(color),
        p3: 'none'
      }
    }
  }
)
