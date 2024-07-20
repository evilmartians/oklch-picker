const MODIFIERS = {
  alt: 'altKey',
  control: 'ctrlKey',
  meta: 'metaKey',
  shift: 'shiftKey'
} as const

type Modifier = keyof typeof MODIFIERS

function compareHotkey(hotkey: string, e: KeyboardEvent): boolean {
  let keys = hotkey.split('+')

  for (let key of keys) {
    if (key in MODIFIERS) {
      let modifier = MODIFIERS[key as Modifier]
      if (!e[modifier]) {
        return false
      }
    } else if (e.key.toLowerCase() !== key.toLowerCase()) {
      return false
    }
  }

  return true
}

export function isHotkey(hotkeys: string[], e: KeyboardEvent): boolean {
  return hotkeys.some(k => compareHotkey(k, e))
}
