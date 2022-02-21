import { map } from 'nanostores'

export interface CurrentValue {
  l: number
  c: number
  h: number
}

export let current = map<CurrentValue>({ l: 0, c: 0, h: 0 })

interface LchCallbacks {
  l?(value: number): void
  c?(value: number): void
  h?(value: number): void
  lc?(color: CurrentValue): void
  ch?(color: CurrentValue): void
  lh?(color: CurrentValue): void
}

export function onCurrentChange(callbacks: LchCallbacks): void {
  let prevL: undefined | number
  let prevC: undefined | number
  let prevH: undefined | number
  current.subscribe(value => {
    if (callbacks.l && prevL !== value.l) {
      callbacks.l(value.l)
    }
    if (callbacks.c && prevC !== value.c) {
      callbacks.c(value.c)
    }
    if (callbacks.h && prevH !== value.h) {
      callbacks.h(value.h)
    }

    if (callbacks.lc && (prevL !== value.l || prevC !== value.c)) {
      callbacks.lc(value)
    }
    if (callbacks.ch && (prevC !== value.c || prevH !== value.h)) {
      callbacks.ch(value)
    }
    if (callbacks.lh && (prevL !== value.l || prevH !== value.h)) {
      callbacks.lh(value)
    }

    prevL = value.l
    prevC = value.c
    prevH = value.h
  })
}
