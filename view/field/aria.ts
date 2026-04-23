export function syncSpinbuttonAria(input: HTMLInputElement): void {
  let rawValue = input.value.trim()

  if (rawValue === '') {
    input.removeAttribute('aria-valuenow')
    input.removeAttribute('aria-valuetext')
    return
  }

  let numericValue = Number(rawValue)

  if (Number.isFinite(numericValue)) {
    input.setAttribute('aria-valuenow', rawValue)
    input.removeAttribute('aria-valuetext')
  } else {
    input.removeAttribute('aria-valuenow')
    input.setAttribute('aria-valuetext', rawValue)
  }
}

export function setSpinbuttonValue(
  input: HTMLInputElement,
  value: number | string
): void {
  input.value = String(value)
  syncSpinbuttonAria(input)
}
