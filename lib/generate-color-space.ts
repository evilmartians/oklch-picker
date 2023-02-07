/* eslint-disable @typescript-eslint/explicit-function-return-type */
// L 0-100
// C 0-0.4
// H 0-360
// A 0-1

import { LchValue } from "../stores/current"
import { detectColorSpace } from "../tools/detectColorSpace"
import { Cloud } from "./cloud"
import { resolveOverlaps } from "./grid-3d"
import { marchingCubes } from "./marching-cubes"
import { collapseVertices } from "./merge"
import { laplacianFilter } from "./smooth"
import { scaleVec3 } from "./vec3"

const L_MAX = 100
const PRECISION = 60
const HALF_PRECISION = PRECISION / 2

function cylindricalToCartesian(p: number, fDeg: number, z: number) {
  let fRad = fDeg / 360 * Math.PI * 2

  return {
    x: p * Math.cos(fRad),
    y: p * Math.sin(fRad),
    z,
  }
}

function avgLCH(lchs: LchValue[]) {
  let result = lchs.reduce((acc, item) => {
    return {
      l: acc.l + item.l,
      c: acc.c + item.c,
      h: acc.h + item.h,
      a: acc.a + item.a,
    }
  }, {l: 0, c: 0, h: 0, a: 0})

  return {
    l: result.l / lchs.length,
    c: result.c / lchs.length,
    h: result.h / lchs.length,
    a: result.a / lchs.length,
  }
}

export function generateColorSpaceVertices() {
  let srgbCloud = new Cloud<LchValue>()

  for (let x = 0; x < PRECISION; x++) {
    for (let y = 0; y < PRECISION; y++) {
      for (let z = 0; z < PRECISION; z++) {
        let normL = x / PRECISION
        let normC = y / PRECISION
        let normH = z / PRECISION

        let l = normL * L_MAX
        let c = normC * C_MAX
        let h = normH * H_MAX

        let lchPos: LchValue = { l, c, h, a: 100 }
        let spaceDot = detectColorSpace(lchPos)

        let cartesianDot = cylindricalToCartesian(c, h, l / L_MAX)

        if (spaceDot.space === 'srgb'
        // || color.space === 'srgb'
        // || color.space === 'rec2020'
        ) {
          srgbCloud.addPoints({
            pos: cartesianDot,
            data: lchPos
          })
        }
      }
    }
  }

  // Some how it cause gaps in grid
  srgbCloud.resetPosition()
  srgbCloud.normalizeScale()
  srgbCloud.resetPosition()

  let dirtyGrid3 = srgbCloud.toGrid3D(HALF_PRECISION)

  let grid3 = resolveOverlaps(
    dirtyGrid3,
    overlap => overlap.length ? avgLCH(overlap) : null
  )

  let grid3Bool = grid3.map(x => x.map(y => y.map(z => !!z)))
  let surface = marchingCubes(grid3Bool)

  let mesh = collapseVertices(surface)

  // Downscale mesh
  mesh.vertices = mesh.vertices.map(p => scaleVec3(p, 1 / PRECISION))

  mesh.vertices = laplacianFilter(mesh.vertices, mesh.indices, 6)

  return mesh
}
