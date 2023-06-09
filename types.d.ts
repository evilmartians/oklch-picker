declare function postMessage(message: object, transfer?: Transferable[]): void

interface ViteWorker extends Worker {
  new (): ViteWorker
}

declare module '*?worker' {
  let worker: ViteWorker
  export default worker
}

declare const COLOR_FN: 'lch' | 'oklch'
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
