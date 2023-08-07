export function toggleVisibility(element: HTMLElement, shown: boolean): void {
  element.classList.toggle('is-hidden', !shown)
  element.setAttribute('aria-hidden', shown ? 'false' : 'true')
  if (shown) {
    element.removeAttribute('inert')
  } else {
    element.setAttribute('inert', '')
  }
}

export function toggleInvalid(input: HTMLInputElement, invalid: boolean): void {
  if (invalid) {
    input.setAttribute('aria-invalid', 'true')
  } else {
    input.removeAttribute('aria-invalid')
  }
}

export function getBorders(): [string, string] {
  let styles = window.getComputedStyle(document.body)
  return [
    styles.getPropertyValue('--border-p3') || '#fff',
    styles.getPropertyValue('--border-rec2020') || '#fff'
  ]
}
