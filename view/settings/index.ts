import { getCheckbox, onChange } from '../checkbox/index.js'
import { settings } from '../../stores/settings.js'

let p3 = getCheckbox('p3')!
let rec2020 = getCheckbox('rec2020')!
let charts = getCheckbox('charts')!

settings.subscribe(value => {
  p3.checked = value.p3 === 'show'
  rec2020.checked = value.rec2020 === 'show'
  charts.checked = value.charts === 'show'
})

onChange(charts, checked => {
  settings.setKey('charts', checked ? 'show' : 'hide')
})

onChange(p3, checked => {
  settings.setKey('p3', checked ? 'show' : 'hide')
})

onChange(rec2020, checked => {
  settings.setKey('rec2020', checked ? 'show' : 'hide')
})
