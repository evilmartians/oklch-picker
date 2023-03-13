// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<Args extends any[]>(
  wait: number,
  callback: (...args: Args) => void
): (...args: Args) => void {
  let timeoutId: number
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      callback(...args)
    }, wait)
  }
}

export function trackTime(cb: () => void): number {
  let start = Date.now()
  cb()
  return Date.now() - start
}
