import './index.css'
import { settings } from '../../stores/settings.js'
import { getCheckbox } from '../checkbox/index.js'

let p3 = getCheckbox('p3')!
let rec2020 = getCheckbox('rec2020')!!

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
