import { getCleanCtx, initCanvasSize } from '../../lib/canvas.ts'
import { parse, rgb } from '../../lib/colors.ts'
import { getBorders } from '../../lib/dom.ts'
import { prepareWorkers } from '../../lib/workers.ts'
import { reportFreeze, reportPaint } from '../../stores/benchmark.ts'
import { onPaint, setCurrentComponents } from '../../stores/current.ts'
import { showCharts, showP3, showRec2020 } from '../../stores/settings.ts'
import type { PaintData, PaintedData } from './worker.ts'
import PaintWorker from './worker.ts?worker'

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

let startWork = prepareWorkers<PaintData, PaintedData>(PaintWorker)

function startWorkForComponent(
  canvas: HTMLCanvasElement,
  type: 'c' | 'h' | 'l',
  value: number,
  chartsToChange: number
): void {
  let [cssP3, cssRec2020] = getBorders()
  let borderP3 = rgb(parse(cssP3)!)
  let borderRec2020 = rgb(parse(cssRec2020)!)

  let parts: [ImageData, number][] = []
  startWork(
    type,
    chartsToChange,
    messages =>
      messages.map((_, i) => {
        let step = Math.floor(canvas.width / messages.length)
        let from = step * i + (i === 0 ? 0 : 1)
        let to = Math.min(step * (i + 1), canvas.width)
        if (i === messages.length - 1) to = canvas.width
        return {
          borderP3,
          borderRec2020,
          from,
          height: canvas.height,
          showP3: showP3.get(),
          showRec2020: showRec2020.get(),
          to,
          type,
          value,
          width: canvas.width
        }
      }),
    result => {
      reportFreeze(() => {
        parts.push([
          new ImageData(
            new Uint8ClampedArray(result.pixels),
            result.width,
            canvas.height
          ),
          result.from
        ])
      })
      reportPaint(result.time)
    },
    () => {
      reportFreeze(() => {
        let ctx = getCleanCtx(canvas)
        for (let [image, from] of parts) {
          ctx.putImageData(image, from, 0)
        }
      })
    }
  )
}

function initCharts(): void {
  initCanvasSize(canvasL)
  initCanvasSize(canvasC)
  initCanvasSize(canvasH)

  onPaint({
    c(c, chartsToChange) {
      if (!showCharts.get()) return
      startWorkForComponent(canvasC, 'c', c, chartsToChange)
    },
    h(h, chartsToChange) {
      if (!showCharts.get()) return
      startWorkForComponent(canvasH, 'h', h, chartsToChange)
    },
    l(l, chartsToChange) {
      if (!showCharts.get()) return
      startWorkForComponent(canvasL, 'l', l, chartsToChange)
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
