/* eslint-disable @typescript-eslint/explicit-function-return-type */
import fs from 'fs/promises'
import path from 'path'

import { Space } from './detectColorSpace.js';
import { makeColorSpaceGenerator } from './generate-color-space.js';
import config from '../../config.js'
import { makeColorShapeFileName } from './shape-name.js';

// fix '"lch"' to 'lch'. Why so bad code...
config.COLOR_FN = JSON.parse(config.COLOR_FN)

let generateColorSpaceMesh = makeColorSpaceGenerator(config)

const DST = path.resolve('./public/shapes')

const SHAPES: Space[] = ['srgb', 'p3', 'rec2020']

async function main() {
  SHAPES.forEach(shape => {
    let mesh = generateColorSpaceMesh(shape, 80, 3)

    let bin = JSON.stringify(mesh)

    let fileName = makeColorShapeFileName(config.COLOR_FN, shape)

    fs.writeFile(path.join(DST, fileName), bin)
  })
}

main()
