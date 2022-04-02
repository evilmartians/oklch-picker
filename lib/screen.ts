export const hasP3Support =
  typeof window === 'undefined'
    ? undefined
    : window.matchMedia('(color-gamut: p3)').matches &&
      CSS.supports('color', 'color(display-p3 0 0 0)')

export const pixelRation =
  window.matchMedia('(min-resolution: 2dppx)').matches ||
  window.matchMedia('-webkit-max-device-pixel-ratio: 2').matches
    ? 2
    : 1
