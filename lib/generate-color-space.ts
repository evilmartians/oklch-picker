/* eslint-disable @typescript-eslint/explicit-function-return-type */
// L 0-100
// C 0-0.4
// H 0-360
// A 0-1

import { LchValue } from "../stores/current.js"
import { detectColorSpace } from "../tools/detectColorSpace.js"
import { Cloud } from "./cloud.js"
import { toRgb } from "./colors.js"
import { resolveOverlaps } from "./grid-3d.js"
import { marchingCubes } from "./marching-cubes.js"
import { collapseVertices } from "./merge.js"
import { laplacianFilter } from "./smooth.js"
import { scaleVec3 } from "./vec3.js"

const L_MAX = 100

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

export function generateColorSpaceMesh(density: number) {
  let srgbCloud = new Cloud<LchValue>()
  let halfDensity = density / 2
  let inverseDensity = 1 / density

  for (let x = 0; x < density; x++) {
    for (let y = 0; y < density; y++) {
      for (let z = 0; z < density; z++) {
        let normL = x / density
        let normC = y / density
        let normH = z / density

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

  let dirtyGrid = srgbCloud.toGrid3D(halfDensity, 1)

  let grid = resolveOverlaps(
    dirtyGrid,
    overlap => overlap.length
      ? overlap[0]
      : null
  )

  let surfaceGrid = marchingCubes(
    grid,
    (a, b) => {
      if (!a && !b) return null
      if (a && b) return avgLCH([a,b])
      return a || b
    },
    item => !!item
  )

  let mesh = collapseVertices(
    surfaceGrid,
    items => {
      return items.length
        ? avgLCH(items)
        : null
    }
  )

  // Downscale mesh
  mesh.vertices = mesh.vertices.map(p => scaleVec3(p, inverseDensity))

  mesh.vertices = laplacianFilter(mesh.vertices, mesh.indices, 4)

  let colors = mesh.data.map(color => toRgb({
    mode: 'oklch',
    l: (color?.l || 0) / L_MAX,
    c: color?.c || 0,
    h: color?.h || 0,
    alpha: color?.a || 0
  }))

  return {
    vertices: mesh.vertices,
    indices: mesh.indices,
    colors
  }
}
