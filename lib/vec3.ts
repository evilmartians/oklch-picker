export type Vec3Like = {
  x: number
  y: number
  z: number
}

export function scaleVec3(vec: Vec3Like, scalar: number): Vec3Like {
  return {
    x: vec.x * scalar,
    y: vec.y * scalar,
    z: vec.z * scalar,
  }
}
