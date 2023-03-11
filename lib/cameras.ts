import type { Camera } from 'three'

let cameras = new Map<string, Camera>()

export function registerCamera(camera: Camera, id: string): void {
  cameras.set(id, camera)
}

export function syncCamerasFrom(sourceId: string): void {
  let source = cameras.get(sourceId)?.position
  if (source) {
    for (let [id, camera] of cameras.entries()) {
      if (id !== sourceId) {
        camera.position.set(source.x, source.y, source.z)
      }
    }
  }
}
