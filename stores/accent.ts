import { computed } from 'nanostores'

import { buildForCSS } from '../lib/colors.js'
import { current } from './current.js'

export let accent = computed(current, value => {
  let { h } = value
  if (COLOR_FN === 'oklch') {
    return {
      main: buildForCSS(0.57, 0.18, h),
      surface: buildForCSS(0.7, 0.17, h, 0.2)
    }
  } else {
    return {
      main: buildForCSS(47, 58, h),
      surface: buildForCSS(63, 55, h, 0.2)
    }
  }
})
