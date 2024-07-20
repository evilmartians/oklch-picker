import { atom } from 'nanostores'

import { debounce } from '../lib/time.js'
import { current, type LchValue } from './current.js'

let $undos = atom<LchValue[]>([])
let $redos = atom<LchValue[]>([])
let $prev = atom<LchValue>({ a: 100, c: 0, h: 0, l: 0 })
let fromUndoRedo = false

current.subscribe(
  debounce(100, (curr, oldValue) => {
    if (!oldValue) {
      $prev.set(curr)
      return
    }
    if (fromUndoRedo) {
      fromUndoRedo = false
      return
    }

    $undos.set([...$undos.get(), $prev.get()])
    $redos.set([])
    $prev.set(curr)
  })
)

export function undo(): void {
  let stack = $undos.get()
  if (stack.length === 0) {
    return
  }

  let last = stack[stack.length - 1]
  $redos.set([...$redos.get(), $prev.get()])
  $undos.set(stack.slice(0, -1))

  fromUndoRedo = true
  $prev.set(last)
  current.set(last)
}

export function redo(): void {
  let stack = $redos.get()
  if (stack.length === 0) {
    return
  }

  let last = stack[stack.length - 1]
  $undos.set([...$undos.get(), $prev.get()])
  $redos.set(stack.slice(0, -1))

  fromUndoRedo = true
  $prev.set(last)
  current.set(last)
}
