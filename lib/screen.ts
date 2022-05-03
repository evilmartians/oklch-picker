export const pixelRation =
  typeof window === 'undefined' ? 2 : Math.ceil(window.devicePixelRatio)
