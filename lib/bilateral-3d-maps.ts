/* eslint-disable @typescript-eslint/explicit-function-return-type */
type Map3D<T> = {
  [x: number]: undefined | {
    [y: number]: undefined | {
      [z: number]: undefined | T
    }
  }
}

type XYZTuple = [x: number, y: number, z: number]

type XYZString = ReturnType<typeof xyzToString>

function xyzToString(...[x,y,z]: XYZTuple) {
  return `${x}_${y}_${z}` as const
}
function stringToXYZ(str: string) {
  return str
    .split('_')
    .map(Number) as XYZTuple
}

export class Bilateral3DMap<T> {
  private keys_value: Map3D<T> = {}

  private value_keys = new Map<T, XYZString[]>()

  public get valuesCount() {
    return this.value_keys.size
  }

  public has(x: number, y: number, z: number) {
    let yLayer = this.keys_value[x]?.[y] || {}

    return z in yLayer
  }

  public set(x: number, y: number, z: number, value: T) {
    // set key - value
    let xLayer = this.keys_value[x] || {}
    let yLayer = xLayer[y] || {}

    yLayer[z] = value

    xLayer[y] = yLayer
    this.keys_value[x] = xLayer

    // set value - key
    let keys = this.value_keys.get(value) || []
    let xyzStr = xyzToString(x,y,z)

    if (!keys.includes(xyzStr)) keys.push(xyzStr)

    this.value_keys.set(value, keys)
  }

  public getValue(...[x,y,z]: XYZTuple) {
    return this.keys_value[x]?.[y]?.[z]
  }

  public getKeys(value: T) {
    let keys = this.value_keys.get(value)

    return keys?.map(stringToXYZ) || []
  }
}
