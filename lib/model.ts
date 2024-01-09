import Delaunator from 'delaunator'
import {
  BufferGeometry,
  type Camera,
  ColorManagement,
  DoubleSide,
  Float32BufferAttribute,
  LinearSRGBColorSpace,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  type Renderer,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { current, type LchValue } from '../stores/current.js'
import { biggestRgb, type RgbMode } from '../stores/settings.js'
import { type AnyRgb, build, rgb, toTarget } from './colors.js'

ColorManagement.enabled = false

interface UpdateSlice {
  (color: LchValue): void
}

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
          let edgeRgb: AnyRgb = { b: z, g: y, mode, r: x }
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

function generateMesh(scene: Scene, mode: RgbMode): UpdateSlice {
  scene.clear()

  let [coordinates, colors] = getModelData(mode)
  let top = new BufferGeometry().setFromPoints(coordinates)
  top.setAttribute('color', new Float32BufferAttribute(colors, 3))
  top.center()
  top.setIndex(
    Array.from(Delaunator.from(coordinates.map(c => [c.x, c.z])).triangles)
  )
  top.computeVertexNormals()

  let material = new MeshBasicMaterial({ side: DoubleSide, vertexColors: true })
  let l = new Vector2(0, 1)
  let c = new Vector2(0, 1)
  let h = new Vector2(0, 1)
  material.onBeforeCompile = shader => {
    shader.uniforms.sliceL = { value: l }
    shader.uniforms.sliceC = { value: c }
    shader.uniforms.sliceH = { value: h }
    shader.vertexShader = `
      varying vec3 vPos;
      ${shader.vertexShader}
    `.replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>
      vPos = transformed;
      `
    )
    shader.fragmentShader = `
      #define ss(a, b, c) smoothstep(a, b, c)
      uniform vec2 sliceL, sliceC, sliceH;
      varying vec3 vPos;
      ${shader.fragmentShader}
    `.replace(
      `#include <dithering_fragment>`,
      `#include <dithering_fragment>
        vec3 col = vec3(0.5, 0.5, 0.5);
        float width = 0.0025;
        float l = ss(width, 0., abs(vPos.x + sliceL.y));
        float c = ss(width, 0., abs(vPos.y + sliceC.y));
        float h = ss(width, 0., abs(vPos.z - sliceH.y));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, col, l);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, col, c);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, col, h);
      `
    )
  }

  let topMesh = new Mesh(top, material)
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
  bottom.rotateZ(Math.PI * 0.5)
  bottom.rotateX(-Math.PI * 0.5)
  let bottomMesh = new Mesh(bottom, material)
  scene.add(bottomMesh)

  return color => {
    l.set(0, 0.01 * -color.l + 0.5)
    c.set(0, (0.5 * -color.c) / C_MAX + 0.5)
    h.set(0, 0.0028 * color.h - (color.h > 350 ? 0.51 : 0.5))
  }
}

function initScene(
  canvas: HTMLCanvasElement,
  fullControl: boolean
): [Scene, Camera, Renderer, OrbitControls] {
  let canvasWidth = canvas.clientWidth
  let canvasHeight = canvas.clientHeight

  let scene = new Scene()
  let camera = new PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000)
  let renderer = new WebGLRenderer({ alpha: true, canvas })

  renderer.outputColorSpace = LinearSRGBColorSpace
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

export interface Model {
  camera: Camera
  start(): void
  started: boolean
  stop(): void
}

export function initCanvas(
  canvas: HTMLCanvasElement,
  fullscreen: boolean = false
): Model {
  let [scene, camera, renderer, controls] = initScene(canvas, fullscreen)

  function animate(): void {
    if (model.started) requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }

  let updateSlices: UpdateSlice
  let unbindMode: undefined | VoidFunction
  let unbindCurrent: undefined | VoidFunction

  let model = {
    camera,
    start(): void {
      unbindMode = biggestRgb.subscribe(value => {
        updateSlices = generateMesh(scene, value)
        if (!fullscreen) updateSlices(current.get())
      })

      if (!fullscreen) {
        unbindCurrent = current.subscribe(value => {
          updateSlices(value)
        })
      }

      model.started = true
      animate()
    },
    started: true,
    stop(): void {
      unbindCurrent?.()
      unbindMode?.()
      model.started = false
    }
  }

  model.start()

  return model
}
