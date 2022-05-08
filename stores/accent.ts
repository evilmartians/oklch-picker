import { computed } from 'nanostores'

import { toRgb, formatRgb, LchColor } from '../lib/colors.js'
import { current } from './current.js'

function clamp(l: number, c: number, h: number, alpha = 1): string {
  let lch = { mode: 'oklch', l, c, h, alpha } as LchColor
  return formatRgb(toRgb(lch))
}

export let accent = computed(current, value => {
  let { h } = value
  if (h === 0) h = 286
  return {
    main: clamp(0.57, 0.18, h),
    surface: clamp(0.7, 0.17, h, 0.2)
  }
})
