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
  // FF can’t display P3 yet. Remove when this issue will be resolved.
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1626624
  let isFF = navigator.userAgent.toLowerCase().includes('firefox')
  if (CSS.supports('color', 'color(display-p3 1 1 1)') && !isFF) {
    let media = window.matchMedia('(color-gamut:p3)')
    support.set({ p3: media.matches, oklch: true })
    media.addEventListener('change', () => {
      support.setKey('p3', media.matches)
    })
  }
}
