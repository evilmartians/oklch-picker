import type { Camera, Vector3 } from 'three'

let cameras = new Map<string, Camera>()

let last: Camera | undefined

function sync(camera: Camera, position: Vector3): void {
  let distance = camera.position.distanceTo(position.clone().set(0, 0, 0))
  camera.position.copy(position)
  camera.position.normalize().multiplyScalar(distance)
}

export function registerCamera(camera: Camera, id: string): void {
  cameras.set(id, camera)
  if (last) sync(camera, last.position)
}

export function syncCamerasFrom(sourceId: string): void {
  let sourceCamera = cameras.get(sourceId)
  if (sourceCamera) {
    last = sourceCamera
    let source = sourceCamera.position
    for (let [id, camera] of cameras.entries()) {
      if (id !== sourceId) {
        sync(camera, source)
      }
    }
  }
}
