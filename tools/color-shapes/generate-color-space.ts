/* eslint-disable @typescript-eslint/explicit-function-return-type */
// L 0-100
// C 0-0.4
// H 0-360
// A 0-1

import { clampChroma, rgb, Color, Rgb } from "culori"

import { makeSpaceDetector, Space } from "./detectColorSpace.js"
import { Cloud } from "./cloud.js"
import { resolveOverlaps } from "./grid-3d.js"
import { LchValue } from "../../lib/lch.js"
import { marchingCubes } from "./marching-cubes.js"
import { collapseVertices } from "./merge.js"
import { laplacianFilter } from "./smooth.js"
import { scaleVec3 } from "./vec3.js"
import { MeshData } from "./mesh.js"
import { GeneratorConfig } from "./generator-cfg.js"

const SHAPES: { [k in Space]: Space[] } = {
  srgb: ['srgb'],
  p3: ['srgb', 'p3'],
  rec2020: ['srgb', 'p3', 'rec2020']
}

function avgLCH(lchs: LchValue[]) {
  let l = 0
  let c = 0
  let h = 0
  let a = 0

  lchs.forEach(lch => {
    l += lch.l
    c += lch.c
    h += lch.h
    a += lch.a
  })

  return {
    l: l / lchs.length,
    c: c / lchs.length,
    h: h / lchs.length,
    a: a / lchs.length,
  }
}

function toRgb(color: Color): Rgb {
  return rgb(clampChroma(color, 'oklch'))
}

export function makeColorSpaceGenerator(cfg: GeneratorConfig) {
  let {
    C_MAX,
    C_MAX_REC2020,
    L_MAX,
    H_MAX,
    ALPHA_MAX,
  } = cfg

  let detectColorSpace = makeSpaceDetector(cfg)

  return function (
    shape: Space,
    density: number,
    smooth: number,
  ): MeshData {
    let lchCloud = new Cloud<LchValue>()
    let halfDensity = density / 2
    let inverseDensity = 1 / density

    let shapes = SHAPES[shape]

    let cMax = shape === 'rec2020'
      ? C_MAX_REC2020
      : C_MAX

    for (let x = 0; x < density; x++) {
      for (let y = 0; y < density; y++) {
        for (let z = 0; z < density; z++) {
          let normL = x / density
          let normC = y / density
          let normH = z / density

          let l = normL * L_MAX
          let c = normC * cMax
          let h = normH * H_MAX

          let lchPos: LchValue = { l, c, h, a: ALPHA_MAX }
          let space = detectColorSpace(lchPos)

          if (!space) continue
          if (!shapes.includes(space)) continue

          lchCloud.addPoints({
            pos: { x,y,z },
            data: lchPos
          })
        }
      }
    }

    // Some how it cause gaps in grid
    lchCloud.resetPosition()
    lchCloud.normalizeScale()
    lchCloud.resetPosition()

    let dirtyGrid = lchCloud.toGrid3D(halfDensity, 1)

    let grid = resolveOverlaps(
      dirtyGrid,
      overlap => overlap.length ? overlap[0] : null
    )

    let surfaceGrid = marchingCubes(
      grid,
      (a, b) => {
        if (!a && !b) return null
        if (a && b) return avgLCH([a, b])
        return a || b
      },
      item => !!item
    )

    let mesh = collapseVertices(
      surfaceGrid,
      items => items.length ? avgLCH(items) : null
    )

    // Downscale mesh
    mesh.vertices = mesh.vertices.map(p => scaleVec3(p, inverseDensity))

    mesh.vertices = laplacianFilter(mesh.vertices, mesh.indices, smooth)

    let colors = mesh.data
      .map(color => {
        let {r,g,b} = toRgb({
          mode: 'oklch',
          l: (color?.l || 0) / L_MAX,
          c: color?.c || 0,
          h: color?.h || 0,
          alpha: color?.a || 0
        })

        return [r,g,b]
      })
      .flat()

    let numVerts = mesh.vertices.map(v => [v.x, v.y, v.z]).flat()

    return {
      vertices: numVerts,
      indices: mesh.indices,
      colors
    }
  }
}
