/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { DataPoint } from "./data-point"
import { makeGrid3D } from "./grid-3d"
import { Vec3Like } from "./vec3"

class AABB {
  public l = 0
  public r = 0
  public t = 0
  public bottom = 0
  public f = 0
  public back = 0

  public get maxDim() {
    return Math.max(
      Math.abs(this.r - this.l),
      Math.abs(this.t - this.bottom),
      Math.abs(this.f - this.back),
    )
  }

  public fit(p: Vec3Like) {
    this.l = Math.min(this.l, p.x)
    this.r = Math.max(this.r, p.x)

    this.t = Math.max(this.t, p.y)
    this.bottom = Math.min(this.bottom, p.y)

    this.f = Math.max(this.f, p.z)
    this.back = Math.min(this.back, p.z)
  }

  public scale(n: number) {
    this.back *= n
    this.bottom *= n
    this.f *= n
    this.l *= n
    this.r *= n
    this.t *= n
  }

  public resetPosition() {
    this.r -= this.l
    this.t -= this.bottom
    this.f -= this.back
    this.l = 0
    this.bottom = 0
    this.back = 0
  }
}

export class Cloud<D, DP extends DataPoint<D> = DataPoint<D>> {
  public aabb = new AABB()
  public points: DP[] = []

  public addPoints(...ps: DP[]) {

    ps.forEach(p => { this.aabb.fit(p.pos) })

    this.points.push(...ps)
  }

  public resetPosition() {
    this.points.forEach(p => {
      p.pos.x -= this.aabb.l
      p.pos.y -= this.aabb.bottom
      p.pos.z -= this.aabb.back
    })

    this.aabb.resetPosition()
  }

  public normalizeScale() {
    let maxDim = this.aabb.maxDim

    let inverseScale = 1 / maxDim

    this.points.forEach(p => {
      p.pos.x *= inverseScale
      p.pos.y *= inverseScale
      p.pos.z *= inverseScale
    })

    this.aabb.scale(inverseScale)
  }

  public toGrid3D(size: number, offset = 0) {
    let grid = makeGrid3D<D[]>(size + offset)

    this.points.forEach(({ data, pos }) => {
      let x = Math.floor(pos.x * size) + offset
      let y = Math.floor(pos.y * size) + offset
      let z = Math.floor(pos.z * size) + offset

      let item = grid[x][y][z] || []

      item.push(data)

      grid[x][y][z] = item
    })

    return grid
  }
}
