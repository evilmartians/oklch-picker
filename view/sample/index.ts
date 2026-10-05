import { parseAnything } from '../../lib/colors.ts'
import { colorToValue, current } from '../../stores/current.ts'
import { visible } from '../../stores/visible.ts'

let sample = document.querySelector<HTMLDivElement>('.sample')!
let type = document.querySelector<HTMLDivElement>('.sample_reader')!
let unavailable = document.querySelector<HTMLDivElement>('.sample_unavailable')!
let specNote = document.querySelector<HTMLButtonElement>(
  '.sample_fallback.is-spec .sample_note'
)!

visible.subscribe(({ fallback, fallbackBrowsers, real, space }) => {
  sample.classList.toggle('is-srgb', space === 'srgb')
  sample.classList.toggle('is-supported', !!real)
  sample.classList.toggle('is-same-fallback', fallback === fallbackBrowsers)
  specNote.innerText =
    fallback === fallbackBrowsers ? 'Fallback' : 'Spec fallback'

  if (real) {
    unavailable.innerText = ''
  } else if (space === 'p3') {
    unavailable.innerText = 'P3 is unavailable on this monitor'
  } else if (space === 'rec2020') {
    unavailable.innerText = 'Rec2020 is unavailable on this monitor'
  } else if (space === 'out') {
    unavailable.innerText = 'Unavailable on any device'
  }

  type.innerText = `${space} space`

  sample.style.setProperty('--sample-real', real || 'transparent')
  sample.style.setProperty('--sample-fallback', fallback)
  sample.style.setProperty('--sample-fallback-browsers', fallbackBrowsers)
})

specNote.addEventListener('click', () => {
  let parsed = parseAnything(visible.get().fallback)
  if (parsed) current.set(colorToValue(parsed))
})
