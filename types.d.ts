interface HTMLCanvasElement {
  // @ts-expect-error Some browsers doesn’t have OffscreenCanvas support
  transferControlToOffscreen?: () => OffscreenCanvas
}

interface OffscreenCanvas extends EventTarget {
  width: number
  height: number

  getContext(
    contextId: '2d',
    contextAttributes?: CanvasRenderingContext2DSettings
  ): OffscreenCanvasRenderingContext2D | null
}

interface OffscreenCanvasRenderingContext2D
  extends CanvasState,
    CanvasTransform,
    CanvasCompositing,
    CanvasImageSmoothing,
    CanvasFillStrokeStyles,
    CanvasShadowStyles,
    CanvasFilters,
    CanvasRect,
    CanvasDrawPath,
    CanvasText,
    CanvasDrawImage,
    CanvasImageData,
    CanvasPathDrawingStyles,
    CanvasTextDrawingStyles,
    CanvasPath {
  readonly canvas: OffscreenCanvas
}

interface Worker extends EventTarget, AbstractWorker {
  postMessage(
    message: object,
    transfer: (Transferable | HTMLCanvasElement)[]
  ): void
}

declare class ViteWorker extends Worker {
  constructor()
}

declare module '*?worker' {
  export default ViteWorker
}

interface RefCounted {
  ref(): this;
  unref(): this;
}

interface Timer extends RefCounted {
  hasRef(): boolean;
  refresh(): this;
  [Symbol.toPrimitive](): number;
}

interface Timeout extends Timer {
  /**
   * If true, the `Timeout` object will keep the Node.js event loop active.
   * @since v11.0.0
   */
  hasRef(): boolean;
  /**
   * Sets the timer's start time to the current time, and reschedules the timer to
   * call its callback at the previously specified duration adjusted to the current
   * time. This is useful for refreshing a timer without allocating a new
   * JavaScript object.
   *
   * Using this on a timer that has already called its callback will reactivate the
   * timer.
   * @since v10.2.0
   * @return a reference to `timeout`
   */
  refresh(): this;
  [Symbol.toPrimitive](): number;
}

declare const COLOR_FN: 'oklch' | 'lch'
declare const LCH: boolean
declare const L_MAX: number
declare const L_STEP: number
declare const C_MAX: number
declare const C_MAX_REC2020: number
declare const C_STEP: number
declare const C_RANDOM: number
declare const H_MAX: number
declare const H_STEP: number
declare const ALPHA_MAX: number
declare const ALPHA_STEP: number
declare const GAMUT_EPSILON: number

declare module 'culori/fn' {
  export interface Hsl {
    mode: 'hsl'
    h?: number
    s: number
    l: number
    alpha?: number
  }

  export interface Lab {
    mode: 'lab'
    l: number
    a: number
    b: number
    alpha?: number
  }

  export interface Lch {
    mode: 'lch'
    l: number
    c: number
    h?: number
    alpha?: number
  }

  export interface Oklab {
    mode: 'oklab'
    l: number
    a: number
    b: number
    alpha?: number
  }

  export interface Oklch {
    mode: 'oklch'
    l: number
    c: number
    h?: number
    alpha?: number
  }

  export interface Xyz65 {
    mode: 'xyz65'
    x: number
    y: number
    z: number
    alpha?: number
  }

  export interface P3 {
    mode: 'p3'
    r: number
    g: number
    b: number
    alpha?: number
  }

  export interface Rec2020 {
    mode: 'rec2020'
    r: number
    g: number
    b: number
    alpha?: number
  }

  export interface Rgb {
    mode: 'rgb'
    r: number
    g: number
    b: number
    alpha?: number
  }

  export function formatCss(c: undefined): undefined
  export function formatCss(c: Color): string
  export function formatCss(c: string): string | undefined

  export function formatHex(c: undefined): undefined
  export function formatHex(c: Color): string
  export function formatHex(c: string): string | undefined

  export function formatHex8(c: undefined): undefined
  export function formatHex8(c: Color): string
  export function formatHex8(c: string): string | undefined

  export function formatRgb(c: undefined): undefined
  export function formatRgb(c: Color): string
  export function formatRgb(c: string): string | undefined

  export type Color =
    | Hsl
    | Lab
    | Lch
    | Oklab
    | Oklch
    | Xyz65
    | P3
    | Rec2020
    | Rgb
  type Mode = Color['mode']

  export function clampChroma<C extends Color>(
    color: C,
    mode?: Lch['mode'] | Oklch['mode']
  ): C
  export function clampChroma(
    color: string,
    mode?: Lch['mode'] | Oklch['mode']
  ): Color | undefined

  export function parse(color: string): Color | undefined

  export type FindColorByMode<
    M extends Mode,
    C extends Color = Color
  > = C extends { mode: M } ? C : never

  interface ConvertFn<M extends Mode = 'rgb'> {
    (color: undefined): undefined
    (color: Color): FindColorByMode<M>
    (color: string): FindColorByMode<M> | undefined
  }

  export let modeHsl: { mode: Hsl['mode'] }
  export let modeLab: { mode: Lab['mode'] }
  export let modeLch: { mode: Lch['mode'] }
  export let modeOklab: { mode: Oklab['mode'] }
  export let modeOklch: { mode: Oklch['mode'] }
  export let modeXyz65: { mode: Xyz65['mode'] }
  export let modeP3: { mode: P3['mode'] }
  export let modeRec2020: { mode: Rec2020['mode'] }
  export let modeRgb: { mode: Rgb['mode'] }

  type Definition =
    | typeof modeHsl
    | typeof modeLab
    | typeof modeLch
    | typeof modeOklab
    | typeof modeOklch
    | typeof modeXyz65
    | typeof modeP3
    | typeof modeRec2020
    | typeof modeRgb

  export function useMode<D extends Definition>(def: D): ConvertFn<D['mode']>
}
