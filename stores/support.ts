import { map } from 'nanostores'

export interface SupportValue {
  oklch: boolean
  p3: boolean
  rec2020: boolean
}

export let support = map<SupportValue>({
  oklch: false,
  p3: false,
  rec2020: false
})

if (typeof window !== 'undefined') {
  if (CSS.supports('color', 'color(display-p3 1 1 1)')) {
    let mediaP3 = window.matchMedia('(color-gamut:p3)')
    let media2020 = window.matchMedia('(color-gamut:rec2020)')
    support.set({
      oklch: true,
      p3: mediaP3.matches,
      rec2020: media2020.matches
    })
    mediaP3.addEventListener('change', () => {
      support.setKey('p3', mediaP3.matches)
    })
    media2020.addEventListener('change', () => {
      support.setKey('rec2020', media2020.matches)
    })
  }
}
