import { atom } from 'nanostores'

export let benchmarking = atom(false)

function parseUrl(): void {
  benchmarking.set(/[?&]bench(=|&|$|&)/.test(location.search))
}

window.addEventListener('popstate', parseUrl)
parseUrl()

benchmarking.listen(value => {
  history.pushState(
    null,
    '',
    location.pathname + (value ? '?bench' : '') + location.hash
  )
})

function keyUp(e: KeyboardEvent): void {
  if (e.key === 'b' && e.target === document.body) {
    benchmarking.set(!benchmarking.get())
  }
}
document.body.addEventListener('keyup', keyUp)
