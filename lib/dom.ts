export function toggleVisibility(element: HTMLElement, shown: boolean): void {
  element.classList.toggle('is-hidden', !shown)
  element.setAttribute('aria-hidden', shown ? 'false' : 'true')
  if (shown) {
    element.removeAttribute('inert')
  } else {
    element.setAttribute('inert', '')
  }
}
