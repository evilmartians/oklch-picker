import { computed } from 'nanostores'

import { toRgb, formatRgb, build } from '../lib/colors.js'
import { current } from './current.js'

function clamp(l: number, c: number, h: number, alpha = 1): string {
  return formatRgb(toRgb(build(l, c, h, alpha)))
}

export let accent = computed(current, value => {
  let { h } = value
  if (h === 0) h = 286
  if (COLOR_FN === 'oklch') {
    return {
      main: clamp(0.57, 0.18, h),
      surface: clamp(0.7, 0.17, h, 0.2)
    }
  } else {
    return {
      main: clamp(47, 58, h),
      surface: clamp(63, 55, h, 0.2)
    }
  }
})
