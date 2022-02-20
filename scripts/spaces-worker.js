import { writeFile } from 'fs/promises'
import { join } from 'path'
import canvas from 'canvas'
import Color from 'colorjs.io'
import 'canvas-webp'

import { L_MAX, C_MAX, H_MAX, IMAGE_WIDTH, IMAGE_HEIGHT } from './config.js'

const BUILD = process.argv[5]

async function every(from, to, cb) {
  for (let i = from; i <= to; i++) {
    await cb(i)
    process.stdout.write(`${i}`)
  }
}

async function writeSpace(name, xMax, yMax, getColors) {
  let img = canvas.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT)
  let ctx = img.getContext('2d')

  for (let x = 0; x <= IMAGE_WIDTH; x++) {
    let xValue = (xMax * x) / IMAGE_WIDTH
    let prevSRGB
    for (let y = 0; y <= IMAGE_WIDTH; y++) {
      let yValue = (yMax * y) / IMAGE_HEIGHT

      let [l, c, h] = getColors(xValue, yValue)
      let color = new Color('oklch', [l / 100, c / 100, h])

      if (color.inGamut('p3')) {
        let inSRGB = color.inGamut('srgb')
        if (prevSRGB !== undefined && inSRGB !== prevSRGB) {
          color = color.mix(l < L_MAX / 2 ? '#fff' : '#000')
        }
        ctx.fillStyle = toOldRgb(color.srgb)
        ctx.fillRect(x, IMAGE_HEIGHT - y, 1, 1)
        prevSRGB = inSRGB
      } else {
        prevSRGB = false
      }
    }
  }

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
      await writeSpace(`l-${l}`, H_MAX, C_MAX, (h, c) => [l, c, h])
    })
  } else if (process.argv[2] === 'c') {
    await every(from, to, async c => {
      await writeSpace(`c-${c}`, H_MAX, L_MAX, (h, l) => [l, c, h])
    })
  } else {
    await every(from, to, async h => {
      await writeSpace(`h-${h}`, C_MAX, L_MAX, (c, l) => [l, c, h])
    })
  }
}

build().catch(e => {
  throw e
})
