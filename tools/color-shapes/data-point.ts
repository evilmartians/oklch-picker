import { Vec3Like } from "./vec3.js"

export type DataPoint<T> = {
  data: T
  pos: Vec3Like
}
