export function getCheckbox(name: string): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>(
    `[type=checkbox][name=${name}]`
  )
}

export function onChange(
  checkbox: HTMLInputElement,
  cb: (value: boolean) => void
): void {
  checkbox.addEventListener('change', () => {
    setTimeout(() => {
      cb(checkbox.checked)
    }, 0)
  })
}
