import { computed } from 'nanostores'

import {
  formatRgb,
  format,
  build,
  inRGB,
  toRgb,
  inP3,
  rgb
} from '../../lib/colors.js'
import { hasP3Support } from '../../lib/screen.js'
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
    let color = build(l, c, h, alpha)
    if (inRGB(color)) {
      let rgbCss = formatRgb(rgb(color))
      return {
        type: 'rgb',
        supported: true,
        rgb: rgbCss,
        p3: rgbCss
      }
    } else if (inP3(color)) {
      return {
        type: 'p3',
        supported: hasP3Support,
        rgb: formatRgb(toRgb(color)),
        p3: hasP3Support ? format(color) : 'none'
      }
    } else {
      return {
        type: 'out',
        supported: false,
        rgb: formatRgb(toRgb(color)),
        p3: 'none'
      }
    }
  }
)
