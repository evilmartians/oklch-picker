const NON_ENGLISH_LAYOUT = /^[^\x00-\x7F]$/

export function convertKey(e: KeyboardEvent): string {
  if (NON_ENGLISH_LAYOUT.test(e.key) && /^Key.$/.test(e.code)) {
    return e.code.replace(/^Key/, '').toLowerCase()
  }
  return e.key.toLowerCase()
}

export function isHotkey(hotkeys: string[], e: KeyboardEvent): boolean {
  let prefix = ''
  if (e.metaKey) prefix += 'meta+'
  if (e.ctrlKey) prefix += 'ctrl+'
  if (e.altKey) prefix += 'alt+'
  if (e.shiftKey) prefix += 'shift+'
  let code = prefix + convertKey(e)

  return hotkeys.some(hotkey => code === hotkey)
}
