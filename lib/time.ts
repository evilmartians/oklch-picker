// oxlint-disable-next-line typescript/no-explicit-any
export function debounce<Args extends any[]>(
  wait: number,
  callback: (...args: Args) => void
): (...args: Args) => void {
  let timeoutId: NodeJS.Timeout
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      callback(...args)
    }, wait)
  }
}
