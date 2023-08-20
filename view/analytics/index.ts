import Plausible from 'plausible-tracker'

const { trackEvent } = Plausible({
  domain: COLOR_FN === 'oklch' ? 'oklch.com' : 'lch.oklch.com'
})

export { trackEvent }
