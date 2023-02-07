/* eslint-disable @typescript-eslint/explicit-function-return-type */
// import { detectColorSpace } from "./detectColorSpace.js"
import config from '../config.js'

declare global {
  export let COLOR_FN: 'oklch' | 'lch'
  export let LCH: boolean
  export let L_MAX: number
  export let L_STEP: number
  export let C_MAX: number
  export let C_MAX_REC2020: number
  export let C_STEP: number
  export let C_RANDOM: number
  export let H_MAX: number
  export let H_STEP: number
  export let ALPHA_MAX: number
  export let ALPHA_STEP: number

  // @ts-ignore
  export let setTimeout: typeof global.setTimeout
}
// @ts-ignore
globalThis.COLOR_FN = 'rgb'

// L 0-100
// C 0-0.4
// H 0-360
// A 0-1

const PRECISION = 100
const STEP = 1 / PRECISION

async function main() {
  let {detectColorSpace} = await import('./detectColorSpace.js')

  for (let l = 0; l < config.L_MAX; l += STEP) {
    for (let c = 0; c < config.C_MAX; c += STEP) {
      for (let h = 0; h < config.H_MAX; h += STEP) {
        let result = detectColorSpace({l,c,h, a: 1})
        console.log(result);

      }
    }
  }

  console.log('OK');

}

main()
