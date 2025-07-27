import { formatLch } from '../../lib/colors.ts'
import { isHotkey } from '../../lib/hotkeys.ts'
import { accent } from '../../stores/accent.ts'
import { current, valueToColor } from '../../stores/current.ts'
import { redo, undo } from '../../stores/history.ts'
import { loading } from '../../stores/loading.ts'
import simpleLogo from './simple.svg?url'

// The only way to detect Mac is using old API
// eslint-disable-next-line @typescript-eslint/no-deprecated
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

if (COLOR_FN === 'oklch') {
  let iconLink = document.querySelector<HTMLLinkElement>(
    'link[rel="icon"][type="image/svg+xml"]'
  )
  current.subscribe(value => {
    let colorLogo = simpleLogo.replace('%23000', formatLch(valueToColor(value)))
    if (value.l > 0.9) {
      colorLogo = colorLogo.replace('%23fff', '%23000')
    }
    iconLink?.setAttribute('href', colorLogo)
  })
}
