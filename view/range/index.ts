import { getCleanCtx, initCanvasSize } from '../../lib/canvas.js'
import {
  type AnyLch,
  build,
  canvasFormat,
  fastFormat,
  generateGetSpace,
  Space
} from '../../lib/colors.js'
import { getBorders } from '../../lib/dom.js'
import {
  current,
  onCurrentChange,
  onPaint,
  valueToColor
} from '../../stores/current.js'
import { showP3, showRec2020 } from '../../stores/settings.js'
import { visible } from '../../stores/visible.js'

function initRange(
  type: 'a' | 'c' | 'h' | 'l'
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
  let ctx = getCleanCtx(canvas)
  let halfHeight = Math.floor(height / 2)
  let [borderP3, borderRec2020] = getBorders()
  let getSpace = generateGetSpace(showP3.get(), showRec2020.get())

  let prevSpace = getSpace(getColor(0))
  for (let x = 0; x <= width; x++) {
    let color = getColor(x)
    let space = getSpace(color)
    if (space !== Space.Out) {
      ctx.fillStyle = canvasFormat(color)
      ctx.fillRect(x, 0, 1, height)
      if (space !== Space.sRGB) {
        ctx.fillStyle = space === Space.P3 ? borderP3 : borderRec2020
        ctx.fillRect(x, halfHeight, 1, 1)
      }
      if (prevSpace !== space) {
        if (space === Space.P3 && prevSpace !== Space.Rec2020) {
          ctx.fillStyle = borderP3
          ctx.fillRect(x, 0, 1, halfHeight)
        } else if (space === Space.sRGB && prevSpace === Space.P3) {
          ctx.fillStyle = borderP3
          ctx.fillRect(x - 1, 0, 1, halfHeight)
        } else if (space === Space.Rec2020) {
          ctx.fillStyle = borderRec2020
          ctx.fillRect(x, 0, 1, halfHeight)
        } else if (prevSpace === Space.Rec2020) {
          ctx.fillStyle = borderRec2020
          ctx.fillRect(x - 1, 0, 1, halfHeight)
        }
      }
    } else if (hasGaps) {
      continue
    } else {
      return
    }
    prevSpace = space
  }
}

onCurrentChange({
  alpha(value) {
    inputA.value = String(value)
  },
  c(value) {
    inputC.value = String(value)
  },
  h(value) {
    inputH.value = String(value)
  },
  l(value) {
    inputL.value = String(value)
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
  lc(value) {
    let { c, l } = valueToColor(value)
    let [width, height] = initCanvasSize(canvasH)
    let factor = H_MAX / width
    paint(canvasH, width, height, true, x => build(l, c, x * factor))
  },
  lh(value) {
    let color = valueToColor(value)
    let l = color.l
    let h = color.h ?? 0
    let [width, height] = initCanvasSize(canvasC)
    let factor = (showRec2020.get() ? C_MAX_REC2020 : C_MAX) / width
    paint(canvasC, width, height, false, x => build(l, x * factor, h))
  }
})

function setRangeColor(): void {
  let { fallback, real, space } = visible.get()
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
