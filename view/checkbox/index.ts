import './index.css'

export function getCheckbox(name: string): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>(
    `[type=checkbox][name=${name}]`
  )
}
