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
