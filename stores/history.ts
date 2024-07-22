import { atom } from 'nanostores'

import { debounce } from '../lib/time.js'
import { current, type LchValue } from './current.js'

let undos = atom<LchValue[]>([])
let redos = atom<LchValue[]>([])
let fromUndoRedo = false

current.subscribe(
  debounce(100, curr => {
    if (fromUndoRedo) {
      fromUndoRedo = false
      return
    }

    undos.set([...undos.get(), curr])
    redos.set([])
  })
)

export function undo(): void {
  let stack = undos.get()
  if (stack.length < 2) {
    return
  }

  let prev = stack[stack.length - 2]
  let curr = stack[stack.length - 1]
  redos.set([...redos.get(), curr])
  undos.set(stack.slice(0, -1))

  fromUndoRedo = true
  current.set(prev)
}

export function redo(): void {
  let stack = redos.get()
  if (stack.length < 1) {
    return
  }

  let next = stack[stack.length - 1]
  undos.set([...undos.get(), next])
  redos.set(stack.slice(0, -1))

  fromUndoRedo = true
  current.set(next)
}
