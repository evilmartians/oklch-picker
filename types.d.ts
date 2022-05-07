interface HTMLCanvasElement {
  transferControlToOffscreen?: () => HTMLCanvasElement
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

declare const COLOR_FN: string
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
