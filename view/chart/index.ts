import { colordx } from '@colordx/core'
import { type ChartRenderer, createChartRenderer } from '@colordx/gpu'

import { initCanvasSize } from '../../lib/canvas.ts'
import { getBorders } from '../../lib/dom.ts'
import { reportPaint } from '../../stores/benchmark.ts'
import { onPaint, setCurrentComponents } from '../../stores/current.ts'
import { showCharts, showP3, showRec2020 } from '../../stores/settings.ts'
import { support } from '../../stores/support.ts'

interface BorderColor {
  alpha: number
  b: number
  g: number
  r: number
}

let chartL = document.querySelector<HTMLDivElement>('.chart.is-l')!
let chartC = document.querySelector<HTMLDivElement>('.chart.is-c')!
let chartH = document.querySelector<HTMLDivElement>('.chart.is-h')!
let canvasL = chartL.querySelector<HTMLCanvasElement>('.chart_canvas')!
let canvasC = chartC.querySelector<HTMLCanvasElement>('.chart_canvas')!
let canvasH = chartH.querySelector<HTMLCanvasElement>('.chart_canvas')!

function getMaxC(): number {
  return showRec2020.get() ? C_MAX_REC2020 : C_MAX
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(min, val), max)
}

onPaint({
  c(c) {
    document.body.style.setProperty('--chart-c', `${(100 * c) / getMaxC()}%`)
  },
  h(h) {
    document.body.style.setProperty('--chart-h', `${(100 * h) / H_MAX}%`)
  },
  l(l) {
    document.body.style.setProperty('--chart-l', `${(100 * l) / L_MAX}%`)
  }
})

function setComponentsFromSpace(
  space: HTMLCanvasElement,
  mouseX: number,
  mouseY: number
): void {
  let rect = space.getBoundingClientRect()
  let x = clamp(mouseX - rect.left, 0, rect.width)
  let y = clamp(rect.height - (mouseY - rect.top), 0, rect.height)
  if (space.parentElement!.classList.contains('is-l')) {
    setCurrentComponents({
      c: (getMaxC() * y) / rect.height,
      h: (H_MAX * x) / rect.width
    })
  } else if (space.parentElement!.classList.contains('is-c')) {
    setCurrentComponents({
      h: (H_MAX * x) / rect.width,
      l: (L_MAX * y) / rect.height
    })
  } else if (space.parentElement!.classList.contains('is-h')) {
    setCurrentComponents({
      c: (getMaxC() * y) / rect.height,
      l: (L_MAX * x) / rect.width
    })
  }
}

function initEvents(chart: HTMLCanvasElement): void {
  function onSelect(e: MouseEvent): void {
    e.preventDefault()
    setComponentsFromSpace(chart, e.clientX, e.clientY)
  }

  function onMouseUp(e: MouseEvent): void {
    document.removeEventListener('mousemove', onSelect)
    document.removeEventListener('mouseup', onMouseUp)
    setComponentsFromSpace(chart, e.clientX, e.clientY)
  }

  chart.addEventListener('mousedown', () => {
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mousemove', onSelect)
  })
}

initEvents(canvasL)
initEvents(canvasC)
initEvents(canvasH)

function parseBorderColor(css: string): BorderColor {
  let c = colordx(css).toRgb()
  return {
    alpha: c.alpha,
    b: c.b / 255,
    g: c.g / 255,
    r: c.r / 255
  }
}

// Charts are painted on the GPU (@colordx/gpu): one WebGL2 draw per chart,
// shader math generated from colordx's constants and parity-tested against
// @colordx/core.
let renderers: Partial<Record<'c' | 'h' | 'l', ChartRenderer>> = {}

// Which slice plane each chart shows: the L chart varies H×C, the C chart
// varies H×L, the H chart varies L×C.
const CHART_PLANES = { c: 'lh', h: 'cl', l: 'ch' } as const

function paintChart(type: 'c' | 'h' | 'l', value: number): void {
  let renderer = renderers[type]
  if (!renderer) return

  let [cssP3, cssRec2020] = getBorders()
  let p3 = parseBorderColor(cssP3)
  let rec2020 = parseBorderColor(cssRec2020)

  let start = performance.now()
  let painted = renderer.paint({
    borderP3: [p3.r, p3.g, p3.b, p3.alpha],
    borderRec2020: [rec2020.r, rec2020.g, rec2020.b, rec2020.alpha],
    borderWidth: 1 * Math.ceil(window.devicePixelRatio),
    p3Output: support.get().p3,
    plane: CHART_PLANES[type],
    showP3: showP3.get(),
    showRec2020: showRec2020.get(),
    value: type === 'l' ? L_MAX_COLOR * value : value,
    xMax: type === 'h' ? L_MAX_COLOR : H_MAX,
    yMax: type === 'c' ? L_MAX_COLOR : getMaxC()
  })
  if (painted) reportPaint(performance.now() - start)
}

function initCharts(): void {
  initCanvasSize(canvasL)
  initCanvasSize(canvasC)
  initCanvasSize(canvasH)

  let model = LCH ? ('lch' as const) : ('oklch' as const)
  renderers = {
    c: createChartRenderer(canvasC, { model }) ?? undefined,
    h: createChartRenderer(canvasH, { model }) ?? undefined,
    l: createChartRenderer(canvasL, { model }) ?? undefined
  }

  onPaint({
    c(c) {
      if (!showCharts.get()) return
      paintChart('c', c)
    },
    h(h) {
      if (!showCharts.get()) return
      paintChart('h', h)
    },
    l(l) {
      if (!showCharts.get()) return
      paintChart('l', l)
    }
  })
}

if (showCharts.get()) {
  initCharts()
} else {
  let unbindCharts = showCharts.listen(show => {
    if (show) {
      unbindCharts()
      initCharts()
    }
  })
}
