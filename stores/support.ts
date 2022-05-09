import { atom } from 'nanostores'

export let support = atom(false)

if (typeof window !== 'undefined') {
  if (CSS.supports('color', 'color(display-p3 0 0 0)')) {
    let media = window.matchMedia('(color-gamut:p3)')
    support.set(media.matches)
    media.addEventListener('change', () => {
      support.set(media.matches)
    })
  }
}
