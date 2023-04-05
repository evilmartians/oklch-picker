import { atom } from 'nanostores'

export let loading = atom(true)

window.addEventListener('load', () => {
  setTimeout(() => {
    loading.set(false)
  }, 10)
})
