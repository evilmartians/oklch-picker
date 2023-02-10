import { WritableAtom } from 'nanostores'

import { showCharts, showP3, showPlot3d, showRec2020 } from '../../stores/settings.js'
import { getCheckbox, onChange } from '../checkbox/index.js'

function init(store: WritableAtom<boolean>, checkbox: HTMLInputElement): void {
  store.subscribe(show => {
    checkbox.checked = show
  })
  onChange(checkbox, checked => {
    store.set(checked)
  })
}

init(showCharts, getCheckbox('charts')!)
init(showPlot3d, getCheckbox('plot3d')!)
init(showP3, getCheckbox('p3')!)
init(showRec2020, getCheckbox('rec2020')!)
