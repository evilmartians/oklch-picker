import './index.css'
import { settings } from '../stores/settings.js'

let p3 = document.querySelector<HTMLInputElement>('#settings-p3')!
let rec2020 = document.querySelector<HTMLInputElement>('#settings-rec2020')!

settings.subscribe(value => {
  p3.checked = value.p3 === 'show'
  rec2020.checked = value.rec2020 === 'show'
})

p3.addEventListener('change', () => {
  setTimeout(() => {
    settings.setKey('p3', p3.checked ? 'show' : 'hide')
  }, 0)
})

rec2020.addEventListener('change', () => {
  setTimeout(() => {
    settings.setKey('rec2020', rec2020.checked ? 'show' : 'hide')
  }, 0)
})
