import { map } from 'nanostores'

export interface SupportValue {
  oklch: boolean
  p3: boolean
}

export let support = map<SupportValue>({
  oklch: false,
  p3: false
})

if (typeof window !== 'undefined') {
  if (CSS.supports('color', 'color(display-p3 1 1 1)')) {
    let media = window.matchMedia('(color-gamut:p3)')
    support.set({ oklch: true, p3: media.matches })
    media.addEventListener('change', () => {
      support.setKey('p3', media.matches)
    })
  }
}
