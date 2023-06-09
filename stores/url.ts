import { atom, computed } from 'nanostores'

export type Urls = '3d' | 'bench' | 'main'

export let url = atom<Urls>('main')
export let benchmarking = computed(url, value => value === 'bench')

function parseUrl(): void {
  if (/[?&]bench(=|&|$|&)/.test(location.search)) {
    url.set('bench')
  } else if (/[?&]3d(=|&|$|&)/.test(location.search)) {
    url.set('3d')
  } else {
    url.set('main')
  }
}

window.addEventListener('popstate', parseUrl)
parseUrl()

document.body.addEventListener('keyup', e => {
  if (e.target === document.body) {
    let current = url.get()
    if (e.key === 'b') {
      if (current !== '3d') url.set(current === 'bench' ? 'main' : 'bench')
    } else if (e.key === 'Escape') {
      if (current === '3d') url.set('main')
    }
  }
})

url.listen(value => {
  history.pushState(
    null,
    '',
    location.pathname + (value === 'main' ? '' : `?${value}`) + location.hash
  )
})
