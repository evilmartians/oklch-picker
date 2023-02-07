/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Bilateral3DMap } from "./bilateral-3d-maps";
import { Vec3Like } from "./vec3";

export function collapseVertices(intTriangles: Vec3Like[]) {
  let map = new Bilateral3DMap<number>()
  let indices: number[] = []
  let weldedVerts: Vec3Like[] = []

  for (let i = 0; i < intTriangles.length; i += 3) {
    let a = intTriangles[i + 0]
    let b = intTriangles[i + 1]
    let c = intTriangles[i + 2];

    ([a,b,c]).forEach(point => {
      if (!map.has(point.x, point.y, point.z)) {
        map.set(point.x, point.y, point.z, map.valuesCount)

        let [[x,y,z]] = map.getKeys(map.valuesCount - 1)
        weldedVerts.push({x,y,z})
      }

      let index = map.getValue(point.x, point.y, point.z)
      if (index !== undefined) indices.push(index)
    })
  }

  return {
    vertices: weldedVerts,
    indices
  }
}
