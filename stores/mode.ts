import { atom } from 'nanostores'

import { showP3, showRec2020 } from './settings.js'

export let isBenchmark = atom(false)
export let is3d = atom(false)
export let loading3D = atom(false)

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

async function init(): Promise<void> {
  loading3D.set(true)
  let { generate3d } = await import('../view/model/index.js')
  loading3D.set(false)

  generate3d(showP3.get(), showRec2020.get())
  showP3.listen(() => {
    generate3d(showP3.get(), showRec2020.get())
  })
  showRec2020.listen(() => {
    generate3d(showP3.get(), showRec2020.get())
  })
}

if (is3d.get()) {
  init()
} else {
  let unbindLoad = is3d.listen(async value => {
    if (value) {
      unbindLoad()
      init()
    }
  })
}
