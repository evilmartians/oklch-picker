import { setCurrentComponents, onPaint } from '../../stores/current.js'
import { showCharts, showRec2020 } from '../../stores/settings.js'
import { paintL, paintC, paintH } from './paint.js'
import { initCanvasSize } from '../../lib/canvas.js'
import { trackPaint } from '../../stores/benchmark.js'

function getBackground(canvas: HTMLCanvasElement): string {
  return window.getComputedStyle(canvas).getPropertyValue('--current-surface')
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

onPaint({
  l(l) {
    document.body.style.setProperty('--chart-l', `${l}%`)
  },
  c(c) {
    document.body.style.setProperty('--chart-c', `${(100 * c) / getMaxC()}%`)
  },
  h(h) {
    document.body.style.setProperty('--chart-h', `${(100 * h) / H_MAX}%`)
  }
})

function onSelect(e: MouseEvent): void {
  let space = e.currentTarget as HTMLDivElement
  let rect = space.getBoundingClientRect()
  let x = e.clientX - rect.left
  let y = rect.height - (e.clientY - rect.top)
  if (space.classList.contains('is-l')) {
    setCurrentComponents({
      h: (H_MAX * x) / rect.width,
      c: (getMaxC() * y) / rect.height
    })
  } else if (space.classList.contains('is-c')) {
    setCurrentComponents({
      l: (100 * y) / rect.height,
      h: (H_MAX * x) / rect.width
    })
  } else if (space.classList.contains('is-h')) {
    setCurrentComponents({
      l: (100 * x) / rect.width,
      c: (getMaxC() * y) / rect.height
    })
  }
}

chartL.addEventListener('click', onSelect)
chartC.addEventListener('click', onSelect)
chartH.addEventListener('click', onSelect)

function initCharts(): void {
  initCanvasSize(canvasL)
  initCanvasSize(canvasC)
  initCanvasSize(canvasH)
  onPaint({
    l(l, isFull) {
      if (!showCharts.get()) return
      trackPaint('l', isFull, () => {
        let bg = getBackground(canvasL)
        paintL(canvasL, bg, (L_MAX * l) / 100, isFull)
      })
    },
    c(c, isFull) {
      if (!showCharts.get()) return
      trackPaint('c', isFull, () => {
        let bg = getBackground(canvasC)
        paintC(canvasC, bg, c, isFull)
      })
    },
    h(h, isFull) {
      if (!showCharts.get()) return
      trackPaint('h', isFull, () => {
        let bg = getBackground(canvasH)
        paintH(canvasH, bg, h, isFull)
      })
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
