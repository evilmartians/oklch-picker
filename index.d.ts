interface HTMLCanvasElement {
  transferControlToOffscreen?: () => HTMLCanvasElement
}

interface Worker extends EventTarget, AbstractWorker {
  postMessage(
    message: object,
    transfer: (Transferable | HTMLCanvasElement)[]
  ): void
}
