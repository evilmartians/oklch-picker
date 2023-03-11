export function getButton(id: string): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(`.button.is-${id}`)
}
