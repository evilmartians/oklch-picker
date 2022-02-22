import { writeFile } from 'fs/promises'
import { join } from 'path'
import canvas from 'canvas'
import Color from 'colorjs.io'
import 'canvas-webp'

import { L_MAX, C_MAX, H_MAX, IMAGE_WIDTH, IMAGE_HEIGHT } from '../config.js'

const BUILD = process.argv[5]

async function every(from, to, cb) {
  for (let i = from; i <= to; i++) {
    await cb(i)
    process.stdout.write(`${i}`)
  }
}

async function writeImage(name, cb) {
  let img = canvas.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT)
  let ctx = img.getContext('2d')
  cb(ctx)
  await writeFile(join(BUILD, `${name}.webp`), img.toBuffer('image/webp'))
}

function toOldRgb(coords) {
  return 'rgb(' + coords.map(i => Math.floor(255 * i)).join(',') + ')'
}

async function build() {
  let from = parseInt(process.argv[3])
  let to = parseInt(process.argv[4])
  if (process.argv[2] === 'l') {
    await every(from, to, async l => {
      let lMod = l / 100
      let hFactor = H_MAX / IMAGE_WIDTH
      let cFactor = C_MAX / IMAGE_HEIGHT / 100
      await writeImage(`l-${l}`, ctx => {
        for (let x = 0; x <= IMAGE_WIDTH; x++) {
          let h = x * hFactor
          let prevSRGB
          for (let y = 0; y <= IMAGE_HEIGHT; y++) {
            let color = new Color('oklch', [lMod, y * cFactor, h])

            if (color.inGamut('p3')) {
              let inSRGB = color.inGamut('srgb')
              if (prevSRGB === undefined || inSRGB === prevSRGB) {
                ctx.fillStyle = toOldRgb(color.srgb)
                ctx.fillRect(x, IMAGE_HEIGHT - y, 1, 1)
              }
              prevSRGB = inSRGB
            } else {
              break
            }
          }
        }
      })
    })
  } else if (process.argv[2] === 'c') {
    await every(from, to, async c => {
      let cMod = c / 100
      let hFactor = H_MAX / IMAGE_WIDTH
      let lFactor = L_MAX / IMAGE_HEIGHT / 100
      await writeImage(`c-${c}`, ctx => {
        for (let x = 0; x <= IMAGE_WIDTH; x++) {
          let h = x * hFactor
          let prevSRGB
          for (let y = 0; y <= IMAGE_HEIGHT; y++) {
            let color = new Color('oklch', [y * lFactor, cMod, h])

            if (color.inGamut('p3')) {
              let inSRGB = color.inGamut('srgb')
              if (prevSRGB === undefined || inSRGB === prevSRGB) {
                ctx.fillStyle = toOldRgb(color.srgb)
                ctx.fillRect(x, IMAGE_HEIGHT - y, 1, 1)
              }
              prevSRGB = inSRGB
            } else {
              prevSRGB = false
            }
          }
        }
      })
    })
  } else {
    await every(from, to, async h => {
      let cFactor = C_MAX / IMAGE_WIDTH / 100
      let lFactor = L_MAX / IMAGE_HEIGHT / 100
      await writeImage(`h-${h}`, ctx => {
        for (let y = 0; y <= IMAGE_HEIGHT; y++) {
          let l = y * lFactor
          let prevSRGB
          for (let x = 0; x <= IMAGE_WIDTH; x++) {
            let color = new Color('oklch', [l, x * cFactor, h])

            if (color.inGamut('p3')) {
              let inSRGB = color.inGamut('srgb')
              if (prevSRGB === undefined || inSRGB === prevSRGB) {
                ctx.fillStyle = toOldRgb(color.srgb)
                ctx.fillRect(x, IMAGE_HEIGHT - y, 1, 1)
              }
              prevSRGB = inSRGB
            } else {
              prevSRGB = false
            }
          }
        }
      })
    })
  }
}

build().catch(e => {
  throw e
})
