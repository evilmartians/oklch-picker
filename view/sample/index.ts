import { lch, oklch } from '../../lib/colors.js'
import { colorToValue, current } from '../../stores/current.js'
import { support } from '../../stores/support.js'
import { visible } from '../../stores/visible.js'

let sample = document.querySelector<HTMLDivElement>('.sample')!
let type = document.querySelector<HTMLDivElement>('.sample_reader')!
let unavailable = document.querySelector<HTMLDivElement>('.sample_unavailable')!
let fallbackNote = document.querySelector<HTMLButtonElement>(
  '.sample_fallback .sample_note'
)!

let postfix = support.get().oklch ? ' on this monitor' : ' in this browser'

visible.subscribe(({ fallback, real, space }) => {
  sample.classList.toggle('is-srgb', space === 'srgb')
  sample.classList.toggle('is-supported', !!real)

  if (real) {
    unavailable.innerText = ''
  } else if (space === 'p3') {
    unavailable.innerText = 'P3 is unavailable' + postfix
  } else if (space === 'rec2020') {
    unavailable.innerText = 'Rec2020 is unavailable' + postfix
  } else if (space === 'out') {
    unavailable.innerText = 'Unavailable on any device'
  }

  type.innerText = `${space} space`

  sample.style.setProperty('--sample-real', real || 'transparent')
  sample.style.setProperty('--sample-fallback', fallback)
})

fallbackNote.addEventListener('click', () => {
  let fallback = visible.get().fallback
  let color = COLOR_FN === 'lch' ? lch(fallback) : oklch(fallback)
  current.set(colorToValue(color!))
})
