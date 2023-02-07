/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { DataPoint } from "./data-point"


export type Grid3D<T> = (T | null)[][][]

export function makeGrid3D<T>(size: number) {
  let plank = () => new Array<T | null>(size).fill(null)

  let plane = () => new Array(size).fill(null).map(plank)

  let grid = () => new Array(size).fill(null).map(plane)

  return grid()
}

function isSurrounded(grid: Grid3D<any>, x: number, y: number, z: number) {
  // TODO get rid of try catch later
  try{
    return !!(
      !! grid[x - 1][y][z] && grid[x + 1][y][z]
      && grid[x][y - 1][z] && grid[x][y + 1][z]
      && grid[x][y][z - 1] && grid[x][y][z + 1]
    )
  }
  catch {
    return false
  }
}

export function hollowGrid(grid: Grid3D<any>) {
  let size = grid.length

  let cellsToDel: ([number, number, number])[] = []

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        if (isSurrounded(grid, x, y, z)) {
          cellsToDel.push([x,y,z])
        }
      }
    }
  }

  for (let [x,y,z] of cellsToDel) {
    grid[x][y][z] = null
  }
}

export function gridToArray<T>(grid: Grid3D<T>) {
  return grid
    .flat(2)
    .filter((vert): vert is T => !!vert)
}

export function gridToPoints<T>(grid: Grid3D<T>) {
  let size = grid.length

  let ps: DataPoint<T>[] = []

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        let item = grid[x][y][z]

        if (item === null) continue

        ps.push({
          data: item,
          pos: { x, y, z }
        })
      }
    }
  }

  return ps
}

export function resolveOverlaps<T>(
  grid: Grid3D<T[]>,
  resolve: (overlap: T[]) => T | null
) {
  let newGrid = makeGrid3D<T>(grid.length)

  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid.length; y++) {
      for (let z = 0; z < grid.length; z++) {
        let item = grid[x][y][z] || []

        let resolvedItem = item.length > 1
          ? resolve(item)
          : item[0] || null

        newGrid[x][y][z] = resolvedItem
      }
    }
  }

  return newGrid
}
