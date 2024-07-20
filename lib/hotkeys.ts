const NON_ENGLISH_LAYOUT = /^[^\x00-\x7F]$/

function compareHotkey(hotkey: string, e: KeyboardEvent): boolean {
  let prefix = ''
  if (e.metaKey) prefix += 'meta+'
  if (e.ctrlKey) prefix += 'ctrl+'
  if (e.altKey) prefix += 'alt+'
  if (e.shiftKey) prefix += 'shift+'

  let code = prefix
  if (e.key === '+') {
    code += 'plus'
  } else {
    code += e.key.toLowerCase()
  }

  let isMatch = code === hotkey

  if (!isMatch && NON_ENGLISH_LAYOUT.test(e.key) && /^Key.$/.test(e.code)) {
    let enKey = e.code.replace(/^Key/, '').toLowerCase()
    isMatch = prefix + enKey === hotkey
  }

  return isMatch
}

export function isHotkey(hotkeys: string[], e: KeyboardEvent): boolean {
  return hotkeys.some(k => compareHotkey(k, e))
}
