import {
  onCurrentChange,
  valueToColor,
  onPaint,
  current
} from '../../stores/current.js'
import {
  generateIsVisible,
  generateGetAlpha,
  canvasFormat,
  fastFormat,
  AnyLch,
  build,
  inRGB
} from '../../lib/colors.js'
import { getCleanCtx, initCanvasSize } from '../../lib/canvas.js'
import { showRec2020, showP3 } from '../../stores/settings.js'
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
  getColor: (x: number) => AnyLch
): void {
  let getAlpha = generateGetAlpha(showP3.get(), showRec2020.get())
  let isVisible = generateIsVisible(showP3.get(), showRec2020.get())

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
      ctx.fillStyle = canvasFormat(color)
      ctx.fillRect(x, halfHeight, 1, height)

      ctx.fillStyle = background
      ctx.fillRect(x, 0, 1, halfHeight)

      color.alpha = getAlpha(color)
      ctx.fillStyle = canvasFormat(color)
      ctx.fillRect(x, 0, 1, halfHeight)
    } else {
      ctx.fillStyle = canvasFormat(color)
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
  ch(value) {
    let color = valueToColor(value)
    let c = color.c
    let h = color.h ?? 0
    let [width, height] = initCanvasSize(canvasL)
    let factor = L_MAX / width
    paint(canvasL, width, height, true, x => build(x * factor, c, h))
  },
  lh(value) {
    let color = valueToColor(value)
    let l = color.l
    let h = color.h ?? 0
    let [width, height] = initCanvasSize(canvasC)
    let factor = (showRec2020.get() ? C_MAX_REC2020 : C_MAX) / width
    paint(canvasC, width, height, false, x => build(l, x * factor, h))
  },
  lc(value) {
    let { l, c } = valueToColor(value)
    let [width, height] = initCanvasSize(canvasH)
    let factor = H_MAX / width
    paint(canvasH, width, height, true, x => build(l, c, x * factor))
  }
})

function setRangeColor(): void {
  let { real, fallback, space } = visible.get()
  let isVisible = false
  if (space === 'srgb') {
    isVisible = true
  } else if (space === 'p3' && showP3.get()) {
    isVisible = true
  } else if (space === 'rec2020' && showRec2020.get()) {
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

visible.subscribe(({ color }) => {
  setRangeColor()
  rangeA.style.setProperty('--range-a-from', fastFormat({ ...color, alpha: 0 }))
  rangeA.style.setProperty('--range-a-to', fastFormat({ ...color, alpha: 1 }))
})

showRec2020.subscribe(show => {
  setRangeColor()
  inputC.max = String(show ? C_MAX_REC2020 : C_MAX)
})
