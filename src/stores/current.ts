import { map } from 'nanostores'

export let current = map({ l: 0, c: 0, h: 0 })

interface LchCallbacks {
  l(value: number): void
  c(value: number): void
  h(value: number): void
}

export function onCurrentChange(callbacks: LchCallbacks): void {
  let prevL: undefined | number
  let prevC: undefined | number
  let prevH: undefined | number
  current.subscribe(value => {
    if (prevL !== value.l) {
      callbacks.l(value.l)
      prevL = value.l
    }
    if (prevC !== value.c) {
      callbacks.c(value.c)
      prevC = value.c
    }
    if (prevH !== value.h) {
      callbacks.h(value.h)
      prevH = value.h
    }
  })
}
