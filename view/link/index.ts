import { trackEvent } from '../analytics/index.js'

let links = document.querySelectorAll<HTMLAnchorElement>('.link')

for (let link of links) {
  if (link.classList.contains('is-help')) {
    link.addEventListener('click', () => {
      trackEvent('Open guide')
    })
  } else if (link.classList.contains('is-github')) {
    trackEvent('Open sources')
  }
}
