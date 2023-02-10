import { WritableAtom } from 'nanostores'

import {
  showCharts,
  showP3,
  showRec2020,
  showModel
} from '../../stores/settings.js'
import { getCheckbox, onChange } from '../checkbox/index.js'
import { current, loadModel } from '../../stores/current.js'

function init(store: WritableAtom<boolean>, checkbox: HTMLInputElement): void {
  store.subscribe(show => {
    checkbox.checked = show
  })
  onChange(checkbox, async checked => {
    store.set(checked)
    // save openend 3d model to url
    if (checkbox.name === 'model' && checked) {
      loadModel()
      history.pushState(null, '', `${location.hash}?3d`)
    } else if (checkbox.name === 'model') {
      let { l, c, h, a } = current.get()
      history.pushState(null, '', `#${l},${c},${h},${a}`)
    }
  })
}

init(showCharts, getCheckbox('charts')!)
init(showP3, getCheckbox('p3')!)
init(showRec2020, getCheckbox('rec2020')!)
init(showModel, getCheckbox('model')!)
