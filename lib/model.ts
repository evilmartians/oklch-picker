import {
  Float32BufferAttribute,
  MeshBasicMaterial,
  PerspectiveCamera,
  BufferGeometry,
  PlaneGeometry,
  WebGLRenderer,
  DoubleSide,
  Renderer,
  Vector3,
  Camera,
  Scene,
  Mesh
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Delaunator from 'delaunator'

import { toTarget, rgb, build, AnyRgb } from './colors.js'
import { biggestRgb, RgbMode } from '../stores/settings.js'

function onGamutEdge(r: number, g: number, b: number): boolean {
  return r === 0 || g === 0 || b === 0 || r > 0.99 || g > 0.99 || b > 0.99
}

function getModelData(mode: RgbMode): [Vector3[], number[]] {
  let coordinates: Vector3[] = []
  let colors: number[] = []

  for (let x = 0; x <= 1; x += 0.01) {
    for (let y = 0; y <= 1; y += 0.01) {
      for (let z = 0; z <= 1; z += 0.01) {
        if (onGamutEdge(x, y, z)) {
          let edgeRgb: AnyRgb = { mode, r: x, g: y, b: z }
          let to = toTarget(edgeRgb)
          if (to.h) {
            colors.push(edgeRgb.r, edgeRgb.g, edgeRgb.b)
            coordinates.push(
              new Vector3(to.l / L_MAX, to.c / (C_MAX * 2), to.h / 360)
            )
          }
        }
      }
    }
  }

  let bounds = [
    [0, 0, 0],
    [0, 0, 1],
    [1, 0, 0],
    [1, 1, 0],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1]
  ]
  for (let i of bounds) {
    coordinates.push(new Vector3(...i))
    colors.push(i[0], i[0], i[0])
  }

  return [coordinates, colors]
}

function generateMesh(scene: Scene, mode: RgbMode): void {
  scene.clear()

  let [coordinates, colors] = getModelData(mode)
  let top = new BufferGeometry().setFromPoints(coordinates)
  top.setAttribute('color', new Float32BufferAttribute(colors, 3))
  top.center()
  top.setIndex(
    Array.from(Delaunator.from(coordinates.map(c => [c.x, c.z])).triangles)
  )
  top.computeVertexNormals()
  let topMesh = new Mesh(
    top,
    new MeshBasicMaterial({ vertexColors: true, side: DoubleSide })
  )
  topMesh.translateY(0.3)
  scene.add(topMesh)

  let bottom = new PlaneGeometry(1, 1, 1, 20)
  let bottomColors = []
  if ('array' in bottom.attributes.position) {
    let bottomSteps = bottom.attributes.position.array.length / 6
    for (let i = 0; i <= bottomSteps; i += 1) {
      let lchL = (L_MAX * i) / bottomSteps
      let rgbL = rgb(build(lchL, 0, 0)).r
      bottomColors.push(rgbL, rgbL, rgbL, rgbL, rgbL, rgbL)
    }
  }
  bottom.setAttribute('color', new Float32BufferAttribute(bottomColors, 3))
  bottom.translate(0, 0, -0.2)
  let bottomMesh = new Mesh(
    bottom,
    new MeshBasicMaterial({ vertexColors: true, side: DoubleSide })
  )
  bottomMesh.rotateX(-Math.PI * 0.5)
  bottomMesh.rotateZ(Math.PI * 0.5)
  scene.add(bottomMesh)
}

function initScene(
  canvas: HTMLCanvasElement,
  fullControl: boolean
): [Scene, Camera, Renderer, OrbitControls] {
  let canvasWidth = canvas.clientWidth
  let canvasHeight = canvas.clientHeight

  let scene = new Scene()
  let camera = new PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000)
  let renderer = new WebGLRenderer({ canvas, alpha: true })

  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(canvasWidth, canvasHeight)
  camera.position.set(0.79, 0, 0.79)
  camera.lookAt(new Vector3(0, 1, 0))

  let controls = new OrbitControls(camera, renderer.domElement)
  controls.enablePan = fullControl
  controls.enableZoom = fullControl
  if (fullControl) {
    controls.minDistance = 0.9
    controls.maxDistance = 3
  }

  return [scene, camera, renderer, controls]
}

export function initCanvas(
  canvas: HTMLCanvasElement,
  fullControl: boolean = false
): Camera {
  let [scene, camera, renderer, controls] = initScene(canvas, fullControl)
  generateMesh(scene, biggestRgb.get())

  function animate(): void {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  biggestRgb.listen(value => {
    generateMesh(scene, value)
  })

  return camera
}
