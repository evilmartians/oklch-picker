import { map } from 'nanostores'

export let mode = map({
  benchmark: false,
  model: false
})

function parseUrl(): void {
  mode.set({
    benchmark: /[?&]bench(=|&|$|&)/.test(location.search),
    model: /[?&]3d(=|&|$|&)/.test(location.search)
  })
}

window.addEventListener('popstate', parseUrl)
parseUrl()

mode.listen(value => {
  let array = []
  if (value.benchmark) array.push('bench')
  if (value.model) array.push('3d')
  let string = ''
  if (array.length > 0) string = '?' + array.join('&')
  if (location.search !== string) {
    history.pushState(null, '', location.pathname + string + location.hash)
  }
})
