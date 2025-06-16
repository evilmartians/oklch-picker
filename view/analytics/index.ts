import { Plausible } from 'plausible-client'

let trackEvent: (...args: Parameters<Plausible['trackEvent']>) => void

if (process.env.NODE_ENV === 'production') {
  let tracker = new Plausible({
    apiHost: 'https://plausible.io',
    domain: COLOR_FN === 'oklch' ? 'oklch.com' : 'lch.oklch.com'
  })

  trackEvent = (...args) => {
    tracker.trackEvent(...args).catch((e: unknown) => {
      throw e
    })
  }
  trackEvent('pageview')
} else {
  trackEvent = () => {}
}

export { trackEvent }
