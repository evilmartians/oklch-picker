/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { AmbientLight, BufferAttribute, BufferGeometry, DoubleSide, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Scene, Uint32BufferAttribute, Vector3, WebGLRenderer } from "three"

import { pixelRation } from "../../lib/screen.js"
import { MeshData } from "../../tools/color-shapes/mesh.js"
import { makeColorShapeFileName } from "../../tools/color-shapes/shape-name.js"

const plotCanvases = document.querySelectorAll<HTMLCanvasElement>('.plot-test')

plotCanvases.forEach(initPlot)

async function makeCloud() {
  let resp = await fetch(`/shapes/${makeColorShapeFileName('oklch', 'p3')}`)
  let mesh = await resp.json() as MeshData

  let origin = new Object3D()

  let vertices = new Float32Array(mesh.vertices)
  let colors = new Uint8Array(
    mesh.colors
      .map(c => c * 255)
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

  origin.scale.z *= 1.5

  return origin
}

async function initPlot(canvas: HTMLCanvasElement) {
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

  let cloud = await makeCloud()
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
    renderer.render(scene, cam)
  })
}
