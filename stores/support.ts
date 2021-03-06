import { map } from 'nanostores'

export interface SupportValue {
  p3: boolean
  oklch: boolean
}

export let support = map<SupportValue>({
  p3: false,
  oklch: false
})

if (typeof window !== 'undefined') {
  if (CSS.supports('color', 'oklch(100% 0 0)')) {
    let media = window.matchMedia('(color-gamut:p3)')
    support.set({ p3: media.matches, oklch: true })
    media.addEventListener('change', () => {
      support.setKey('p3', media.matches)
    })
  }
}
