import { atom } from 'nanostores'

export let loading = atom(true)

setTimeout(() => {
  loading.set(false)
}, 10)
