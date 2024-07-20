import { isHotkey } from '../../lib/hotkeys.js'
import { accent } from '../../stores/accent.js'
import { redo, undo } from '../../stores/history.js'
import { loading } from '../../stores/loading.js'

const IS_MAC = /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)
const REDO_HOTKEYS = IS_MAC ? ['meta+shift+z'] : ['ctrl+shift+z', 'ctrl+y']
const UNDO_HOTKEYS = IS_MAC ? ['meta+z'] : ['ctrl+z']

accent.subscribe(({ main, surface }) => {
  document.body.style.setProperty('--accent', main)
  document.body.style.setProperty('--surface-ui-accent', surface)
})

loading.subscribe(value => {
  document.body.classList.toggle('is-loading', value)
})

document.body.addEventListener('mousedown', () => {
  document.body.classList.add('is-grabbing')
})

document.body.addEventListener('mouseup', () => {
  document.body.classList.remove('is-grabbing')
})

document.body.addEventListener('keydown', e => {
  if (isHotkey(REDO_HOTKEYS, e)) {
    e.preventDefault()
    redo()
  } else if (isHotkey(UNDO_HOTKEYS, e)) {
    e.preventDefault()
    undo()
  }
})
