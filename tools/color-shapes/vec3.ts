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

function lerp(a: number, b: number, t: number): number {
  let dif = b - a

  return a + dif * t
}

export function lerpVec3(a: Vec3Like, b: Vec3Like, t: number): Vec3Like {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  }
}
