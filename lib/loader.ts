import { delay } from 'nanodelay'

import { loading } from '../stores/loading.js'

export function generateLoader<Result>(
  status: HTMLDivElement,
  cb: () => Promise<Result>,
  animationDelay: number = 0
): (done: (result: Result) => void) => void {
  let started = false
  let loaded = false

  return async done => {
    if (started || loaded) return
    started = true
    status.innerText = 'Loading…'
    try {
      let result = await cb()
      loaded = true

      if (animationDelay > 0 && !loading.get()) {
        await delay(animationDelay)
      }

      status.innerText = 'Loading'
      status.style.display = 'none'
      done(result)
    } catch {
      started = false
      status.innerText = 'Network error'
    }
  }
}
