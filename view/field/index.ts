import './index.css'

let fields = document.querySelectorAll<HTMLInputElement>('.field')

function onFocus(e: FocusEvent): void {
  let input = e.target as HTMLInputElement
  input.select()
}

for (let field of fields) {
  field.addEventListener('focus', onFocus)
}
