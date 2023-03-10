import { atom } from 'nanostores'

export let isBenchmark = atom(false)
export let is3d = atom(false)

if (/[?&]bench(=|&|$|&)/.test(location.search)) {
  isBenchmark.set(true)
}
if (/[?&]3d(=|&|$|&)/.test(location.search)) {
  is3d.set(true)
}

function update(): void {
  let array = []
  if (isBenchmark.get()) array.push('bench')
  if (is3d.get()) array.push('3d')
  let string = ''
  if (array.length > 0) string = '?' + array.join('&')
  history.pushState(null, '', location.pathname + string + location.hash)
}

isBenchmark.listen(update)
is3d.listen(update)
