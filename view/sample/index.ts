import { colordx } from '@colordx/core'

import { colorToValue, current } from '../../stores/current.ts'
import { visible } from '../../stores/visible.ts'

let sample = document.querySelector<HTMLDivElement>('.sample')!
let type = document.querySelector<HTMLDivElement>('.sample_reader')!
let unavailable = document.querySelector<HTMLDivElement>('.sample_unavailable')!
let fallbackNote = document.querySelector<HTMLButtonElement>(
  '.sample_fallback .sample_note'
)!

visible.subscribe(({ fallback, fallbackBrowsers, real, space }) => {
  sample.classList.toggle('is-srgb', space === 'srgb')
  sample.classList.toggle('is-supported', !!real)

  if (real) {
    unavailable.innerText = ''
  } else if (space === 'p3') {
    unavailable.innerText = 'P3 is unavailable on this monitor'
  } else if (space === 'rec2020') {
    unavailable.innerText = 'Rec2020 is unavailable on this monitor'
  } else if (space === 'out') {
    unavailable.innerText = 'Unavailable on any device'
  }

  type.innerText = `${space} space`

  sample.style.setProperty('--sample-real', real || 'transparent')
  sample.style.setProperty(
    '--sample-fallback',
    fallback === fallbackBrowsers
      ? fallback
      : `linear-gradient(to right, ${fallbackBrowsers} 50%, ${fallback} 50%)`
  )
})

fallbackNote.addEventListener('click', () => {
  let fallback = visible.get().fallback
  let color =
    COLOR_FN === 'lch' ? colordx(fallback).toLch() : colordx(fallback).toOklch()
  current.set(
    colorToValue({
      alpha: color.alpha,
      c: color.c,
      h: color.h,
      l: color.l,
      mode: COLOR_FN
    })
  )
})
