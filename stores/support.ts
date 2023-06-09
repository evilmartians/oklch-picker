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
  // FF can’t display P3 yet. Remove when this issue will be resolved.
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1626624
  let isFF = navigator.userAgent.toLowerCase().includes('firefox')
  if (CSS.supports('color', 'color(display-p3 1 1 1)') && !isFF) {
    let media = window.matchMedia('(color-gamut:p3)')
    support.set({ oklch: true, p3: media.matches })
    media.addEventListener('change', () => {
      support.setKey('p3', media.matches)
    })
  }
}
