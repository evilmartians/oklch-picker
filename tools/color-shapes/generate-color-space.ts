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

type RgbValue = {
  r: number
  g: number
  b: number
}

const SHAPES: { [k in Space]: Space[] } = {
  srgb: ['srgb'],
  p3: ['srgb', 'p3'],
  rec2020: ['srgb', 'p3', 'rec2020']
}

function avgRGB(colors: RgbValue[]) {
  let r = 0
  let g = 0
  let b = 0

  colors.forEach(c => {
    r += c.r
    g += c.g
    b += c.b
  })

  return {
    r: r / colors.length,
    g: g / colors.length,
    b: b / colors.length,
  }
}

export function makeColorSpaceGenerator(cfg: GeneratorConfig) {
  let {
    C_MAX,
    C_MAX_REC2020,
    L_MAX,
    H_MAX,
    ALPHA_MAX,
    COLOR_FN
  } = cfg

  let detectColorSpace = makeSpaceDetector(cfg)

  return function (
    shape: Space,
    density: number,
    smooth: number,
  ): MeshData {
    let lchCloud = new Cloud<RgbValue>()
    let halfDensity = density / 2
    let inverseDensity = 1 / density

    let shapes = SHAPES[shape]

    let cMax = shape === 'rec2020'
      ? C_MAX_REC2020
      : C_MAX

    // I dont know why
    let hFixFactor = COLOR_FN === 'lch' ? 1 : 1.065

    function toRgb(color: Color): Rgb {
      return rgb(clampChroma(color, COLOR_FN))
    }

    for (let x = 0; x < density; x++) {
      for (let y = 0; y < density; y++) {
        for (let z = 0; z < density; z++) {
          let normL = x / density
          let normC = y / density
          let normH = z / density

          let l = normL * L_MAX
          let c = normC * cMax
          let h = normH * H_MAX

          let lch: LchValue = { l, c, h, a: ALPHA_MAX }
          let space = detectColorSpace(lch)

          if (!space) continue
          if (!shapes.includes(space)) continue

          let rgbData = toRgb({
            mode: COLOR_FN,
            l,
            c,
            h: h * hFixFactor,
            alpha: lch.a,
          })

          lchCloud.addPoints({
            pos: { x,y,z },
            data: rgbData
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
        if (a && b) return avgRGB([a, b])
        return a || b
      },
      item => !!item
    )

    let mesh = collapseVertices(
      surfaceGrid,
      items =>  items.length ? avgRGB(items) : null
    )

    // Downscale mesh
    mesh.vertices = mesh.vertices.map(p => scaleVec3(p, inverseDensity))

    mesh.vertices = laplacianFilter(mesh.vertices, mesh.indices, smooth)

    let colors = mesh.data
      .map(color => {
        let {r = 0,g = 0,b = 0} = color || {}
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
