import Plausible from 'plausible-tracker'

let { trackEvent, trackPageview } = Plausible({
  domain: COLOR_FN === 'oklch' ? 'oklch.com' : 'lch.oklch.com'
})

trackPageview()

export { trackEvent }
