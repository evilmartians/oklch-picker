export const hasP3Support =
  typeof window === 'undefined'
    ? undefined
    : window.matchMedia('(color-gamut: p3)').matches &&
      CSS.supports('color', 'color(display-p3 0 0 0)')

export const pixelRation =
  typeof window === 'undefined' ? 2 : Math.ceil(window.devicePixelRatio)
