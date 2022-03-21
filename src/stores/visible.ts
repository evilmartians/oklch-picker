import { computed } from 'nanostores'

import {
  toRgbFormat,
  formatRgb,
  format,
  build,
  inRGB,
  inP3
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
      let rgbCss = formatRgb(color)
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
        rgb: toRgbFormat(color),
        p3: hasP3Support ? format(color) : 'none'
      }
    } else {
      return {
        type: 'out',
        supported: false,
        rgb: toRgbFormat(color),
        p3: 'none'
      }
    }
  }
)
