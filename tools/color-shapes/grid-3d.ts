/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

export type Grid3D<T> = (T | null)[][][]

export function makeGrid3D<T>(size: number) {
  let plank = () => new Array<T | null>(size).fill(null)

  let plane = () => new Array(size).fill(null).map(plank)

  let grid = () => new Array(size).fill(null).map(plane)

  return grid()
}

export function resolveOverlaps<T>(
  grid: Grid3D<T[]>,
  resolve: (overlap: T[]) => T | null
) {
  let newGrid = makeGrid3D<T>(grid.length)

  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid.length; y++) {
      for (let z = 0; z < grid.length; z++) {
        let item = grid[x][y][z]

        if (!item) continue
        if (item.length === 0) continue

        let resolvedItem = item.length > 1
          ? resolve(item)
          : item[0] || null

        newGrid[x][y][z] = resolvedItem
      }
    }
  }

  return newGrid
}
