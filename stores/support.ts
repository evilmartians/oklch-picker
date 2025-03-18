import { map } from 'nanostores'

export interface SupportValue {
  p3: boolean
  rec2020: boolean
}

export let support = map<SupportValue>({
  p3: false,
  rec2020: false
})

if (typeof window !== 'undefined') {
  // The is no types for CSS.supports yet
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  if (CSS.supports('color', 'color(display-p3 1 1 1)')) {
    let mediaP3 = window.matchMedia('(color-gamut:p3)')
    let media2020 = window.matchMedia('(color-gamut:rec2020)')
    support.set({
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
