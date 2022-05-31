import { Color } from 'culori/fn'

import {
  onCurrentChange,
  valueToColor,
  onPaint,
  current
} from '../../stores/current.js'
import {
  generateIsVisible,
  generateGetAlpha,
  format,
  build,
  inRGB,
  parse
} from '../../lib/colors.js'
import { getCleanCtx, initCanvasSize } from '../../lib/canvas.js'
import { settings } from '../../stores/settings.js'
import { visible } from '../../stores/visible.js'

function initRange(
  type: 'l' | 'c' | 'h' | 'a'
): [HTMLDivElement, HTMLInputElement] {
  let div = document.querySelector<HTMLDivElement>(`.range.is-${type}`)!
  let range = div.querySelector<HTMLInputElement>('.range_input')!

  range.addEventListener('input', () => {
    current.setKey(type, parseFloat(range.value))
  })

  return [div, range]
}

let [rangeL, inputL] = initRange('l')
let [rangeC, inputC] = initRange('c')
let [rangeH, inputH] = initRange('h')
let [rangeA, inputA] = initRange('a')

let canvasL = rangeL.querySelector<HTMLCanvasElement>('.range_space')!
let canvasC = rangeC.querySelector<HTMLCanvasElement>('.range_space')!
let canvasH = rangeH.querySelector<HTMLCanvasElement>('.range_space')!

function paint(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  hasGaps: boolean,
  showP3: boolean,
  showRec2020: boolean,
  getColor: (x: number) => Color
): void {
  let getAlpha = generateGetAlpha(showP3, showRec2020)
  let isVisible = generateIsVisible(showP3, showRec2020)

  let ctx = getCleanCtx(canvas)
  let halfHeight = Math.floor(height / 2)
  let background = window
    .getComputedStyle(canvas)
    .getPropertyValue('--current-surface')

  for (let x = 0; x <= width; x++) {
    let color = getColor(x)
    if (!isVisible(color)) {
      if (hasGaps) {
        continue
      } else {
        return
      }
    }
    if (!inRGB(color)) {
      ctx.fillStyle = format(color)
      ctx.fillRect(x, halfHeight, 1, height)

      ctx.fillStyle = background
      ctx.fillRect(x, 0, 1, halfHeight)

      color.alpha = getAlpha(color)
      ctx.fillStyle = format(color)
      ctx.fillRect(x, 0, 1, halfHeight)
    } else {
      ctx.fillStyle = format(color)
      ctx.fillRect(x, 0, 1, height)
    }
  }
}

onCurrentChange({
  l(value) {
    inputL.value = String(value)
  },
  c(value) {
    inputC.value = String(value)
  },
  h(value) {
    inputH.value = String(value)
  },
  alpha(value) {
    inputA.value = String(value)
  }
})

onPaint({
  ch(value, showP3, showRec2020) {
    let color = valueToColor(value)
    let c = color.c
    let h = color.h ?? 0
    let [width, height] = initCanvasSize(canvasL)
    let factor = L_MAX / width
    paint(canvasL, width, height, true, showP3, showRec2020, x => {
      return build(x * factor, c, h)
    })
  },
  lh(value, showP3, showRec2020) {
    let color = valueToColor(value)
    let l = color.l
    let h = color.h ?? 0
    let [width, height] = initCanvasSize(canvasC)
    let factor = (showRec2020 ? C_MAX_REC2020 : C_MAX) / width
    paint(canvasC, width, height, false, showP3, showRec2020, x => {
      return build(l, x * factor, h)
    })
  },
  lc(value, showP3, showRec2020) {
    let { l, c } = valueToColor(value)
    let [width, height] = initCanvasSize(canvasH)
    let factor = H_MAX / width
    paint(canvasH, width, height, true, showP3, showRec2020, x => {
      return build(l, c, x * factor)
    })
  }
})

function setRangeColor(): void {
  let { real, fallback, space } = visible.get()
  let { p3, rec2020 } = settings.get()
  let isVisible = false
  if (space === 'srgb') {
    isVisible = true
  } else if (space === 'p3' && p3 === 'show') {
    isVisible = true
  } else if (space === 'rec2020' && rec2020 === 'show') {
    isVisible = true
  }
  document.body.style.setProperty('--range-color', real || fallback)
  if (isVisible) {
    rangeL.classList.remove('is-invisible')
    rangeC.classList.remove('is-invisible')
    rangeH.classList.remove('is-invisible')
  } else {
    rangeL.classList.add('is-invisible')
    rangeC.classList.add('is-invisible')
    rangeH.classList.add('is-invisible')
  }
}

visible.subscribe(({ real, fallback }) => {
  setRangeColor()
  let parsed = parse(real || fallback)
  if (parsed) {
    rangeA.style.setProperty('--range-a-from', format({ ...parsed, alpha: 0 }))
    rangeA.style.setProperty('--range-a-to', format({ ...parsed, alpha: 1 }))
  }
})

settings.subscribe(({ rec2020 }) => {
  setRangeColor()
  inputC.max = String(rec2020 === 'show' ? C_MAX_REC2020 : C_MAX)
})
