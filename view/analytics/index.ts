import { Plausible } from 'plausible-client'

let trackEvent: ReturnType<typeof Plausible>['trackEvent']

if (process.env.NODE_ENV === 'production') {
  let tracker = Plausible({
    domain: COLOR_FN === 'oklch' ? 'oklch.com' : 'lch.oklch.com'
  })

  tracker.sendEvent('pageview')
  trackEvent = tracker.trackEvent
} else {
  trackEvent = () => {}
}

export { trackEvent }
