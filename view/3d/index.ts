/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { AmbientLight, BufferAttribute, BufferGeometry, DoubleSide, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Scene, Uint32BufferAttribute, Vector3, WebGLRenderer } from "three"

import { pixelRation } from "../../lib/screen.js"
import { generateColorSpaceMesh } from "../../lib/generate-color-space.js"

const plotCanvases = document.querySelectorAll<HTMLCanvasElement>('.plot-test')

plotCanvases.forEach(initPlot)

function makeCloud() {
  let mesh = generateColorSpaceMesh(40)
  let origin = new Object3D()

  let vertices = new Float32Array(
    mesh.vertices
      .map(v => [v.x, v.y, v.z])
      .flat()
  )
  let colors = new Uint8Array(
    mesh.colors
      .map(rgb => [
        rgb.r * 255,
        rgb.g * 255,
        rgb.b * 255
      ])
      .flat()
  )

  let geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new BufferAttribute(vertices, 3)
  )
  geometry.setAttribute(
    'color',
    new BufferAttribute(colors, 3, true)
  )
  geometry.setIndex(new Uint32BufferAttribute(mesh.indices, 1))
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()

  let trisMesh = new Mesh(
    geometry,
    new MeshBasicMaterial({
      side: DoubleSide,
      vertexColors: true,
      fog: false,
    })
  )

  let size = new Vector3()
  geometry.boundingBox?.getSize(size)

  origin.add(trisMesh)
  trisMesh.position.sub(size.clone().multiplyScalar(1/2))

  origin.scale.z *= 0.8

  return origin
}

function initPlot(canvas: HTMLCanvasElement) {
  canvas.width = 500
  canvas.height = 500
  canvas.style.backgroundColor = '#999999'

  let glCtx = canvas.getContext('webgl')
  if (!glCtx) return

  let renderer = new WebGLRenderer({
    canvas,
    context: glCtx,
  })
  renderer.pixelRatio = pixelRation

  // Scene elements
  let scene = new Scene()

  let light = new AmbientLight('#fff', 1)
  light.rotateX(45)

  let cam = new PerspectiveCamera()

  let cloud = makeCloud()
  // let cloud = new Object3D()
  cloud.position.setZ(-2)

  // Assemble scene
  scene.add(cam)
  scene.add(light)
  scene.add(cloud)

  document.addEventListener('mousemove', e => {
    cloud.rotation.y = e.clientX / 100
    cloud.rotation.x = e.clientY / 100
  })

  renderer.setAnimationLoop(() => {
    // cloud.rotation.y += 0.02
    // cloud.rotation.y += 1 * (1 / 360) * Math.PI

    renderer.render(scene, cam)
  })
}
