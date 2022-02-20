import { writeFile } from 'fs/promises'
import { join } from 'path'
import canvas from 'canvas'
import Color from 'colorjs.io'
import 'canvas-webp'

const IMAGE_WIDTH = 600
const IMAGE_HEIGHT = 200
const L_MAX = 100
const C_MAX = 150
const H_MAX = 360

const BUILD = process.argv[3]

async function every(to, cb) {
  for (let i = 0; i <= to; i++) {
    await cb(i)
    process.stdout.write(`${i / to}\n`)
  }
}

async function writeSpace(name, xMax, yMax, getColors) {
  let img = canvas.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT)
  let ctx = img.getContext('2d')

  for (let x = 0; x <= IMAGE_WIDTH; x++) {
    let xValue = (xMax * x) / IMAGE_WIDTH
    let prevSRGB, prevP3
    for (let y = 0; y <= IMAGE_WIDTH; y++) {
      let yValue = yMax - (yMax * y) / IMAGE_HEIGHT

      let [l, c, h] = getColors(xValue, yValue)
      let color = new Color('lch', [l, c, h])
      let inSRGB = color.inGamut('srgb')
      let inP3 = color.inGamut('p3')

      if (prevSRGB !== undefined && inSRGB !== prevSRGB) {
        color = color.mix(l < L_MAX / 2 ? '#fff' : '#000')
      }
      if (inP3) {
        ctx.fillStyle = toOldRgb(color.srgb)
        ctx.fillRect(x, y, 1, 1)
      } else if (prevP3) {
        break
      }

      prevSRGB = inSRGB
      prevP3 = inP3
    }
  }

  await writeFile(join(BUILD, `${name}.webp`), img.toBuffer('image/webp'))
}

function toOldRgb(coords) {
  return 'rgb(' + coords.map(i => Math.floor(255 * i)).join(',') + ')'
}

async function build() {
  if (process.argv[2] === 'l') {
    await every(L_MAX, async l => {
      await writeSpace(`l-${l}`, H_MAX, C_MAX, (h, c) => [l, c, h])
    })
  } else if (process.argv[2] === 'c') {
    await every(C_MAX, async c => {
      await writeSpace(`c-${c}`, H_MAX, L_MAX, (h, l) => [l, c, h])
    })
  } else {
    await every(H_MAX, async h => {
      await writeSpace(`h-${h}`, C_MAX, L_MAX, (c, l) => [l, c, h])
    })
  }
}

build().catch(e => {
  throw e
})
