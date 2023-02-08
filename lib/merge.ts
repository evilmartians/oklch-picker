/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Bilateral3DMap } from "./bilateral-3d-maps";
import { DataPoint } from "./data-point";
import { Vec3Like } from "./vec3";

export function collapseVertices<T>(
  intTriangles: DataPoint<T | null>[],
  collapse: (data: T[]) => T | null
) {
  let map = new Bilateral3DMap<number>()
  let dataMap = new Bilateral3DMap<T[]>()
  let indices: number[] = []

  let weldedVerts: Vec3Like[] = []
  let weldedData: (T | null)[] = []

  for (let i = 0; i < intTriangles.length; i += 3) {
    let a = intTriangles[i + 0]
    let b = intTriangles[i + 1]
    let c = intTriangles[i + 2];

    ([a,b,c]).forEach(point => {
      let {x,y,z} = point.pos
      let data = point.data

      // Set data`s
      let datas = dataMap.getValue(x,y,z) || []
      if (data) datas.push(data)
      dataMap.set(datas, x,y,z)

      if (!map.has(x, y, z)) {
        // Setp verts
        map.set(map.valuesCount, x, y, z)

        // Generate welded verts
        let [[wx, wy, wz]] = map.getKeys(map.valuesCount - 1)
        weldedVerts.push({x: wx, y: wy, z: wz})

        // Generate datas
        let items = dataMap.getValue(wx, wy, wz)
        let collapsedItem = collapse(items || [])
        weldedData.push(collapsedItem)
      }

      // Generate indices
      let index = map.getValue(x, y, z)
      if (index !== undefined) {
        indices.push(index)
      }
    })
  }

  return {
    vertices: weldedVerts,
    indices,
    data: weldedData
  }
}
